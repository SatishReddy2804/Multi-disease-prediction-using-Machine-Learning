from rest_framework import serializers


class SingleDiseasePredictionItem(serializers.Serializer):
    disease = serializers.ChoiceField(choices=["heart", "diabetes", "parkinsons", "liver"])
    probability = serializers.FloatField(min_value=0.0, max_value=1.0)
    risk_level = serializers.CharField(max_length=20, default="Low")
    predicted_class = serializers.IntegerField(default=0)
    input_data = serializers.DictField(child=serializers.JSONField(), required=False, default=dict)


class CrossRiskAnalysisSerializer(serializers.Serializer):
    """
    Validates the cross-risk analysis request.

    Preferred format (predictions list):
        {
            "predictions": [
                {"disease": "heart", "probability": 0.72, "risk_level": "High", "predicted_class": 1},
                {"disease": "diabetes", "probability": 0.68, "risk_level": "High", "predicted_class": 1},
                ...
            ]
        }

    Legacy format (risks dict — auto-converted to predictions):
        {
            "risks": {"heart": 0.72, "diabetes": 0.68, ...}
        }
        Note: values must be floats (0.0–1.0), NOT nested objects.
    """
    predictions = serializers.ListField(
        child=SingleDiseasePredictionItem(),
        required=False,
        help_text="List of individual disease predictions to evaluate for cross-organ clinical risk clusters"
    )
    risks = serializers.DictField(
        child=serializers.FloatField(min_value=0.0, max_value=1.0),
        required=False,
        help_text="Dictionary mapping disease names to risk probability (float 0.0–1.0)"
    )

    VALID_DISEASES = {"heart", "diabetes", "parkinsons", "liver"}

    def to_internal_value(self, data):
        """
        If only 'risks' dict is provided, convert it to a 'predictions' list
        so downstream code always works with the same shape.
        Also handles the case where risks values are objects with a 'probability' key.
        """
        if isinstance(data, dict) and "risks" in data and "predictions" not in data:
            risks_map = data["risks"]
            if isinstance(risks_map, dict):
                preds = []
                for dis, prob_or_obj in risks_map.items():
                    dis_clean = str(dis).lower().strip()
                    if dis_clean == "parkinson":
                        dis_clean = "parkinsons"
                    if dis_clean not in self.VALID_DISEASES:
                        continue

                    # Handle both float values and nested objects
                    if isinstance(prob_or_obj, dict):
                        p = float(prob_or_obj.get("probability", 0.0))
                    else:
                        p = float(prob_or_obj)

                    p = max(0.0, min(1.0, p))
                    preds.append({
                        "disease": dis_clean,
                        "probability": p,
                        "risk_level": "High" if p >= 0.6 else ("Moderate" if p >= 0.3 else "Low"),
                        "predicted_class": 1 if p >= 0.5 else 0,
                        "input_data": {}
                    })

                data = dict(data)
                data["predictions"] = preds
                # Remove 'risks' so parent validation doesn't reject nested objects
                data.pop("risks", None)

        return super().to_internal_value(data)

    def validate(self, attrs):
        if not attrs.get("predictions"):
            raise serializers.ValidationError(
                "Either 'predictions' list or 'risks' map must be provided. "
                "Each prediction requires: disease, probability (0.0–1.0)."
            )
        return attrs
