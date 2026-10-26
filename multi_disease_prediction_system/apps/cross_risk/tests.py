from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.cross_risk.serializers import CrossRiskAnalysisSerializer
from apps.cross_risk.services import CrossRiskService


class CrossRiskSerializerTestCase(TestCase):
    """Test payload validation and contract normalization in serializer."""

    def test_valid_predictions_list(self):
        payload = {
            "predictions": [
                {"disease": "heart", "probability": 0.82, "risk_level": "High", "predicted_class": 1},
                {"disease": "diabetes", "probability": 0.74, "risk_level": "High", "predicted_class": 1},
            ]
        }
        serializer = CrossRiskAnalysisSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(len(serializer.validated_data["predictions"]), 2)
        self.assertEqual(serializer.validated_data["predictions"][0]["disease"], "heart")

    def test_valid_legacy_risks_dict(self):
        payload = {
            "risks": {
                "heart": 0.75,
                "diabetes": 0.65,
                "liver": 0.30
            }
        }
        serializer = CrossRiskAnalysisSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        preds = serializer.validated_data["predictions"]
        self.assertEqual(len(preds), 3)
        diseases = {p["disease"] for p in preds}
        self.assertEqual(diseases, {"heart", "diabetes", "liver"})

    def test_nested_object_inside_risks_dict_resilience(self):
        """Tests that passing {risks: {disease: {probability: X}}} doesn't crash."""
        payload = {
            "risks": {
                "heart": {"probability": 0.72, "risk_level": "High"},
                "diabetes": {"probability": 0.55, "risk_level": "Moderate"}
            }
        }
        serializer = CrossRiskAnalysisSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        preds = serializer.validated_data["predictions"]
        self.assertEqual(len(preds), 2)
        self.assertAlmostEqual(preds[0]["probability"], 0.72, places=2)

    def test_empty_payload_fails_validation(self):
        serializer = CrossRiskAnalysisSerializer(data={})
        self.assertFalse(serializer.is_valid())

    def test_invalid_probability_out_of_range(self):
        payload = {
            "predictions": [
                {"disease": "heart", "probability": 1.5, "risk_level": "High"}
            ]
        }
        serializer = CrossRiskAnalysisSerializer(data=payload)
        self.assertFalse(serializer.is_valid())


class CrossRiskServiceTestCase(TestCase):
    """Test business logic, radar formatting, and cluster evaluation."""

    def test_all_four_diseases_analysis(self):
        preds = [
            {"disease": "heart", "probability": 0.85, "risk_level": "High", "predicted_class": 1},
            {"disease": "diabetes", "probability": 0.78, "risk_level": "High", "predicted_class": 1},
            {"disease": "liver", "probability": 0.65, "risk_level": "High", "predicted_class": 1},
            {"disease": "parkinsons", "probability": 0.20, "risk_level": "Low", "predicted_class": 0},
        ]
        res = CrossRiskService.analyze(preds)
        self.assertIn("radar_chart_data", res)
        self.assertEqual(len(res["radar_chart_data"]), 4)
        self.assertEqual(res["total_evaluated"], 4)
        self.assertEqual(len(res["missing_diseases"]), 0)
        self.assertIn("primary_cluster", res)
        self.assertIn("overall_priority", res)
        self.assertIn("disclaimer", res)

    def test_partial_disease_no_fabricated_defaults(self):
        """Ensure missing diseases are flagged as unavailable, not replaced by fabricated numbers."""
        preds = [
            {"disease": "heart", "probability": 0.70, "risk_level": "High"},
            {"disease": "diabetes", "probability": 0.65, "risk_level": "High"}
        ]
        res = CrossRiskService.analyze(preds)
        self.assertEqual(len(res["radar_chart_data"]), 2)
        self.assertEqual(res["total_evaluated"], 2)
        missing_keys = [m["disease"] for m in res["missing_diseases"]]
        self.assertIn("liver", missing_keys)
        self.assertIn("parkinsons", missing_keys)
        # Check scores only contains evaluated diseases
        self.assertEqual(set(res["scores"].keys()), {"heart", "diabetes"})

    def test_medical_disclaimer_present(self):
        preds = [{"disease": "heart", "probability": 0.40}]
        res = CrossRiskService.analyze(preds)
        self.assertIn("disclaimer", res)
        self.assertIn("does not", res["disclaimer"].lower())


class CrossRiskApiEndpointTestCase(TestCase):
    """Test DRF View POST /api/cross-risk/analyze/."""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/cross-risk/analyze/"

    def test_api_valid_post(self):
        payload = {
            "predictions": [
                {"disease": "heart", "probability": 0.72, "risk_level": "High"},
                {"disease": "diabetes", "probability": 0.68, "risk_level": "High"},
                {"disease": "liver", "probability": 0.55, "risk_level": "Moderate"},
                {"disease": "parkinsons", "probability": 0.15, "risk_level": "Low"}
            ]
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("radar_chart_data", data["data"])
        self.assertEqual(len(data["data"]["radar_chart_data"]), 4)

    def test_api_invalid_payload(self):
        response = self.client.post(self.url, {"bad_field": 123}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("error", data)
