import time
import uuid
from typing import Dict, Any
from fastapi import Header, HTTPException

from server.db import get_db
from server.routes.routes import router, _require_agent


@router.post("/tasks")
def create_task(payload: Dict[str, Any], x_api_key: str = Header(...)) -> Dict[str, Any]:
    """Create a task for the authenticated agent."""
    _require_agent(x_api_key)
    command = payload.get("command")
    if not command:
        raise HTTPException(status_code=400, detail="command required")
    task_id = uuid.uuid4().hex
    now = time.time()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO tasks (task_id, command, status, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?)",
            (task_id, command, now, now),
        )
    return {"status": "ok", "task_id": task_id}


@router.get("/tasks")
def list_tasks(x_api_key: str = Header(...)) -> list[Dict[str, Any]]:
    """List all tasks."""
    _require_agent(x_api_key)
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM tasks").fetchall()
    return [dict(r) for r in rows]


@router.get("/tasks/{task_id}")
def get_task(task_id: str, x_api_key: str = Header(...)) -> Dict[str, Any]:
    """Retrieve a task by ID."""
    _require_agent(x_api_key)
    with get_db() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE task_id = ?", (task_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    return dict(row)
