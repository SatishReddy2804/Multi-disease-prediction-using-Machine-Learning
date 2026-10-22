from rest_framework import serializers

class WhatIfSimulationSerializer(serializers.Serializer):
    disease_type = serializers.CharField(required=False)
    disease = serializers.CharField(required=False)
    original_input = serializers.DictField(child=serializers.JSONField(), required=False)
    original = serializers.DictField(child=serializers.JSONField(), required=False)
    modified_values = serializers.DictField(child=serializers.JSONField(), required=False)
    modified = serializers.DictField(child=serializers.JSONField(), required=False)

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

        original = attrs.get("original_input") or attrs.get("original")
        if not original:
            raise serializers.ValidationError({"original": "Original input dictionary cannot be empty."})
        attrs["original_input"] = original

        mods = attrs.get("modified_values") or attrs.get("modified")
        if not mods:
            raise serializers.ValidationError({"modified": "Modified values dictionary cannot be empty."})
        attrs["modified_values"] = mods

        # Disallow modifying non-modifiable demographic features if actually changed from original
        immutable_fields = {
            "heart": ["age", "sex"],
            "diabetes": ["age", "pregnancies", "diabetespedigreefunction"],
            "liver": ["age", "gender"],
            "parkinsons": []  # Voice parameters are educational only
        }

        blocked = []
        for k, v in mods.items():
            k_norm = k.lower().replace("_", "")
            if k_norm in immutable_fields.get(disease, []):
                orig_v = original.get(k)
                if orig_v is not None:
                    try:
                        if float(orig_v) != float(v):
                            blocked.append(k)
                    except (ValueError, TypeError):
                        if str(orig_v) != str(v):
                            blocked.append(k)
                else:
                    blocked.append(k)

        if blocked:
            raise serializers.ValidationError({
                "modified": f"The following features are non-modifiable baseline factors and cannot be simulated: {', '.join(blocked)}"
            })

        return attrs

