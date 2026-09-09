"""Agent registration, listing, health monitoring, and management endpoints for AOSL C2.

Enables operators to view, register, query, and decommission remote agents.
"""

import secrets
import time
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

from server.db.database import get_db

router = APIRouter(prefix="/api/v1", tags=["Agents"])


class AgentRegisterRequest(BaseModel):
    """Payload model for registering a remote agent into C2."""
    ip: str
    name: str
    password: str = ""


@router.post("/agent/register")
def register_agent(req: AgentRegisterRequest) -> Dict[str, Any]:
    """Register a new remote agent into the C2 central database.

    Args:
        req: Agent registration payload containing IP and name.

    Returns:
        Dict[str, Any]: Confirmation message, assigned agent_id, and generated API key.
    """
    api_key = secrets.token_hex(16)
    agent_id = secrets.token_hex(8)
    now = time.time()

    with get_db() as conn:
        cur = conn.execute(
            """
            INSERT INTO agents (agent_id, api_key, name, ip, status, created_at, last_seen)
            VALUES (?, ?, ?, ?, 'active', ?, ?)
            """,
            (agent_id, api_key, req.name, req.ip, now, now)
        )
        logger.bind(route="agent").info("agent registered uuid={} name={} ip={}", agent_id, req.name, req.ip)
        return {
            "message": "Agent registered",
            "agent_id": cur.lastrowid,
            "agent_uuid": agent_id,
            "api_key": api_key
        }


@router.get("/agent/list")
def list_agents() -> Dict[str, List[Dict[str, Any]]]:
    """List all registered remote agents and their current status.

    Returns:
        Dict[str, List[Dict[str, Any]]]: Dictionary containing list of registered agents.
    """
    with get_db() as conn:
        cur = conn.execute("SELECT id, agent_id, name, ip, status, last_seen, created_at FROM agents")
        agents = [dict(r) for r in cur.fetchall()]
        logger.bind(route="agent").info("agent list queried ({} agents)", len(agents))
        return {"agents": agents}


@router.get("/agent/infobyid")
def get_agent_info(agentid: int) -> Dict[str, Any]:
    """Retrieve detailed metadata for a specific agent by ID.

    Args:
        agentid: Agent database ID query parameter.

    Returns:
        Dict[str, Any]: Agent metadata dictionary.

    Raises:
        HTTPException: 404 if agent not found.
    """
    with get_db() as conn:
        cur = conn.execute("SELECT * FROM agents WHERE id = ?", (agentid,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agent not found")
        logger.bind(route="agent").info("agent info queried id={}", agentid)
        return dict(row)


@router.get("/healt/infobyid")
def get_agent_health(agentid: int) -> Dict[str, Any]:
    """Check health and activity status for a registered agent by ID.

    Args:
        agentid: Agent database ID query parameter.

    Returns:
        Dict[str, Any]: Agent health status dictionary.

    Raises:
        HTTPException: 404 if agent not found.
    """
    with get_db() as conn:
        cur = conn.execute("SELECT id, name, status, last_seen FROM agents WHERE id = ?", (agentid,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agent not found")
        logger.bind(route="agent").info("agent health queried id={}", agentid)
        return dict(row)


@router.delete("/agent/delbyid")
def delete_agent(agentid: int) -> Dict[str, Any]:
    """Decommission and delete an agent record by ID.

    Args:
        agentid: Agent database ID query parameter.

    Returns:
        Dict[str, Any]: Deletion confirmation message.

    Raises:
        HTTPException: 404 if agent not found.
    """
    with get_db() as conn:
        cur = conn.execute("DELETE FROM agents WHERE id = ?", (agentid,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Agent not found")
        logger.bind(route="agent").info("agent deleted id={}", agentid)
        return {"message": f"Agent {agentid} deleted"}
