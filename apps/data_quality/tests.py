from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class DataQualityTests(APITestCase):
    def setUp(self):
        self.check_url = reverse("data_quality:check")

    def test_valid_data_quality(self):
        payload = {
            "disease_type": "diabetes",
            "input_data": {
                "pregnancies": 2,
                "glucose": 120,
                "blood_pressure": 75,
                "skin_thickness": 25,
                "insulin": 85,
                "bmi": 24.5,
                "diabetes_pedigree": 0.45,
                "age": 35,
            },
        }
        response = self.client.post(self.check_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_valid"])
        self.assertGreaterEqual(response.data["quality_score"], 80)

    def test_zero_missing_data_quality_warning(self):
        payload = {
            "disease_type": "diabetes",
            "input_data": {
                "pregnancies": 2,
                "glucose": 0,  # Impossible zero
                "blood_pressure": 0,  # Impossible zero
                "bmi": 0,  # Impossible zero
                "age": 35,
            },
        }
        response = self.client.post(self.check_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(response.data["quality_score"], 70)
        self.assertGreater(len(response.data["warnings"]), 0)
