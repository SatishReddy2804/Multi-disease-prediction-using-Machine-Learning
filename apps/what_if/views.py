"""
Counterfactual What-If Simulation API Views.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .serializers import WhatIfSimulationSerializer
from .services import WhatIfService

logger = logging.getLogger(__name__)


class WhatIfSimulateView(APIView):
    """
    POST /api/what-if/simulate/
    Simulate counterfactual risk changes for modifiable clinical values.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = WhatIfSimulationSerializer(data=request.data)
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
            result = WhatIfService.simulate(
                disease_type=validated_data["disease_type"],
                original_input=validated_data["original_input"],
                modified_values=validated_data["modified_values"]
            )
            return Response({"success": True, "data": result}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Error during what-if risk simulation")
            return Response(
                {
                    "success": False,
                    "error": "Failed to complete counterfactual simulation. Please check your inputs.",
                    "status": "simulation_error"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
