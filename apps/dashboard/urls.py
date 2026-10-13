from django.urls import path
from .views import (
    HistoryListView,
    DashboardStatsView,
    ModelEvaluationView,
)

app_name = "dashboard"

urlpatterns = [
    path("history/", HistoryListView.as_view(), name="history_list"),
    path("stats/", DashboardStatsView.as_view(), name="stats"),
    path("model-evaluation/", ModelEvaluationView.as_view(), name="model_evaluation"),
]
