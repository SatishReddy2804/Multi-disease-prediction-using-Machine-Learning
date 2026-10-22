import time
import jwt
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory
from rest_framework.exceptions import AuthenticationFailed
from apps.accounts.authentication import SupabaseAuthentication


class AccountTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("accounts:register")
        self.login_url = reverse("accounts:login")
        self.me_url = reverse("accounts:me")
        self.logout_url = reverse("accounts:logout")

        self.user_data = {
            "username": "testdoctor",
            "email": "doctor@example.com",
            "password": "StrongPassword123!",
            "password2": "StrongPassword123!",
            "first_name": "John",
            "last_name": "Watson",
            "phone_number": "+1234567890",
        }

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("user", response.data)
        self.assertTrue(User.objects.filter(username="testdoctor").exists())

    def test_registration_password_mismatch(self):
        bad_data = self.user_data.copy()
        bad_data["password2"] = "DifferentPassword123!"
        bad_data["username"] = "mismatchuser"
        bad_data["email"] = "mismatch@example.com"
        response = self.client.post(self.register_url, bad_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login(self):
        User.objects.create_user(
            username="logindoctor",
            email="login@example.com",
            password="StrongPassword123!",
        )
        login_payload = {
            "username": "logindoctor",
            "password": "StrongPassword123!",
        }
        response = self.client.post(self.login_url, login_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("tokens", response.data)

    def test_me_endpoint_authenticated(self):
        user = User.objects.create_user(
            username="authdoctor",
            email="auth@example.com",
            password="StrongPassword123!",
        )
        self.client.force_authenticate(user=user)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "authdoctor")

    def test_supabase_token_authentication(self):
        """Test SupabaseAuthentication backend maps JWT claims to Django User."""
        secret = "test-supabase-jwt-secret-key-32-chars-long!"
        auth_backend = SupabaseAuthentication()
        auth_backend.supabase_jwt_secret = secret

        payload = {
            "sub": "supabase-usr-uuid-12345",
            "email": "clinician@hospital.org",
            "exp": time.time() + 3600,
            "user_metadata": {"full_name": "Dr. Sarah Connor"},
        }
        token = jwt.encode(payload, secret, algorithm="HS256")

        factory = APIRequestFactory()
        request = factory.get(self.me_url, HTTP_AUTHORIZATION=f"Bearer {token}")
        result = auth_backend.authenticate(request)

        self.assertIsNotNone(result)
        user, returned_token = result
        self.assertEqual(user.username, "supabase-usr-uuid-12345")
        self.assertEqual(user.email, "clinician@hospital.org")
        self.assertEqual(user.first_name, "Dr. Sarah Connor")
        self.assertEqual(returned_token, token)

    def test_supabase_expired_token_rejected(self):
        """Expired Supabase token must raise AuthenticationFailed."""
        secret = "test-supabase-jwt-secret-key-32-chars-long!"
        auth_backend = SupabaseAuthentication()
        auth_backend.supabase_jwt_secret = secret

        expired_payload = {
            "sub": "supabase-usr-uuid-expired",
            "email": "expired@hospital.org",
            "exp": time.time() - 3600,
        }
        token = jwt.encode(expired_payload, secret, algorithm="HS256")

        factory = APIRequestFactory()
        request = factory.get(self.me_url, HTTP_AUTHORIZATION=f"Bearer {token}")
        with self.assertRaises(AuthenticationFailed):
            auth_backend.authenticate(request)
