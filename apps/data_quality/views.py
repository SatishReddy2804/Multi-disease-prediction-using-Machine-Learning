from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import DataQualityCheckSerializer
from .services import DataQualityService


class DataQualityCheckView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DataQualityCheckSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        disease_type = serializer.validated_data["disease_type"]
        input_data = serializer.validated_data["input_data"]

        result = DataQualityService.check(disease_type, input_data)
        return Response({"success": True, "data": result, **result}, status=status.HTTP_200_OK)
