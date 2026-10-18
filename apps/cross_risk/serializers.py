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
        required=False,
        help_text="List of individual disease predictions to evaluate for cross-organ clinical risk clusters"
    )
    risks = serializers.DictField(
        child=serializers.FloatField(min_value=0.0, max_value=1.0),
        required=False,
        help_text="Dictionary mapping disease names to risk probability"
    )

    def to_internal_value(self, data):
        if isinstance(data, dict) and "risks" in data and "predictions" not in data:
            risks_map = data["risks"]
            if isinstance(risks_map, dict):
                preds = []
                for dis, prob in risks_map.items():
                    dis_clean = str(dis).lower().strip()
                    if dis_clean == "parkinson":
                        dis_clean = "parkinsons"
                    if dis_clean in ["heart", "diabetes", "parkinsons", "liver"]:
                        p = float(prob)
                        preds.append({
                            "disease": dis_clean,
                            "probability": p,
                            "risk_level": "High" if p >= 0.6 else ("Moderate" if p >= 0.3 else "Low"),
                            "predicted_class": 1 if p >= 0.5 else 0,
                            "input_data": {}
                        })
                data = dict(data)
                data["predictions"] = preds
        return super().to_internal_value(data)

    def validate(self, attrs):
        if not attrs.get("predictions"):
            raise serializers.ValidationError("Either 'predictions' list or 'risks' map must be provided.")
        return attrs

