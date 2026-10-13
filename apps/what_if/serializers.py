from rest_framework import serializers

class WhatIfSimulationSerializer(serializers.Serializer):
    disease_type = serializers.ChoiceField(
        choices=["heart", "diabetes", "parkinsons", "liver"],
        help_text="Target disease module ('heart', 'diabetes', 'parkinsons', 'liver')"
    )
    original_input = serializers.DictField(
        child=serializers.JSONField(),
        help_text="Original baseline clinical input dictionary"
    )
    modified_values = serializers.DictField(
        child=serializers.JSONField(),
        help_text="Dictionary of modifiable variables with simulated new values"
    )

    def validate(self, attrs):
        disease = attrs["disease_type"]
        original = attrs["original_input"]
        mods = attrs["modified_values"]

        if not original:
            raise serializers.ValidationError({"original_input": "Original input dictionary cannot be empty."})
        if not mods:
            raise serializers.ValidationError({"modified_values": "Modified values dictionary cannot be empty."})

        # Disallow modifying non-modifiable demographic features
        immutable_fields = {
            "heart": ["age", "sex"],
            "diabetes": ["Age", "Pregnancies", "DiabetesPedigreeFunction"],
            "liver": ["Age", "Gender"],
            "parkinsons": []  # Voice parameters are educational only
        }

        blocked = [k for k in mods.keys() if k in immutable_fields.get(disease, [])]
        if blocked:
            raise serializers.ValidationError({
                "modified_values": f"The following features are non-modifiable baseline factors and cannot be simulated: {', '.join(blocked)}"
            })

        return attrs
