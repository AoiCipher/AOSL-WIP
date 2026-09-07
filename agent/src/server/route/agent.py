import psutil
import time
from typing import Dict, Any, Optional
from fastapi import (
    Header,
    HTTPException,
    
)

from server.routes import router, _require_agent
from db.db import get_db, init_db

@router.post("/register")
def register(
    payload: Dict[str, Any],
    x_forwarded_for: Optional[str] = Header(None),
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    """Register agent with C2 server using assigned API key.

    Args:
        payload: JSON body containing 'apikey', optional 'name' or 'agent_name', and 'ip'.
        x_forwarded_for: Header for proxy client IP forwarding.
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, Any]: Registration result with agent_id and confirmation message.

    Raises:
        HTTPException: 400 if apikey is missing, 409 if already registered.
    """
    apikey = payload.get("apikey")
    name = payload.get("name") or payload.get("agent_name") or "unnamed-agent"
    if not apikey:
        raise HTTPException(status_code=400, detail="apikey required (given by C2)")

    init_db(db_path)
    with get_db(db_path) as conn:
        existing = conn.execute(
            "SELECT * FROM agents WHERE api_key = ?", (apikey,)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Agent already registered")

        ip = payload.get("ip") or x_forwarded_for or "0.0.0.0"
        now = time.time()
        cur = conn.execute(
            "INSERT INTO agents (api_key, name, ip, status, created_at, last_seen) VALUES (?, ?, ?, 'active', ?, ?)",
            (apikey, name, ip, now, now),
        )
        return {
            "message": "Agent registered",
            "agent_id": cur.lastrowid,
            "api_key": apikey,
        }


@router.get("/health")
def health(
    x_api_key: Optional[str] = Header(None), db_path: Optional[str] = None
) -> Dict[str, Any]:
    """Retrieve system health and resource utilization metrics.

    Args:
        x_api_key: Agent API key header.
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, Any]: Health metrics including CPU, RAM, storage, and status.
    """
    agent = _require_agent(x_api_key, db_path)
    return {
        "status": "ok",
        "agent_name": agent["name"],
        "cpu_percent": psutil.cpu_percent(interval=None),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage("/").percent,
        "timestamp": time.time(),
    }
