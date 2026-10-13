from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class DiabetesPredictionTests(APITestCase):
    def setUp(self):
        self.predict_url = reverse("diabetes:predict")
        self.valid_data = {
            "pregnancies": 3,
            "glucose": 145.0,
            "blood_pressure": 80.0,
            "skin_thickness": 28.0,
            "insulin": 120.0,
            "bmi": 32.5,
            "diabetes_pedigree": 0.65,
            "age": 42,
        }

    def test_invalid_diabetes_input(self):
        invalid_data = self.valid_data.copy()
        invalid_data["glucose"] = 450.0  # Out of range 0-300
        response = self.client.post(self.predict_url, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_model_not_trained_response(self):
        response = self.client.post(self.predict_url, self.valid_data, format="json")
        self.assertIn(response.status_code, [status.HTTP_503_SERVICE_UNAVAILABLE, status.HTTP_200_OK])
        if response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
            self.assertEqual(response.data["status"], "model_unavailable")

    @patch("apps.diabetes.services.DiabetesPredictionService.predict")
    def test_successful_diabetes_prediction(self, mock_predict):
        mock_predict.return_value = {
            "disease_type": "diabetes",
            "prediction_result": 1,
            "probability": 0.68,
            "risk_level": "High",
            "explainability": {"summary": "Elevated glucose and BMI"},
            "prevention_guidance": ["Eat fiber", "Exercise"],
            "medicine_information": [{"name": "Metformin"}],
            "disclaimer": "Medical disclaimer",
        }
        response = self.client.post(self.predict_url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["risk_level"], "High")
        self.assertIn("data_quality", response.data)
        self.assertIn("triage", response.data)
