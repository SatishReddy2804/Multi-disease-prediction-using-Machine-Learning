import math
from rest_framework import serializers


class LiverPredictionSerializer(serializers.Serializer):
    Age = serializers.IntegerField(
        required=True,
        min_value=1,
        max_value=120,
        help_text="Age in years (1 - 120)",
    )
    Gender = serializers.CharField(
        required=True,
        max_length=10,
        help_text="Biological Sex ('Male' or 'Female')",
    )
    Total_Bilirubin = serializers.FloatField(
        required=True,
        min_value=0.1,
        max_value=80.0,
        help_text="Total Bilirubin in mg/dL (Normal: 0.1 - 1.2)",
    )
    Direct_Bilirubin = serializers.FloatField(
        required=True,
        min_value=0.0,
        max_value=40.0,
        help_text="Direct/Conjugated Bilirubin in mg/dL (Normal: 0.0 - 0.4)",
    )
    Alkaline_Phosphotase = serializers.FloatField(
        required=True,
        min_value=10.0,
        max_value=3000.0,
        help_text="Alkaline Phosphatase (ALP) in U/L (Normal: 44 - 147)",
    )
    Alamine_Aminotransferase = serializers.FloatField(
        required=True,
        min_value=5.0,
        max_value=3000.0,
        help_text="ALT / SGPT in U/L (Normal: 7 - 56)",
    )
    Aspartate_Aminotransferase = serializers.FloatField(
        required=True,
        min_value=5.0,
        max_value=5000.0,
        help_text="AST / SGOT in U/L (Normal: 10 - 40)",
    )
    Total_Protiens = serializers.FloatField(
        required=True,
        min_value=1.0,
        max_value=15.0,
        help_text="Total Proteins in g/dL (Normal: 6.0 - 8.3)",
    )
    Albumin = serializers.FloatField(
        required=True,
        min_value=0.5,
        max_value=10.0,
        help_text="Serum Albumin in g/dL (Normal: 3.5 - 5.0)",
    )
    Albumin_and_Globulin_Ratio = serializers.FloatField(
        required=True,
        min_value=0.1,
        max_value=5.0,
        help_text="Albumin/Globulin (A/G) Ratio (Normal: 0.8 - 2.0)",
    )

    RAW_KEY_MAPPING = {
        "TB": "Total_Bilirubin",
        "DB": "Direct_Bilirubin",
        "Alkphos": "Alkaline_Phosphotase",
        "Sgpt": "Alamine_Aminotransferase",
        "Sgot": "Aspartate_Aminotransferase",
        "TP": "Total_Protiens",
        "ALB": "Albumin",
        "A/G Ratio": "Albumin_and_Globulin_Ratio",
        "A/G_Ratio": "Albumin_and_Globulin_Ratio",
        "AG_Ratio": "Albumin_and_Globulin_Ratio",
        "Total_Proteins": "Total_Protiens",
        "total_proteins": "Total_Protiens",
        "total_protiens": "Total_Protiens",
        "age": "Age",
        "gender": "Gender",
        "total_bilirubin": "Total_Bilirubin",
        "direct_bilirubin": "Direct_Bilirubin",
        "alkaline_phosphotase": "Alkaline_Phosphotase",
        "alamine_aminotransferase": "Alamine_Aminotransferase",
        "aspartate_aminotransferase": "Aspartate_Aminotransferase",
        "albumin": "Albumin",
        "albumin_and_globulin_ratio": "Albumin_and_Globulin_Ratio",
    }

    def to_internal_value(self, data):
        normalized = {}
        for k, v in data.items():
            if k in self.RAW_KEY_MAPPING:
                normalized[self.RAW_KEY_MAPPING[k]] = v
            else:
                normalized[k] = v
        return super().to_internal_value(normalized)

    def validate_Gender(self, value):
        val_clean = str(value).strip().lower()
        if val_clean in ["male", "m", "1"]:
            return "Male"
        elif val_clean in ["female", "f", "0"]:
            return "Female"
        raise serializers.ValidationError("Gender must be 'Male' or 'Female'.")

    def validate(self, attrs):
        # Ensure finite numeric values
        for k, v in attrs.items():
            if isinstance(v, (int, float)):
                if math.isnan(v) or math.isinf(v):
                    raise serializers.ValidationError({k: f"Feature '{k}' must be a finite numeric value."})

        # Biologically Direct Bilirubin should not exceed Total Bilirubin
        tb = attrs.get("Total_Bilirubin")
        db = attrs.get("Direct_Bilirubin")
        if tb is not None and db is not None and db > tb:
            raise serializers.ValidationError({"Direct_Bilirubin": "Direct bilirubin cannot exceed total bilirubin."})

        # Albumin cannot exceed Total Proteins
        tp = attrs.get("Total_Protiens")
        alb = attrs.get("Albumin")
        if tp is not None and alb is not None and alb > tp:
            raise serializers.ValidationError({"Albumin": "Albumin cannot exceed total serum proteins."})

        return attrs
