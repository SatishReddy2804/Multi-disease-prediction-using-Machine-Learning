"""
Parkinson's Disease Prediction API Views.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import ParkinsonsPredictionSerializer
from .services import ParkinsonsPredictionService
from apps.dashboard.models import PredictionHistory

logger = logging.getLogger(__name__)


class ParkinsonsPredictView(APIView):
    """
    POST: Run Parkinson's disease inference, data quality gating,
    uncertainty shield evaluation, and medical triage.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ParkinsonsPredictionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        validated_data = serializer.validated_data

        try:
            result = ParkinsonsPredictionService.predict(validated_data)

            # Persist to history if user is authenticated
            user = request.user if request.user.is_authenticated else None
            try:
                PredictionHistory.objects.create(
                    user=user,
                    disease_type="parkinsons",
                    input_data=validated_data,
                    prediction_result=result["prediction"],
                    probability=result["probability"],
                    risk_level=result["risk_level"],
                    uncertainty_level=result["uncertainty"].get("uncertainty_level", "Low"),
                    trust_status=result["uncertainty"].get("trust_status", "RELIABLE"),
                    data_quality_score=result["data_quality"].get("score", 100)
                )
            except Exception as e:
                logger.warning(f"Could not persist prediction history: {e}")

            return Response({"success": True, "data": result}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Unexpected error in Parkinson's prediction")
            return Response(
                {
                    "success": False,
                    "error": "An internal error occurred during prediction analysis. Please try again.",
                    "status": "service_error"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
