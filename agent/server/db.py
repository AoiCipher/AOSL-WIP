"""Database connection and schema management for AOSL Agent."""

import os
import sqlite3
import time
from contextlib import contextmanager
from typing import Generator

from config import DB_PATH


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Transactional SQLite connection using config.DB_PATH."""
    db_dir = os.path.dirname(DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Create agents and tasks tables if they do not exist."""
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS agents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                ip TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                created_at REAL NOT NULL,
                last_seen REAL NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT UNIQUE NOT NULL,
                command TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                result TEXT,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            )
        """)


def validate_api_key(conn: sqlite3.Connection, api_key: str) -> sqlite3.Row | None:
    """Return the agent row for api_key, or None if missing/invalid."""
    if not api_key:
        return None
    return conn.execute("SELECT * FROM agents WHERE api_key = ?", (api_key,)).fetchone()


def update_last_seen(conn: sqlite3.Connection, agent_id: int) -> None:
    conn.execute("UPDATE agents SET last_seen = ? WHERE id = ?", (time.time(), agent_id))
