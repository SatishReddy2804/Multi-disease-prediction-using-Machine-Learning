from rest_framework import serializers
from django.core.validators import MinValueValidator, MaxValueValidator


class HeartPredictionSerializer(serializers.Serializer):
    age = serializers.IntegerField(
        required=True,
        validators=[MinValueValidator(1), MaxValueValidator(120)],
        help_text="Age in years (1 - 120)",
    )
    sex = serializers.ChoiceField(
        choices=[(0, "Female"), (1, "Male")],
        required=True,
        help_text="Sex (1 = male; 0 = female)",
    )
    cp = serializers.ChoiceField(
        choices=[
            (1, "Typical Angina"),
            (2, "Atypical Angina"),
            (3, "Non-anginal Pain"),
            (4, "Asymptomatic"),
        ],
        required=True,
        help_text="Chest pain type (1: typical, 2: atypical, 3: non-anginal, 4: asymptomatic)",
    )
    trestbps = serializers.FloatField(
        required=True,
        validators=[MinValueValidator(50.0), MaxValueValidator(250.0)],
        help_text="Resting blood pressure in mm Hg (50 - 250)",
    )
    chol = serializers.FloatField(
        required=True,
        validators=[MinValueValidator(50.0), MaxValueValidator(600.0)],
        help_text="Serum cholesterol in mg/dl (50 - 600)",
    )
    fbs = serializers.ChoiceField(
        choices=[(0, "Fasting Blood Sugar <= 120 mg/dl"), (1, "Fasting Blood Sugar > 120 mg/dl")],
        required=True,
        help_text="Fasting blood sugar > 120 mg/dl (1 = true; 0 = false)",
    )
    restecg = serializers.ChoiceField(
        choices=[
            (0, "Normal"),
            (1, "ST-T Wave Abnormality"),
            (2, "Definite Left Ventricular Hypertrophy"),
        ],
        required=True,
        help_text="Resting electrocardiographic results (0, 1, or 2)",
    )
    thalach = serializers.FloatField(
        required=True,
        validators=[MinValueValidator(50.0), MaxValueValidator(250.0)],
        help_text="Maximum heart rate achieved (50 - 250)",
    )
    exang = serializers.ChoiceField(
        choices=[(0, "No"), (1, "Yes")],
        required=True,
        help_text="Exercise induced angina (1 = yes; 0 = no)",
    )
    oldpeak = serializers.FloatField(
        required=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(10.0)],
        help_text="ST depression induced by exercise relative to rest (0.0 - 10.0)",
    )
    slope = serializers.ChoiceField(
        choices=[
            (1, "Upsloping"),
            (2, "Flat"),
            (3, "Downsloping"),
        ],
        required=True,
        help_text="Slope of peak exercise ST segment (1: upsloping, 2: flat, 3: downsloping)",
    )
    ca = serializers.IntegerField(
        required=True,
        validators=[MinValueValidator(0), MaxValueValidator(3)],
        help_text="Number of major vessels (0-3) colored by flourosopy",
    )
    thal = serializers.ChoiceField(
        choices=[
            (3, "Normal (3)"),
            (6, "Fixed Defect (6)"),
            (7, "Reversible Defect (7)"),
        ],
        required=True,
        help_text="Thalassemia (3 = normal; 6 = fixed defect; 7 = reversible defect)",
    )
