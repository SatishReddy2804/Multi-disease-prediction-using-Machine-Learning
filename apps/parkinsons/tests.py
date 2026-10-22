"""
Tests for Parkinson's Disease Prediction API and ML Voice Biomarker Inference.
"""

from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class ParkinsonsPredictionTests(APITestCase):
    def setUp(self):
        self.predict_url = reverse("parkinsons:predict_parkinsons")
        # Full 22 acoustic features matching Oxford dataset and frontend form
        self.valid_payload = {
            "inputs": {
                "MDVP:Fo(Hz)": 154.2,
                "MDVP:Fhi(Hz)": 197.1,
                "MDVP:Flo(Hz)": 116.3,
                "MDVP:Jitter(%)": 0.0062,
                "MDVP:Jitter(Abs)": 0.00004,
                "MDVP:RAP": 0.0031,
                "MDVP:PPQ": 0.0034,
                "Jitter:DDP": 0.0093,
                "MDVP:Shimmer": 0.029,
                "MDVP:Shimmer(dB)": 0.28,
                "Shimmer:APQ3": 0.015,
                "Shimmer:APQ5": 0.017,
                "MDVP:APQ": 0.024,
                "Shimmer:DDA": 0.046,
                "NHR": 0.024,
                "HNR": 21.8,
                "RPDE": 0.49,
                "DFA": 0.71,
                "spread1": -5.68,
                "spread2": 0.22,
                "D2": 2.38,
                "PPE": 0.20,
            }
        }

    def test_real_parkinsons_inference(self):
        """Test real ML model inference produces valid binary prediction and finite probability."""
        response = self.client.post(self.predict_url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("probability", response.data)
        self.assertGreaterEqual(response.data["probability"], 0.0)
        self.assertLessEqual(response.data["probability"], 1.0)
        self.assertIn(response.data["prediction"], [0, 1])
        self.assertIn("risk_level", response.data)
        self.assertIn("prevention_guidance", response.data)
        self.assertIn("medicines", response.data)

    def test_missing_acoustic_feature_returns_400(self):
        """Missing required biomarker must return HTTP 400 Bad Request."""
        payload = {"inputs": {"MDVP:Fo(Hz)": 154.2, "HNR": 21.8}}  # Missing 20 features
        response = self.client.post(self.predict_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertIn("details", response.data)

    def test_non_numeric_feature_returns_400(self):
        """Non-numeric acoustic input must return HTTP 400 Bad Request."""
        payload = self.valid_payload.copy()
        payload["inputs"]["HNR"] = "uncalibrated_string"
        response = self.client.post(self.predict_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.parkinsons.services.ParkinsonsPredictionService.predict")
    def test_forced_model_failure_returns_500(self, mock_predict):
        """Forced inference error must return HTTP 500 and NEVER HTTP 200 with fake predictions."""
        mock_predict.side_effect = RuntimeError("Simulated KNN inference fault")
        response = self.client.post(self.predict_url, self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertFalse(response.data.get("success", False))
        self.assertIn("error", response.data)
