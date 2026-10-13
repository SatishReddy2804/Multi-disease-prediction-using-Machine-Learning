from django.urls import path
from .views import ParkinsonsPredictView

app_name = "parkinsons"

urlpatterns = [
    path("parkinsons/", ParkinsonsPredictView.as_view(), name="predict_parkinsons"),
]
