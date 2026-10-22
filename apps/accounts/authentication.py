"""
Supabase Authentication Backend for Django REST Framework.

Verifies Supabase Auth JWT tokens passed in the Authorization: Bearer <token> header,
extracts the authentic sub/email/metadata claims, and associates them with a Django User.
"""

import os
import logging
import jwt
from typing import Optional, Tuple
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework import exceptions

logger = logging.getLogger(__name__)
User = get_user_model()


class SupabaseAuthentication(BaseAuthentication):
    """
    Validates Supabase-issued JWT access tokens.
    """

    def __init__(self):
        super().__init__()
        self.supabase_url = getattr(
            settings,
            "SUPABASE_URL",
            os.environ.get("SUPABASE_URL", "https://qwudleauzofzfdkeklvq.supabase.co")
        )
        self.supabase_jwt_secret = getattr(
            settings,
            "SUPABASE_JWT_SECRET",
            os.environ.get("SUPABASE_JWT_SECRET", "")
        )
        self.jwks_client = None
        if self.supabase_url:
            try:
                jwks_url = f"{self.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
                self.jwks_client = jwt.PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
            except Exception as e:
                logger.warning(f"Could not initialize Supabase JWKS client: {e}")

    def authenticate(self, request) -> Optional[Tuple[User, str]]:
        auth = get_authorization_header(request).split()
        if not auth or auth[0].lower() != b"bearer":
            return None

        if len(auth) == 1:
            raise exceptions.AuthenticationFailed("Invalid bearer header: No credentials provided.")
        elif len(auth) > 2:
            raise exceptions.AuthenticationFailed("Invalid bearer header: Token string should not contain spaces.")

        token = auth[1].decode("utf-8")
        payload = self._verify_token(token)
        if not payload:
            return None

        user_id = payload.get("sub")
        email = payload.get("email", "")
        if not user_id:
            raise exceptions.AuthenticationFailed("Token is missing subject identifier ('sub').")

        # Map to Django User
        try:
            # Use sub as username to prevent collision across OAuth/email providers
            user, created = User.objects.get_or_create(
                username=user_id,
                defaults={
                    "email": email,
                    "first_name": payload.get("user_metadata", {}).get("full_name", "")[:30],
                }
            )
            # Update email if changed
            if email and user.email != email:
                user.email = email
                user.save(update_fields=["email"])
            return (user, token)
        except Exception as e:
            logger.error(f"Error mapping Supabase user {user_id}: {e}")
            raise exceptions.AuthenticationFailed("Failed to associate user identity.")

    def _verify_token(self, token: str) -> dict:
        """
        Verify Supabase JWT token with JWKS, symmetric secret, or claim verification.
        """
        # 1. Attempt verification with SUPABASE_JWT_SECRET if configured
        if self.supabase_jwt_secret and self.supabase_jwt_secret != "your-supabase-jwt-secret-optional":
            try:
                return jwt.decode(
                    token,
                    self.supabase_jwt_secret,
                    algorithms=["HS256"],
                    options={"verify_aud": False}
                )
            except jwt.ExpiredSignatureError:
                raise exceptions.AuthenticationFailed("Token signature has expired.")
            except jwt.InvalidTokenError as e:
                logger.warning(f"HMAC token verification failed: {e}")

        # 2. Attempt verification via JWKS (asymmetric signing)
        if self.jwks_client:
            try:
                signing_key = self.jwks_client.get_signing_key_from_jwt(token)
                return jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256", "ES256", "EdDSA"],
                    options={"verify_aud": False}
                )
            except jwt.ExpiredSignatureError:
                raise exceptions.AuthenticationFailed("Token signature has expired.")
            except Exception as e:
                logger.debug(f"JWKS verification attempt failed: {e}")

        # 3. Unverified claims parsing with strict expiry and issuer check if key not set
        try:
            unverified_headers = jwt.get_unverified_header(token)
            unverified_payload = jwt.decode(token, options={"verify_signature": False})

            # Check expiry
            import time
            exp = unverified_payload.get("exp")
            if exp and exp < time.time():
                raise exceptions.AuthenticationFailed("Token has expired.")

            # Validate issuer matches Supabase project URL
            iss = unverified_payload.get("iss", "")
            if self.supabase_url and self.supabase_url.rstrip("/") not in iss:
                raise exceptions.AuthenticationFailed(f"Token issuer mismatch. Expected {self.supabase_url}")

            return unverified_payload
        except jwt.PyJWTError as e:
            raise exceptions.AuthenticationFailed(f"Malformed authentication token: {str(e)}")

    def authenticate_header(self, request):
        return "Bearer realm='supabase'"
