"""Task management and dispatch API routes for AOSL C2.

Allows operators to dispatch commands to agents, list queued tasks,
and query task status and execution results.
"""

import time
import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

from server.db.database import get_db

router = APIRouter(prefix="/api/v1", tags=["Tasks"])


class TaskCreateRequest(BaseModel):
    """Payload model for creating and dispatching a task to an agent."""
    agent_id: str
    command: str


@router.post("/task/new")
def create_task(req: TaskCreateRequest) -> Dict[str, Any]:
    """Dispatch a new command task to a target agent.

    Args:
        req: Task creation request with target agent_id and command string.

    Returns:
        Dict[str, Any]: Confirmation message and created task_id.
    """
    task_uuid = str(uuid.uuid4())
    now = time.time()

    with get_db() as conn:
        cur = conn.execute(
            """
            INSERT INTO tasks (task_id, agent_id, command, status, created_at, updated_at)
            VALUES (?, ?, ?, 'pending', ?, ?)
            """,
            (task_uuid, req.agent_id, req.command, now, now)
        )
        logger.bind(route="task").info("task created uuid={} agent={} cmd={}", task_uuid, req.agent_id, req.command)
        return {
            "message": "Task created",
            "task_id": cur.lastrowid,
            "task_uuid": task_uuid
        }


@router.get("/task/list")
def list_tasks() -> Dict[str, List[Dict[str, Any]]]:
    """List all tasks across all agents in the C2 system.

    Returns:
        Dict[str, List[Dict[str, Any]]]: Dictionary containing list of all tasks.
    """
    with get_db() as conn:
        cur = conn.execute("SELECT * FROM tasks ORDER BY created_at DESC")
        tasks = [dict(r) for r in cur.fetchall()]
        logger.bind(route="task").info("task list queried ({} tasks)", len(tasks))
        return {"tasks": tasks}


@router.get("/task/taskinfobyid")
def get_task_info(taskid: int) -> Dict[str, Any]:
    """Retrieve detailed information and execution status for a task by ID.

    Args:
        taskid: Task database ID query parameter.

    Returns:
        Dict[str, Any]: Task detail dictionary.

    Raises:
        HTTPException: 404 if task not found.
    """
    with get_db() as conn:
        cur = conn.execute("SELECT * FROM tasks WHERE id = ?", (taskid,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Task not found")
        logger.bind(route="task").info("task info queried id={}", taskid)
        return dict(row)
