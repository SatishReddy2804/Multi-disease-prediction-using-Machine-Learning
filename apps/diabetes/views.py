import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .serializers import DiabetesPredictionSerializer
from .services import DiabetesPredictionService
from apps.data_quality.services import DataQualityService
from apps.triage.services import TriageService
from apps.uncertainty.services import UncertaintyService
from apps.dashboard.models import PredictionHistory

logger = logging.getLogger(__name__)


class DiabetesPredictView(APIView):
    """
    Diabetes Prediction Endpoint implementing the 9-step clinical diagnostic flow:
    1. Input Validation
    2. Data Quality Assessment
    3. Quality threshold gate (<60 check unless red flag)
    4. ML Model Inference
    5. Uncertainty Estimation & Trust Badge
    6. Explainability / Feature Contribution
    7. Triage Red Flag Check
    8. Prediction History Persistence
    9. Comprehensive JSON Output
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DiabetesPredictionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data

        try:
            # 2. Run data quality check
            quality_result = DataQualityService.check("diabetes", validated_data)
            quality_score = quality_result.get("quality_score", 100.0)

            # 7. Check triage red flags
            triage_result = TriageService.evaluate("diabetes", validated_data)
            is_critical = triage_result.get("priority") in ["IMMEDIATE", "URGENT"]

            # 3. If quality < 60, return warning unless critical red flag
            if quality_score < 60.0 and not is_critical:
                return Response(
                    {
                        "status": "data_quality_warning",
                        "error": "Input data quality score is below acceptable clinical threshold (60%). Please verify input parameters.",
                        "data_quality": quality_result,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # 4. Run prediction via inference service
            try:
                prediction_result = DiabetesPredictionService.predict(validated_data)
            except FileNotFoundError:
                return Response(
                    {
                        "error": "Model not trained yet",
                        "status": "model_unavailable",
                        "disease_type": "diabetes",
                        "data_quality": quality_result,
                        "triage": triage_result,
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            except Exception as e:
                logger.warning(f"Inference module execution failure: {e}")
                return Response(
                    {
                        "warning": "ML pipeline degraded. Partial results returned.",
                        "status": "partial_success",
                        "disease_type": "diabetes",
                        "data_quality": quality_result,
                        "triage": triage_result,
                    },
                    status=status.HTTP_200_OK,
                )

            prob = prediction_result.get("probability", 0.0)
            res_code = prediction_result.get("prediction_result", 0)
            risk_level = prediction_result.get("risk_level", "Low")
            explainability = prediction_result.get("explainability", {})

            # 5. Run uncertainty analysis
            uncertainty_result = UncertaintyService.evaluate(
                disease_type="diabetes",
                probability=prob,
                input_data=validated_data,
                data_quality_score=quality_score,
            )

            # 8. Save to PredictionHistory
            user = request.user if request.user.is_authenticated else None
            history_record = PredictionHistory.objects.create(
                user=user,
                disease_type="diabetes",
                input_data=validated_data,
                prediction_result=res_code,
                probability=prob,
                risk_level=risk_level,
                uncertainty_level=uncertainty_result.get("uncertainty_level", "Low"),
                trust_status=uncertainty_result.get("trust_status", "High Trust"),
                data_quality_score=quality_score,
            )

            # 9. Return comprehensive response
            return Response(
                {
                    "prediction_id": history_record.id,
                    "disease_type": "diabetes",
                    "prediction_result": res_code,
                    "probability": prob,
                    "risk_level": risk_level,
                    "uncertainty": uncertainty_result,
                    "data_quality": quality_result,
                    "explainability": explainability,
                    "triage": triage_result,
                    "prevention_guidance": prediction_result.get("prevention_guidance", []),
                    "medicine_information": prediction_result.get("medicine_information", []),
                    "disclaimer": prediction_result.get("disclaimer", ""),
                    "timestamp": history_record.created_at,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception(f"Unhandled error during diabetes prediction: {e}")
            return Response(
                {
                    "error": "Failed to process prediction request.",
                    "status": "error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
