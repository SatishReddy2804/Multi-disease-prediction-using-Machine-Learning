from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from .models import PredictionHistory
from .serializers import PredictionHistorySerializer
from .services import get_dashboard_stats, get_model_evaluation_data


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        stats = get_dashboard_stats(user=user)
        return Response(stats, status=status.HTTP_200_OK)


class HistoryListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PredictionHistorySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ["disease_type", "risk_level", "prediction_result"]
    ordering_fields = ["created_at", "probability", "data_quality_score"]
    ordering = ["-created_at"]
    search_fields = ["disease_type", "risk_level"]

    def get_queryset(self):
        user = self.request.user
        queryset = PredictionHistory.objects.all()
        if not user.is_staff:
            queryset = queryset.filter(user=user)

        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        return queryset


class ModelEvaluationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = get_model_evaluation_data()
        return Response(data, status=status.HTTP_200_OK)
