"""Configuration settings for AOSL C2 (Command & Control) Core Server.

Loads environment configuration for database paths, server network settings,
API key lifetimes, and LLM integrations.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env starting from module path up to parent directories
env_path = Path(__file__).resolve().parent / ".env"
if not env_path.exists():
    for parent in Path(__file__).resolve().parents:
        if (parent / ".env").exists():
            env_path = parent / ".env"
            break

load_dotenv(dotenv_path=env_path)

# Database file path configuration
DB_PATH: str = os.getenv("C2_DB_PATH", "data/c2.db")
DB_AUTH: str = os.getenv("C2_DB_AUTH", "data/auth.db")
DB_LOG: str = os.getenv("C2_DB_LOG", "data/log.db")

# Server network port configuration (prefers C2_PORT, falls back to PORT or 8000)
_port_str: str = os.getenv("C2_PORT", os.getenv("PORT", "8000"))
DEFAULT_PORT: int = int(_port_str) if _port_str.isdigit() else 8000

# API key validity duration in seconds (default: 24 hours)
KEY_EXPIRATION_SECONDS: int = int(os.getenv("KEY_EXPIRATION_SECONDS", "86400"))

# LLM integration settings
LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
