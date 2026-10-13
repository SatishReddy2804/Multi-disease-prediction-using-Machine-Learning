"""
Reports API Views for Generating, Downloading, and Listing Clinical Summaries.
"""

import os
import logging
from pathlib import Path
from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import GeneratedReport
from .serializers import GenerateReportRequestSerializer, GeneratedReportSerializer
from .services import ReportService

logger = logging.getLogger(__name__)

class GenerateReportView(APIView):
    """
    POST /api/reports/generate/
    Builds a Clinician-Ready PDF case summary and returns the report ID and download link.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = GenerateReportRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": "Validation failed", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user if request.user.is_authenticated else None
        try:
            report_result = ReportService.generate_pdf_report(serializer.validated_data, user=user)
            return Response({"success": True, "data": report_result}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Failed to generate PDF summary report")
            return Response(
                {"success": False, "error": "Error generating clinical PDF summary."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DownloadReportView(APIView):
    """
    GET /api/reports/<report_id>/download-pdf/
    Downloads the generated Clinician-Ready PDF case summary.
    """
    permission_classes = [AllowAny]

    def get(self, request, report_id, *args, **kwargs):
        try:
            report = GeneratedReport.objects.get(report_id=report_id)
        except GeneratedReport.DoesNotExist:
            raise Http404("Report not found.")

        file_path = Path(report.pdf_file_path)
        if not file_path.exists():
            raise Http404("Report file does not exist on server.")

        response = FileResponse(open(file_path, "rb"), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{report.disease_type}_summary_{report_id[:8]}.pdf"'
        return response


class ReportListView(APIView):
    """
    GET /api/reports/
    List generated reports for the current user.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            reports = GeneratedReport.objects.filter(user=request.user)
        else:
            reports = GeneratedReport.objects.all()[:20]

        serializer = GeneratedReportSerializer(reports, many=True)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)
