from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .services import UncertaintyService


class UncertaintyAnalysisView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        disease_type = request.data.get("disease_type", "general")
        probability = request.data.get("probability")
        input_data = request.data.get("input_data", {})
        data_quality_score = request.data.get("data_quality_score", 100.0)

        if probability is None:
            return Response(
                {"error": "Field 'probability' (float between 0.0 and 1.0) is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            prob_val = float(probability)
            quality_val = float(data_quality_score)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid numerical values for probability or data_quality_score."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = UncertaintyService.evaluate(
            disease_type=disease_type,
            probability=prob_val,
            input_data=input_data,
            data_quality_score=quality_val,
        )
        return Response(result, status=status.HTTP_200_OK)
