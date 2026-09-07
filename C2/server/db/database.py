"""Database schema initialization and connection context management for AOSL C2.

Provides SQLite database connectivity and initializes tables for operators/users,
agents, and dispatched tasks. Seeds initial default admin account if uninitialized.
"""

import os
import sqlite3
import time
from contextlib import contextmanager
from typing import Generator, Optional

from config import DB_PATH


@contextmanager
def get_db(db_path: Optional[str] = None) -> Generator[sqlite3.Connection, None, None]:
    """Provide a transactional scope around C2 SQLite database operations.

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
    """Initialize database tables for users, agents, and tasks if they do not exist.

    Args:
        db_path: Optional override path for SQLite database file.
    """
    with get_db(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                api_key TEXT,
                api_key_expires REAL,
                role TEXT NOT NULL DEFAULT 'operator',
                created_at REAL NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS agents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT UNIQUE NOT NULL,
                api_key TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                ip TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'offline',
                last_seen REAL,
                created_at REAL NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT UNIQUE NOT NULL,
                agent_id TEXT NOT NULL,
                command TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                result TEXT,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL,
                FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
            )
        """)

        # Seed default admin user if database has no users
        cur = conn.execute("SELECT COUNT(*) FROM users")
        if cur.fetchone()[0] == 0:
            conn.execute(
                "INSERT INTO users (username, password, role, created_at) VALUES (?, ?, 'admin', ?)",
                ("admin", "adminpass", time.time())
            )
