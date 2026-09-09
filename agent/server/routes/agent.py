import time

import psutil
from typing import Dict, Any, Optional
from fastapi import Header, HTTPException

from server.db import get_db, init_db
from server.routes.routes import router, _require_agent


@router.post("/register")
def register(
    payload: Dict[str, Any], x_forwarded_for: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """Register agent with C2 server using assigned API key.

    Raises 400 if apikey is missing, 409 if already registered.
    """

    apikey = payload.get("apikey")
    name = payload.get("name") or payload.get("agent_name") or "unnamed-agent"
    if not apikey:
        raise HTTPException(status_code=400, detail="apikey required (given by C2)")

    init_db()
    with get_db() as conn:
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
        }


@router.get("/health")
def health(x_api_key: str = Header(...)) -> Dict[str, Any]:
    """Return system health metrics for the authenticated agent."""
    agent = _require_agent(x_api_key)
    return {
        "status": "ok",
        "agent_name": agent["name"],
        "cpu_percent": psutil.cpu_percent(interval=None),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage("/").percent,
        "timestamp": time.time(),
    }
