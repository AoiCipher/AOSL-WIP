"""AOSL Agent Main Entrypoint.

Starts the FastAPI server for the AOSL Agent, handles database initialization on startup,
and configures application routers and settings.
"""

import uvicorn
from fastapi import FastAPI, Request

from config import DEFAULT_PORT
from logging_setup import setup_logging
from loguru import logger
from server.db import init_db
from server.routes.routes import router

app = FastAPI(
    title="AOSL Agent",
    description="Agent HTTP server for Project-AOSL C2 communication",
    version="0.1.0",
)


@app.middleware("http")
async def log_connections(request: Request, call_next):
    """Log every HTTP connection (who, what) to log.db via loguru."""
    response = await call_next(request)
    logger.bind(ip=request.client.host, method=request.method, path=request.url.path).info(
        "connect {} {} -> {}", request.client.host, request.method, request.url.path
    )
    return response


@app.on_event("startup")
def on_startup() -> None:
    """Initialize database tables on FastAPI startup."""
    setup_logging()
    init_db()


app.include_router(router)


def main() -> None:
    """Run the Uvicorn server for the agent application."""
    uvicorn.run(app, host="0.0.0.0", port=DEFAULT_PORT)


if __name__ == "__main__":
    main()
