from rest_framework import serializers


class DataQualityCheckSerializer(serializers.Serializer):
    disease_type = serializers.ChoiceField(
        choices=["heart", "diabetes", "parkinsons", "liver"],
        required=True,
    )
    input_data = serializers.DictField(
        child=serializers.JSONField(),
        required=True,
    )
