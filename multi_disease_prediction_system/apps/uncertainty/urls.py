from django.urls import path
from .views import UncertaintyAnalysisView

app_name = "uncertainty"

urlpatterns = [
    path("uncertainty/", UncertaintyAnalysisView.as_view(), name="analyze"),
]
