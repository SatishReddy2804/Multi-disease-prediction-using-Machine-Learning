"""
Tests for Liver Disease Prediction API and ML Hepatology Inference.
"""

from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class LiverPredictionTests(APITestCase):
    def setUp(self):
        self.predict_url = reverse("liver:predict_liver")
        self.standard_payload = {
            "inputs": {
                "Age": 48,
                "Gender": "Male",
                "Total_Bilirubin": 1.2,
                "Direct_Bilirubin": 0.4,
                "Alkaline_Phosphotase": 210.0,
                "Alamine_Aminotransferase": 45.0,
                "Aspartate_Aminotransferase": 55.0,
                "Total_Protiens": 6.8,
                "Albumin": 3.2,
                "Albumin_and_Globulin_Ratio": 0.9,
            }
        }
        self.alias_payload = {
            "inputs": {
                "Age": 52,
                "Gender": "Female",
                "TB": 1.5,
                "DB": 0.5,
                "Alkphos": 190.0,
                "Sgpt": 35.0,
                "Sgot": 40.0,
                "TP": 7.0,
                "ALB": 3.6,
                "A/G Ratio": 1.0,
            }
        }

    def test_real_liver_inference_standard_payload(self):
        """Test real ML model inference produces valid binary prediction and finite probability."""
        response = self.client.post(self.predict_url, self.standard_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("probability", response.data)
        self.assertGreaterEqual(response.data["probability"], 0.0)
        self.assertLessEqual(response.data["probability"], 1.0)
        self.assertIn(response.data["prediction"], [0, 1])
        self.assertIn("risk_level", response.data)
        self.assertIn("prevention_guidance", response.data)

    def test_real_liver_inference_alias_payload(self):
        """Test real ML model inference works with UCI alias column names."""
        response = self.client.post(self.predict_url, self.alias_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("probability", response.data)

    def test_invalid_gender_returns_400(self):
        """Invalid biological sex value must return HTTP 400 Bad Request."""
        payload = self.standard_payload.copy()
        payload["inputs"]["Gender"] = "Unknown"
        response = self.client.post(self.predict_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_biological_constraint_violation_returns_400(self):
        """Direct Bilirubin exceeding Total Bilirubin must fail biological validation."""
        payload = self.standard_payload.copy()
        payload["inputs"]["Total_Bilirubin"] = 1.0
        payload["inputs"]["Direct_Bilirubin"] = 2.5  # Biologically invalid: direct > total
        response = self.client.post(self.predict_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Direct_Bilirubin", response.data.get("details", {}))

    def test_missing_feature_returns_400(self):
        """Missing feature must not be silently defaulted and must return HTTP 400."""
        payload = {"inputs": {"Age": 48, "Gender": "Male"}}  # Missing 8 features
        response = self.client.post(self.predict_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    @patch("apps.liver.services.LiverPredictionService.predict")
    def test_forced_model_failure_returns_500(self, mock_predict):
        """Inference error must return HTTP 500 and NEVER HTTP 200 with fake predictions."""
        mock_predict.side_effect = RuntimeError("Simulated logistic regression failure")
        response = self.client.post(self.predict_url, self.standard_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertFalse(response.data.get("success", False))
        self.assertIn("error", response.data)
