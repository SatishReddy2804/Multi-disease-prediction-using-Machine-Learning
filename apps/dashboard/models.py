from django.db import models
from django.contrib.auth.models import User


class PredictionHistory(models.Model):
    DISEASE_CHOICES = (
        ("heart", "Heart Disease"),
        ("diabetes", "Diabetes"),
        ("parkinsons", "Parkinson's Disease"),
        ("liver", "Liver Disease"),
    )

    RISK_LEVEL_CHOICES = (
        ("Low", "Low"),
        ("Moderate", "Moderate"),
        ("High", "High"),
        ("Critical", "Critical"),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="prediction_histories",
        null=True,
        blank=True,
        db_index=True,
    )
    disease_type = models.CharField(max_length=50, choices=DISEASE_CHOICES, db_index=True)
    input_data = models.JSONField(default=dict)
    prediction_result = models.IntegerField(help_text="0 for negative/low risk, 1 for positive/disease detected")
    probability = models.FloatField(help_text="Predicted probability score between 0.0 and 1.0")
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, default="Low")
    uncertainty_level = models.CharField(max_length=20, default="Low")
    trust_status = models.CharField(max_length=50, default="High Trust")
    data_quality_score = models.FloatField(default=100.0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Prediction History"
        verbose_name_plural = "Prediction Histories"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["disease_type", "-created_at"]),
            models.Index(fields=["risk_level", "-created_at"]),
        ]

    def __str__(self):
        user_str = self.user.username if self.user else "Anonymous"
        return f"{self.disease_type.title()} - Result: {self.prediction_result} ({self.risk_level}) by {user_str} at {self.created_at:%Y-%m-%d %H:%M}"
