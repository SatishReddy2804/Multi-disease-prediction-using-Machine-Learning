import uuid
from django.db import models
from django.contrib.auth.models import User

class GeneratedReport(models.Model):
    """
    Stores metadata for generated Clinician-Ready PDF case summaries.
    """
    report_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reports")
    disease_type = models.CharField(max_length=50, db_index=True)
    patient_identifier = models.CharField(max_length=100, default="Anonymous Patient")
    prediction_result = models.IntegerField(default=0)
    probability = models.FloatField()
    risk_level = models.CharField(max_length=20)
    pdf_file_path = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["disease_type", "created_at"]),
        ]

    def __str__(self):
        return f"Report {self.report_id} - {self.disease_type} ({self.risk_level})"
