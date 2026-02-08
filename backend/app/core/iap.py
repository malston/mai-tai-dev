"""Google Identity-Aware Proxy (IAP) JWT validation.

This module validates IAP JWT tokens passed in the X-Goog-IAP-JWT-Assertion header.
Used in production when USE_IAP=true.
"""

from dataclasses import dataclass

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.config import get_settings


@dataclass
class IAPUserInfo:
    """User info extracted from IAP JWT."""

    email: str
    sub: str  # Google's unique user ID (stable across sessions)
    name: str | None = None


class IAPValidationError(Exception):
    """Raised when IAP token validation fails."""

    pass


def validate_iap_jwt(iap_jwt: str) -> IAPUserInfo:
    """
    Validate IAP JWT and return user info.

    Args:
        iap_jwt: The JWT from X-Goog-IAP-JWT-Assertion header

    Returns:
        IAPUserInfo with user's email and Google sub (unique ID)

    Raises:
        IAPValidationError: If token is invalid or expired
    """
    settings = get_settings()

    if not settings.iap_audience:
        raise IAPValidationError("IAP_AUDIENCE not configured")

    try:
        # Verify the token using Google's public keys
        decoded_jwt = id_token.verify_token(
            iap_jwt,
            google_requests.Request(),
            audience=settings.iap_audience,
            certs_url="https://www.gstatic.com/iap/verify/public_key",
        )

        email = decoded_jwt.get("email")
        sub = decoded_jwt.get("sub")

        if not email or not sub:
            raise IAPValidationError("Missing email or sub in IAP token")

        return IAPUserInfo(
            email=email,
            sub=sub,
            name=decoded_jwt.get("name"),
        )

    except ValueError as e:
        raise IAPValidationError(f"Invalid IAP token: {e}")
    except Exception as e:
        raise IAPValidationError(f"IAP validation failed: {e}")

