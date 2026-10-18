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


class HealthCheckView(APIView):
    """
    Health check endpoint verifying Django DB connection and ML model readiness.
    Returns HTTP 200 if all services and models are ready, HTTP 503 otherwise.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from django.db import connection
        from datetime import datetime

        db_ok = True
        db_message = "connected"
        try:
            connection.ensure_connection()
        except Exception as e:
            db_ok = False
            db_message = f"error: {e}"

        models_status = {}
        all_models_ok = True
        try:
            from ml.src.inference import ModelRegistry
            registry = ModelRegistry()
            for disease in ["heart", "diabetes", "parkinsons", "liver"]:
                try:
                    bundle = registry.get_bundle(disease)
                    models_status[disease] = {
                        "status": "available",
                        "model": bundle.get("best_model_name", "TrainedModel"),
                        "features_count": len(bundle.get("feature_names", [])),
                    }
                except Exception as e:
                    all_models_ok = False
                    models_status[disease] = {
                        "status": "unavailable",
                        "error": str(e),
                    }
        except Exception as e:
            all_models_ok = False
            models_status = {"error": str(e)}

        healthy = db_ok and all_models_ok
        payload = {
            "status": "healthy" if healthy else "degraded",
            "service": "multi-disease-prediction-system",
            "database": db_message,
            "models": models_status,
            "timestamp": datetime.utcnow().isoformat(),
        }
        return Response(
            payload,
            status=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        )
