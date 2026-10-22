from django.urls import path
from .views import DiabetesPredictView

app_name = "diabetes"

urlpatterns = [
    path("diabetes/", DiabetesPredictView.as_view(), name="predict"),
]
