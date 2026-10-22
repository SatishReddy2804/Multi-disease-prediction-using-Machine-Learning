from django.urls import path
from .views import DataQualityCheckView

app_name = "data_quality"

urlpatterns = [
    path("data-quality/check/", DataQualityCheckView.as_view(), name="check"),
]
