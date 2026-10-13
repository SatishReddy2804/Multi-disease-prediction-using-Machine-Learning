from django.urls import path
from .views import LiverPredictView

app_name = "liver"

urlpatterns = [
    path("liver/", LiverPredictView.as_view(), name="predict_liver"),
]
