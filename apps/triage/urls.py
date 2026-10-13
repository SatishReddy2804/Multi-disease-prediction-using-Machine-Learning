from django.urls import path
from .views import TriagePriorityView

app_name = "triage"

urlpatterns = [
    path("triage/priority/", TriagePriorityView.as_view(), name="priority"),
]
