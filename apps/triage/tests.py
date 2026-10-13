from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class TriageTests(APITestCase):
    def setUp(self):
        self.priority_url = reverse("triage:priority")

    def test_immediate_hypertensive_crisis_triage(self):
        payload = {
            "disease_type": "heart",
            "data": {
                "trestbps": 195,
                "oldpeak": 1.2,
                "thalach": 120,
            },
        }
        response = self.client.post(self.priority_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["highest_priority"], "IMMEDIATE")

    def test_routine_triage(self):
        payload = {
            "disease_type": "diabetes",
            "data": {
                "glucose": 95,
                "blood_pressure": 115,
                "bmi": 22.5,
            },
        }
        response = self.client.post(self.priority_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["highest_priority"], "ROUTINE")

    def test_get_triage_reference(self):
        response = self.client.get(self.priority_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("priority_levels", response.data)
