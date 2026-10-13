from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class HeartPredictionTests(APITestCase):
    def setUp(self):
        self.predict_url = reverse("heart:predict")
        self.valid_data = {
            "age": 55,
            "sex": 1,
            "cp": 2,
            "trestbps": 130,
            "chol": 240,
            "fbs": 0,
            "restecg": 0,
            "thalach": 150,
            "exang": 0,
            "oldpeak": 1.4,
            "slope": 2,
            "ca": 0,
            "thal": 3,
        }

    def test_invalid_heart_input(self):
        invalid_data = self.valid_data.copy()
        invalid_data["age"] = 150  # Out of range 1-120
        response = self.client.post(self.predict_url, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_model_not_trained_response(self):
        response = self.client.post(self.predict_url, self.valid_data, format="json")
        # If model is not trained yet, should return 503 model_unavailable
        self.assertIn(response.status_code, [status.HTTP_503_SERVICE_UNAVAILABLE, status.HTTP_200_OK])
        if response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
            self.assertEqual(response.data["status"], "model_unavailable")

    @patch("apps.heart.services.HeartPredictionService.predict")
    def test_successful_heart_prediction(self, mock_predict):
        mock_predict.return_value = {
            "disease_type": "heart",
            "prediction_result": 1,
            "probability": 0.75,
            "risk_level": "High",
            "explainability": {"summary": "Elevated ST depression and age"},
            "prevention_guidance": ["Eat well", "Exercise"],
            "medicine_information": [{"name": "Statins"}],
            "disclaimer": "Medical disclaimer",
        }
        response = self.client.post(self.predict_url, self.valid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["risk_level"], "High")
        self.assertIn("triage", response.data)
        self.assertIn("uncertainty", response.data)
