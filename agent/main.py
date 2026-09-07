"""AOSL Agent Main Entrypoint.

Starts the FastAPI server for the AOSL Agent, handles database initialization on startup,
and configures application routers and settings.
"""

import uvicorn
from fastapi import FastAPI

from config import DEFAULT_PORT
from src.db.db import init_db
from src.server.routes import router

app = FastAPI(
    title="AOSL Agent",
    description="Agent HTTP server for Project-AOSL C2 communication",
    version="0.1.0",
)


@app.on_event("startup")
def on_startup() -> None:
    """Initialize database tables on FastAPI startup."""
    init_db()


app.include_router(router)


def main() -> None:
    """Run the Uvicorn server for the agent application."""
    uvicorn.run(app, host="0.0.0.0", port=DEFAULT_PORT)


if __name__ == "__main__":
    main()
