from django.urls import path
from .views import CrossRiskAnalyzeView

app_name = "cross_risk"

urlpatterns = [
    path("cross-risk/analyze/", CrossRiskAnalyzeView.as_view(), name="analyze_cross_risk"),
]
