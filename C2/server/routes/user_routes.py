"""User authentication and operator account management routes for AOSL C2.

Provides endpoints for login, logout, listing operators, querying user profiles,
creating new operator accounts, and removing operator accounts.
"""

import time
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
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
    username: Optional[str] = None
    password: Optional[str] = None
    privilege: Optional[str] = "USER"
    permissions: Optional[str] = ""


@router.post("/login")
def login(req: LoginRequest, db_path: Optional[str] = None) -> Dict[str, Any]:
    """Authenticate user credentials and receive session API key.

    Args:
        req: LoginRequest model with username and password.
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, Any]: Authentication payload with api_key, expires_at, and user_id.

    Raises:
        HTTPException: 401 if credentials are invalid.
    """
    res = authenticate_credentials(req.username, req.password, db_path=db_path)
    if not res:
        logger.bind(route="user").warning("login failed user={}", req.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    logger.bind(route="user").info("login success user={} user_id={}", req.username, res["user_id"])
    return res


@router.post("/logout")
def logout(
    user: Dict[str, Any] = Depends(get_current_user),
    db_path: Optional[str] = None
) -> Dict[str, Any]:
    """Invalidate current active session API key.

    Args:
        user: Authenticated current user dict from Bearer token.
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, Any]: Logout confirmation message.
    """
    invalidate_api_key(user["id"], db_path=db_path)
    logger.bind(route="user").info("logout user_id={}", user["id"])
    return {"message": "Logged out"}


@router.get("/user")
def list_users(db_path: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """List all registered operators and users.

    Args:
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, List[Dict[str, Any]]]: Dictionary containing list of user records.
    """
    with get_db(db_path) as conn:
        cur = conn.execute("SELECT id, username, role AS privilege, '' AS permissions FROM users")
        users = [dict(r) for r in cur.fetchall()]
        logger.bind(route="user").info("user list queried ({} users)", len(users))
        return {"users": users}


@router.get("/user/userinfobyid")
def get_user_info(
    userid: Optional[int] = Query(None),
    id: Optional[int] = Query(None),
    db_path: Optional[str] = None
) -> Dict[str, Any]:
    """Get details for a specific user profile by user ID.

    Args:
        userid: User ID query parameter.
        id: Alternative ID query parameter.
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, Any]: User profile dictionary.

    Raises:
        HTTPException: 400 if user ID is missing, 404 if user not found.
    """
    uid = userid if userid is not None else id
    if uid is None:
        raise HTTPException(status_code=400, detail="User ID required")

    with get_db(db_path) as conn:
        cur = conn.execute("SELECT id, username, role AS privilege, '' AS permissions FROM users WHERE id = ?", (uid,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        logger.bind(route="user").info("user info queried id={}", uid)
        return dict(row)


@router.post("/user/create")
def create_user(
    req: UserCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_path: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new operator user account.

    Args:
        req: User creation request model.
        current_user: Authenticated operator user dict.
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, Any]: Creation confirmation and new user ID.

    Raises:
        HTTPException: 400 if missing username/password, 409 if username exists.
    """
    if not req.username or not req.password:
        raise HTTPException(status_code=400, detail="Username and password are required")

    with get_db(db_path) as conn:
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
    userid: Optional[int] = Query(None),
    id: Optional[int] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db_path: Optional[str] = None
) -> Dict[str, Any]:
    """Delete an operator user account by user ID.

    Args:
        userid: User ID query parameter.
        id: Alternative ID query parameter.
        current_user: Authenticated operator user dict.
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, Any]: Deletion confirmation message.

    Raises:
        HTTPException: 400 if ID missing, 404 if user not found.
    """
    uid = userid if userid is not None else id
    if uid is None:
        raise HTTPException(status_code=400, detail="User ID required")

    with get_db(db_path) as conn:
        cur = conn.execute("DELETE FROM users WHERE id = ?", (uid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")
        logger.bind(route="user").info("user deleted id={}", uid)
        return {"message": f"User {uid} deleted"}
