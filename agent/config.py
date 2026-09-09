"""Configuration settings for the AOSL Agent.

Manages environment variable loading and default configuration values for the
Agent service.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from local .env file if available
load_dotenv(BASE_DIR / ".env", override=False)


def _get_int_env(name: str, default: int) -> int:
    """Safely fetch an integer environment variable with a default fallback."""
    value = os.getenv(name)
    if value in (None, ""):
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


# Database path configuration
DB_PATH = os.getenv("AGENT_DB_PATH", "data/agent.db")
DB_AUTH = os.getenv("AGENT_DB_AUTH", "data/auth.db")
DB_LOGS = os.getenv("AGENT_DB_LOGS") or str(BASE_DIR / "data" / "logs.db")

# Default HTTP server port
DEFAULT_PORT = _get_int_env("AGENT_PORT", 8000)
