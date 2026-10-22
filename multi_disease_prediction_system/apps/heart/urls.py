from django.urls import path
from .views import HeartPredictView

app_name = "heart"

urlpatterns = [
    path("heart/", HeartPredictView.as_view(), name="predict"),
]
