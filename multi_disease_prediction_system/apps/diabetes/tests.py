"""
Tests for Diabetes Prediction API and ML Inference Engine.
"""

from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class DiabetesPredictionTests(APITestCase):
    def setUp(self):
        self.predict_url = reverse("diabetes:predict")
        # Standard PascalCase payload matching frontend form
        self.frontend_payload = {
            "inputs": {
                "Pregnancies": 2,
                "Glucose": 130.0,
                "BloodPressure": 75.0,
                "SkinThickness": 25.0,
                "Insulin": 100.0,
                "BMI": 29.5,
                "DiabetesPedigreeFunction": 0.45,
                "Age": 38,
            }
        }
        # Snake_case payload matching DRF serializer fields
        self.snake_case_payload = {
            "pregnancies": 2,
            "glucose": 130.0,
            "blood_pressure": 75.0,
            "skin_thickness": 25.0,
            "insulin": 100.0,
            "bmi": 29.5,
            "diabetes_pedigree": 0.45,
            "age": 38,
        }

    def test_real_inference_with_frontend_pascalcase(self):
        """Test real ML model inference using frontend PascalCase keys."""
        response = self.client.post(self.predict_url, self.frontend_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("probability", response.data)
        self.assertGreaterEqual(response.data["probability"], 0.0)
        self.assertLessEqual(response.data["probability"], 1.0)
        self.assertIn(response.data["prediction_result"], [0, 1])
        self.assertIn("risk_level", response.data)
        self.assertIn("data_quality", response.data)
        self.assertIn("uncertainty", response.data)
        self.assertIn("triage", response.data)

    def test_real_inference_with_snake_case(self):
        """Test real ML model inference using snake_case serializer keys."""
        response = self.client.post(self.predict_url, self.snake_case_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("probability", response.data)

    def test_missing_required_feature_returns_400(self):
        """Missing required feature must return HTTP 400 Bad Request."""
        payload = {"inputs": {"Pregnancies": 2, "Glucose": 130.0}}  # Missing 6 features
        response = self.client.post(self.predict_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertIn("details", response.data)

    def test_out_of_range_feature_returns_400(self):
        """Out-of-range physiological value must return HTTP 400 Bad Request."""
        payload = self.frontend_payload.copy()
        payload["inputs"]["Glucose"] = 550.0  # Max is 300.0
        response = self.client.post(self.predict_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_numeric_type_returns_400(self):
        """Non-numeric input must return HTTP 400 Bad Request."""
        payload = self.frontend_payload.copy()
        payload["inputs"]["BMI"] = "invalid_not_a_number"
        response = self.client.post(self.predict_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.diabetes.services.DiabetesPredictionService.predict")
    def test_forced_inference_failure_returns_500(self, mock_predict):
        """Inference failure must return HTTP 500 and NEVER return fake HTTP 200."""
        mock_predict.side_effect = RuntimeError("Simulated ML engine crash")
        response = self.client.post(self.predict_url, self.frontend_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertFalse(response.data.get("success", False))
        self.assertIn("error", response.data)
