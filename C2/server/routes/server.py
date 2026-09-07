"""FastAPI application setup for AOSL C2 Core Server.

Configures database initialization hooks and includes modular API routers
for authentication, agent management, task orchestration, and system operations.
"""

from fastapi import FastAPI
from db.database import init_db
from routes.system_routes import router as system_router
from routes.user_routes import router as user_router
from routes.agent_routes import router as agent_router
from routes.task_routes import router as task_router

app = FastAPI(
    title="Project-AOSL C2 Core Engine",
    description="Lightweight REST API Command & Control (C2) server for security assessment orchestration",
    version="1.0.0",
)


@app.on_event("startup")
def on_startup() -> None:
    """Initialize database tables when C2 server starts up."""
    init_db()


app.include_router(system_router)
app.include_router(user_router)
app.include_router(agent_router)
app.include_router(task_router)
