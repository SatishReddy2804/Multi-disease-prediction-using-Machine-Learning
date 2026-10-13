from rest_framework import serializers

class SingleDiseasePredictionItem(serializers.Serializer):
    disease = serializers.ChoiceField(choices=["heart", "diabetes", "parkinsons", "liver"])
    probability = serializers.FloatField(min_value=0.0, max_value=1.0)
    risk_level = serializers.CharField(max_length=20, default="Low")
    predicted_class = serializers.IntegerField(default=0)
    input_data = serializers.DictField(child=serializers.JSONField(), required=False, default=dict)

class CrossRiskAnalysisSerializer(serializers.Serializer):
    predictions = serializers.ListField(
        child=SingleDiseasePredictionItem(),
        min_length=1,
        help_text="List of individual disease predictions to evaluate for cross-organ clinical risk clusters"
    )
