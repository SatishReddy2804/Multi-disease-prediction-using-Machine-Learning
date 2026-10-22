from rest_framework import serializers


class DataQualityCheckSerializer(serializers.Serializer):
    disease_type = serializers.CharField(required=False)
    disease = serializers.CharField(required=False)
    input_data = serializers.DictField(child=serializers.JSONField(), required=False)
    inputs = serializers.DictField(child=serializers.JSONField(), required=False)

    def validate(self, attrs):
        disease = attrs.get("disease_type") or attrs.get("disease")
        if not disease:
            raise serializers.ValidationError({"disease": "This field is required."})
        disease = str(disease).lower().strip()
        if disease == "parkinson":
            disease = "parkinsons"
        if disease not in ["heart", "diabetes", "parkinsons", "liver"]:
            raise serializers.ValidationError({"disease": f"Invalid disease '{disease}'."})
        attrs["disease_type"] = disease

        inputs = attrs.get("input_data") or attrs.get("inputs")
        if inputs is None:
            raise serializers.ValidationError({"inputs": "This field is required."})
        attrs["input_data"] = inputs
        return attrs

