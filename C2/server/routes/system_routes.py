"""System health and statistics API routes for AOSL C2.

Provides system status checks, database metrics, and telemetry counters.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter
from loguru import logger
from server.db.database import get_db

router = APIRouter(prefix="/api/v1", tags=["System"])


@router.get("/healthC2")
@router.get("/healtC2")
def handle_health() -> Dict[str, Any]:
    """Retrieve health and uptime status of the C2 server.

    Returns:
        Dict[str, Any]: Status and health payload.
    """
    logger.bind(route="system").info("health check")
    return {"status": "healthy", "uptime": "ok"}


@router.get("/statsC2")
def handle_stats(db_path: Optional[str] = None) -> Dict[str, int]:
    """Retrieve system counts for registered users, agents, and dispatched tasks.

    Args:
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, int]: Dictionary containing counts for users, agents, and tasks.
    """
    with get_db(db_path) as conn:
        u_cnt = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        a_cnt = conn.execute("SELECT COUNT(*) as c FROM agents").fetchone()["c"]
        t_cnt = conn.execute("SELECT COUNT(*) as c FROM tasks").fetchone()["c"]
        logger.bind(route="system").info("stats queried users={} agents={} tasks={}", u_cnt, a_cnt, t_cnt)
        return {"users": u_cnt, "agents": a_cnt, "tasks": t_cnt}
