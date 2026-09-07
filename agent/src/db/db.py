"""Database connection management and schema initialization for AOSL Agent.

Provides SQLite database connection management via context managers and handles
schema migrations/initialization for agent registration and task state.
"""

import os
import sqlite3
from contextlib import contextmanager
from typing import Generator, Optional, Any

from config import DB_PATH


@contextmanager
def get_db(db_path: Optional[str] = None) -> Generator[sqlite3.Connection, None, None]:
    """Provide a transactional scope around SQLite database operations.

    Args:
        db_path: Optional override path for SQLite database file. Defaults to config.DB_PATH.

    Yields:
        sqlite3.Connection: Database connection configured with Row factory.
    """
    target_path = db_path if db_path else DB_PATH
    db_dir = os.path.dirname(target_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(target_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(db_path: Optional[str] = None) -> None:
    """Initialize SQLite database tables for agents and tasks if they do not exist.

    Args:
        db_path: Optional override path for SQLite database file.
    """
    with get_db(db_path) as conn:
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


def validate_api_key(conn: sqlite3.Connection, api_key: Optional[str]) -> Optional[sqlite3.Row]:
    """Validate an API key against registered agents in the database.

    Args:
        conn: SQLite database connection.
        api_key: API key string to validate.

    Returns:
        Optional[sqlite3.Row]: Agent database row if valid, None otherwise.
    """
    if not api_key:
        return None
    cur = conn.execute("SELECT * FROM agents WHERE api_key = ?", (api_key,))
    return cur.fetchone()


def update_last_seen(conn: sqlite3.Connection, agent_id: int) -> None:
    """Update last_seen timestamp for a registered agent.

    Args:
        conn: SQLite database connection.
        agent_id: Database ID of the agent.
    """
    import time
    conn.execute("UPDATE agents SET last_seen = ? WHERE id = ?", (time.time(), agent_id))
