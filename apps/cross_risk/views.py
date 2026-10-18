"""
Multi-Disease Cross-Risk Engine API Views.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .serializers import CrossRiskAnalysisSerializer
from .services import CrossRiskService

logger = logging.getLogger(__name__)


class CrossRiskAnalyzeView(APIView):
    """
    POST /api/cross-risk/analyze/
    Analyzes systemic risk profiles across multiple disease predictions.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = CrossRiskAnalysisSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        predictions = serializer.validated_data["predictions"]

        try:
            result = CrossRiskService.analyze(predictions)
            return Response({"success": True, "data": result, **result}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Error during cross-risk syndromic analysis")
            return Response(
                {
                    "success": False,
                    "error": "Failed to analyze cross-organ risk profile.",
                    "status": "analysis_error"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
