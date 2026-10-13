from rest_framework import serializers
from .models import PredictionHistory


class PredictionHistorySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = PredictionHistory
        fields = [
            "id",
            "user",
            "username",
            "disease_type",
            "input_data",
            "prediction_result",
            "probability",
            "risk_level",
            "uncertainty_level",
            "trust_status",
            "data_quality_score",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "username"]
