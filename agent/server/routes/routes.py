"""API router and shared auth dependency for AOSL Agent endpoints."""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException

from server.db import get_db, init_db, validate_api_key, update_last_seen

router = APIRouter(prefix="/agent/v1", tags=["Agent"])


def _require_agent(x_api_key: str) -> Dict[str, Any]:
    """Validate X-API-Key and return the agent record, or raise 401."""
    init_db()
    with get_db() as conn:
        agent = validate_api_key(conn, x_api_key)
        if not agent:
            raise HTTPException(status_code=401, detail="Invalid or missing api key")
        update_last_seen(conn, agent["id"])
        return dict(agent)


# Side-effect imports: register route handlers onto the shared router.
# Must come after router and _require_agent are defined (circular-import safe).
import server.routes.agent  # noqa: E402, F401
import server.routes.task   # noqa: E402, F401
