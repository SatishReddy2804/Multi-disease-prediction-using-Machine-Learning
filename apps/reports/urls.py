from django.urls import path
from .views import GenerateReportView, DownloadReportView, ReportListView

app_name = "reports"

urlpatterns = [
    path("reports/", ReportListView.as_view(), name="list_reports"),
    path("reports/generate/", GenerateReportView.as_view(), name="generate_report"),
    path("reports/<uuid:report_id>/download-pdf/", DownloadReportView.as_view(), name="download_report"),
]
