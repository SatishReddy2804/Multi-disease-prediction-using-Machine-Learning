from django.urls import path
from .views import WhatIfSimulateView

app_name = "what_if"

urlpatterns = [
    path("what-if/simulate/", WhatIfSimulateView.as_view(), name="simulate_what_if"),
]
