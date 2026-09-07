"""API routes for AOSL Agent HTTP endpoints and WebSocket service.

Handles agent registration, health check metrics, task management, and
real-time telemetry over WebSockets.
"""

import psutil
import time
import uuid
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Header, HTTPException, WebSocket, WebSocketDisconnect, Query

from src.db.db import get_db, init_db, validate_api_key, update_last_seen

router = APIRouter(prefix="/agent/v1", tags=["Agent"])


def _require_agent(x_api_key: Optional[str], db_path: Optional[str] = None) -> Dict[str, Any]:
    """Validate X-API-Key request header against agent database.

    Args:
        x_api_key: The API key passed in request headers.
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, Any]: Dictionary representing registered agent record.

    Raises:
        HTTPException: If API key is missing or invalid (HTTP 401).
    """
    init_db(db_path)
    with get_db(db_path) as conn:
        agent = validate_api_key(conn, x_api_key)
        if not agent:
            raise HTTPException(status_code=401, detail="Invalid or missing api key")
        update_last_seen(conn, agent["id"])
        return dict(agent)



