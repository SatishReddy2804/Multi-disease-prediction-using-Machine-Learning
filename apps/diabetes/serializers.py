from rest_framework import serializers
from django.core.validators import MinValueValidator, MaxValueValidator


class DiabetesPredictionSerializer(serializers.Serializer):
    pregnancies = serializers.IntegerField(
        required=True,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
        help_text="Number of pregnancies (0 - 20)",
    )
    glucose = serializers.FloatField(
        required=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(300.0)],
        help_text="Plasma glucose concentration at 2 hours in an oral glucose tolerance test (0 - 300 mg/dL)",
    )
    blood_pressure = serializers.FloatField(
        required=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(200.0)],
        help_text="Diastolic blood pressure (0 - 200 mm Hg)",
    )
    skin_thickness = serializers.FloatField(
        required=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Triceps skin fold thickness (0 - 100 mm)",
    )
    insulin = serializers.FloatField(
        required=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(900.0)],
        help_text="2-Hour serum insulin (0 - 900 mu U/ml)",
    )
    bmi = serializers.FloatField(
        required=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Body mass index (weight in kg/(height in m)^2) (0.0 - 100.0)",
    )
    diabetes_pedigree = serializers.FloatField(
        required=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(3.0)],
        help_text="Diabetes pedigree function genetic score (0.0 - 3.0)",
    )
    age = serializers.IntegerField(
        required=True,
        validators=[MinValueValidator(1), MaxValueValidator(120)],
        help_text="Age in years (1 - 120)",
    )
