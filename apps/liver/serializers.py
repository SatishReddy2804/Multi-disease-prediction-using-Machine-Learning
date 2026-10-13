from rest_framework import serializers

class LiverPredictionSerializer(serializers.Serializer):
    Age = serializers.IntegerField(min_value=1, max_value=120, default=45, help_text="Age in years (1 - 120)")
    Gender = serializers.CharField(max_length=10, default="Male", help_text="Biological Sex ('Male' or 'Female')")
    Total_Bilirubin = serializers.FloatField(min_value=0.1, max_value=80.0, default=1.0, help_text="Total Bilirubin in mg/dL (Normal: 0.1 - 1.2)")
    Direct_Bilirubin = serializers.FloatField(min_value=0.0, max_value=40.0, default=0.3, help_text="Direct/Conjugated Bilirubin in mg/dL (Normal: 0.0 - 0.4)")
    Alkaline_Phosphotase = serializers.FloatField(min_value=10.0, max_value=3000.0, default=180.0, help_text="Alkaline Phosphatase (ALP) in U/L (Normal: 44 - 147)")
    Alamine_Aminotransferase = serializers.FloatField(min_value=5.0, max_value=3000.0, default=30.0, help_text="ALT / SGPT in U/L (Normal: 7 - 56)")
    Aspartate_Aminotransferase = serializers.FloatField(min_value=5.0, max_value=5000.0, default=35.0, help_text="AST / SGOT in U/L (Normal: 10 - 40)")
    Total_Protiens = serializers.FloatField(min_value=1.0, max_value=15.0, default=6.8, help_text="Total Proteins in g/dL (Normal: 6.0 - 8.3)")
    Albumin = serializers.FloatField(min_value=0.5, max_value=10.0, default=3.4, help_text="Serum Albumin in g/dL (Normal: 3.5 - 5.0)")
    Albumin_and_Globulin_Ratio = serializers.FloatField(min_value=0.1, max_value=5.0, default=1.0, help_text="Albumin/Globulin (A/G) Ratio (Normal: 0.8 - 2.0)")

    def validate_Gender(self, value):
        val_clean = str(value).strip().lower()
        if val_clean in ["male", "m", "1"]:
            return "Male"
        elif val_clean in ["female", "f", "0"]:
            return "Female"
        raise serializers.ValidationError("Gender must be 'Male' or 'Female'.")

    def validate(self, attrs):
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
