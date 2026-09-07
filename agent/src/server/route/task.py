
from typing import Dict, Any, Optional
from fastapi import (
    Header,
    HTTPException,
)

from server.routes import router, _require_agent
from db.db import get_db, init_db


@router.get("/tasks")
def task(
    payload: Dict[str, Any],x_api_key: Optional[str] = Header(None),
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
    agent = _require_agent(x_api_key, db_path)
    while agent:
        if payload.get("action") == "run":
            # Placeholder for task execution logic
            getRun = payload.get("command")
            return {"status":"ok", "message": "Task executed successfully", "command": getRun}
        if payload.get("action") == "dorking":
            # Placeholder for task status logic
            getDorking = payload.get("query"),payload.get("engineID")
            return {"status":"ok", "message": "Task executed successfully", "query": getDorking[0], "engineID": getDorking[1]}
        else:
            raise HTTPException(status_code=400, detail="Invalid action specified")
    return HTTPException(status_code=401, detail="Invalid API key")