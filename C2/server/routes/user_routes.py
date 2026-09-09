"""User authentication and operator account management routes for AOSL C2.

Provides endpoints for login, logout, listing operators, querying user profiles,
creating new operator accounts, and removing operator accounts.
"""

import time
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from loguru import logger

from server.db.database import get_db
from server.auth.security import authenticate_credentials, get_current_user, invalidate_api_key

router = APIRouter(prefix="/api/v1", tags=["Users"])


class LoginRequest(BaseModel):
    """Payload model for operator login requests."""
    username: str
    password: str


class UserCreateRequest(BaseModel):
    """Payload model for creating a new operator user account."""
    username: str
    password: str
    privilege: str = "USER"
    permissions: str = ""


@router.post("/login")
def login(req: LoginRequest) -> Dict[str, Any]:
    """Authenticate user credentials and receive session API key.

    Args:
        req: LoginRequest model with username and password.

    Returns:
        Dict[str, Any]: Authentication payload with api_key, expires_at, and user_id.

    Raises:
        HTTPException: 401 if credentials are invalid.
    """
    res = authenticate_credentials(req.username, req.password)
    if not res:
        logger.bind(route="user").warning("login failed user={}", req.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    logger.bind(route="user").info("login success user={} user_id={}", req.username, res["user_id"])
    return res


@router.post("/logout")
def logout(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Invalidate current active session API key.

    Args:
        user: Authenticated current user dict from Bearer token.

    Returns:
        Dict[str, Any]: Logout confirmation message.
    """
    invalidate_api_key(user["id"])
    logger.bind(route="user").info("logout user_id={}", user["id"])
    return {"message": "Logged out"}


@router.get("/user")
def list_users() -> Dict[str, List[Dict[str, Any]]]:
    """List all registered operators and users.

    Returns:
        Dict[str, List[Dict[str, Any]]]: Dictionary containing list of user records.
    """
    with get_db() as conn:
        cur = conn.execute("SELECT id, username, role AS privilege, '' AS permissions FROM users")
        users = [dict(r) for r in cur.fetchall()]
        logger.bind(route="user").info("user list queried ({} users)", len(users))
        return {"users": users}


@router.get("/user/userinfobyid")
def get_user_info(userid: int) -> Dict[str, Any]:
    """Get details for a specific user profile by user ID.

    Args:
        userid: User ID query parameter.

    Returns:
        Dict[str, Any]: User profile dictionary.

    Raises:
        HTTPException: 404 if user not found.
    """
    with get_db() as conn:
        cur = conn.execute("SELECT id, username, role AS privilege, '' AS permissions FROM users WHERE id = ?", (userid,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        logger.bind(route="user").info("user info queried id={}", userid)
        return dict(row)


@router.post("/user/create")
def create_user(
    req: UserCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Create a new operator user account.

    Args:
        req: User creation request model.
        current_user: Authenticated operator user dict.

    Returns:
        Dict[str, Any]: Creation confirmation and new user ID.

    Raises:
        HTTPException: 409 if username exists.
    """
    with get_db() as conn:
        cur = conn.execute("SELECT id FROM users WHERE username = ?", (req.username,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Username already exists")

        now = time.time()
        role = req.privilege or "operator"
        cur = conn.execute(
            "INSERT INTO users (username, password, role, created_at) VALUES (?, ?, ?, ?)",
            (req.username, req.password, role, now)
        )
        logger.bind(route="user").info("user created username={} role={}", req.username, role)
        return {"message": "User created", "user_id": cur.lastrowid}


@router.delete("/user/delate")
def delete_user(
    userid: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Delete an operator user account by user ID.

    Args:
        userid: User ID query parameter.
        current_user: Authenticated operator user dict.

    Returns:
        Dict[str, Any]: Deletion confirmation message.

    Raises:
        HTTPException: 404 if user not found.
    """
    with get_db() as conn:
        cur = conn.execute("DELETE FROM users WHERE id = ?", (userid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        logger.bind(route="user").info("user deleted id={}", userid)
        return {"message": f"User {userid} deleted"}
