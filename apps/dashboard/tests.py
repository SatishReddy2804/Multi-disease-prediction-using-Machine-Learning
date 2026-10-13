from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import PredictionHistory


class DashboardTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="docstats",
            email="docstats@example.com",
            password="Password123!",
        )
        self.client.force_authenticate(user=self.user)

        self.pred1 = PredictionHistory.objects.create(
            user=self.user,
            disease_type="heart",
            input_data={"age": 60, "trestbps": 140},
            prediction_result=1,
            probability=0.85,
            risk_level="Critical",
            uncertainty_level="Low",
            trust_status="High Trust",
            data_quality_score=95.0,
        )
        self.pred2 = PredictionHistory.objects.create(
            user=self.user,
            disease_type="diabetes",
            input_data={"glucose": 110, "bmi": 24.0},
            prediction_result=0,
            probability=0.20,
            risk_level="Low",
            uncertainty_level="Low",
            trust_status="High Trust",
            data_quality_score=100.0,
        )

        self.stats_url = reverse("dashboard:stats")
        self.history_url = reverse("dashboard:history_list")
        self.eval_url = reverse("dashboard:model_evaluation")

    def test_dashboard_stats(self):
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_predictions"], 2)
        self.assertEqual(response.data["high_risk_count"], 1)
        self.assertEqual(response.data["critical_risk_count"], 1)

    def test_history_list(self):
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

    def test_history_filter_by_disease(self):
        response = self.client.get(f"{self.history_url}?disease_type=heart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_model_evaluation(self):
        response = self.client.get(self.eval_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("models", response.data)
