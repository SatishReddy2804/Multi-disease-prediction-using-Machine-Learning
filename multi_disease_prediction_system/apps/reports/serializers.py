from rest_framework import serializers
from .models import GeneratedReport

class GenerateReportRequestSerializer(serializers.Serializer):
    disease_type = serializers.ChoiceField(choices=["heart", "diabetes", "parkinsons", "liver"])
    patient_id = serializers.CharField(max_length=100, default="PT-ANON-001")
    input_data = serializers.DictField(child=serializers.JSONField())
    prediction_result = serializers.IntegerField(default=0)
    probability = serializers.FloatField(min_value=0.0, max_value=1.0)
    risk_level = serializers.CharField(max_length=20, default="Low")
    uncertainty_level = serializers.CharField(max_length=20, default="Low")
    trust_status = serializers.CharField(max_length=30, default="RELIABLE")
    top_features = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    red_flags = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    cross_risk_findings = serializers.CharField(required=False, allow_blank=True, default="")
    prevention_tips = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    medicines = serializers.ListField(child=serializers.CharField(), required=False, default=list)

class GeneratedReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneratedReport
        fields = [
            "report_id",
            "disease_type",
            "patient_identifier",
            "prediction_result",
            "probability",
            "risk_level",
            "created_at"
        ]
