"""Security and authentication functions for C2 operators and users.

Provides credential authentication, API key generation and invalidation,
and FastAPI Bearer token dependency checks.
"""

import secrets
import time
from typing import Dict, Any, Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import KEY_EXPIRATION_SECONDS
from server.db.database import get_db

security_scheme = HTTPBearer(auto_error=False)


def authenticate_credentials(
    username: str,
    password: str,
    db_path: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Authenticate username and password credentials and generate a session API key.

    Args:
        username: Operator account username.
        password: Operator account password.
        db_path: Optional SQLite database file path override.

    Returns:
        Optional[Dict[str, Any]]: Auth response dict with api_key, expires_at, and user_id, or None if invalid.
    """
    with get_db(db_path) as conn:
        cur = conn.execute(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            (username, password)
        )
        row = cur.fetchone()
        if not row:
            return None

        api_key = secrets.token_hex(16)
        expires_at = time.time() + KEY_EXPIRATION_SECONDS
        conn.execute(
            "UPDATE users SET api_key = ?, api_key_expires = ? WHERE id = ?",
            (api_key, expires_at, row["id"])
        )
        return {"api_key": api_key, "expires_at": expires_at, "user_id": row["id"]}


def get_user_by_api_key(
    api_key: Optional[str],
    db_path: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Retrieve user record for a valid, non-expired API key.

    Args:
        api_key: Session API key string.
        db_path: Optional SQLite database file path override.

    Returns:
        Optional[Dict[str, Any]]: User record dictionary or None if key is invalid or expired.
    """
    if not api_key:
        return None
    with get_db(db_path) as conn:
        cur = conn.execute(
            "SELECT * FROM users WHERE api_key = ? AND api_key_expires > ?",
            (api_key, time.time())
        )
        row = cur.fetchone()
        return dict(row) if row else None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)
) -> Dict[str, Any]:
    """FastAPI dependency to extract and validate current authenticated user.

    Args:
        credentials: Bearer token authorization credentials.

    Returns:
        Dict[str, Any]: Authenticated user record dictionary.

    Raises:
        HTTPException: HTTP 401 if token is missing, invalid, or expired.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token")
    user = get_user_by_api_key(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired API key")
    return user


def invalidate_api_key(user_id: int, db_path: Optional[str] = None) -> bool:
    """Invalidate active API key session for a specific user ID.

    Args:
        user_id: ID of user account to log out / invalidate.
        db_path: Optional SQLite database file path override.

    Returns:
        bool: True if key was invalidated successfully.
    """
    with get_db(db_path) as conn:
        conn.execute(
            "UPDATE users SET api_key = NULL, api_key_expires = NULL WHERE id = ?",
            (user_id,)
        )
        return True
