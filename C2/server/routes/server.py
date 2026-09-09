"""FastAPI application setup for AOSL C2 Core Server.

Configures database initialization hooks and includes modular API routers
for authentication, agent management, task orchestration, and system operations.
"""

from fastapi import FastAPI, Request
from loguru import logger
from server.db.database import init_db
from server.logsink import setup_logging
from server.routes.system_routes import router as system_router
from server.routes.user_routes import router as user_router
from server.routes.agent_routes import router as agent_router
from server.routes.task_routes import router as task_router

app = FastAPI(
    title="AOSL C2 Core Engine",
    description="Lightweight REST API Command & Control (C2) server for security assessment orchestration",
    version="1.0.0",
)


@app.on_event("startup")
def on_startup() -> None:
    """Initialize database tables and logging sinks when C2 server starts up."""

    setup_logging()
    logger.info("C2 server starting")
    init_db()


@app.middleware("http")
async def log_connections(request: Request, call_next):
    """Log every incoming connection (client IP, method, path, status) to log.db."""
    response = await call_next(request)
    client_ip = request.client.host if request.client else "unknown"
    logger.bind(
        ip=client_ip,
        method=request.method,
        path=request.url.path,
        status=response.status_code,
    ).info("connect {} {} {} -> {}", client_ip, request.method, request.url.path, response.status_code)
    return response


app.include_router(system_router)
app.include_router(user_router)
app.include_router(agent_router)
app.include_router(task_router)
