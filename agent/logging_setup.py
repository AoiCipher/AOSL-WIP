"""Loguru-to-SQLite logging for the AOSL Agent.

All agent logs flow through loguru into one SQLite database (config.DB_LOGS,
inside the agent folder). The logs table is dropped and recreated on every
agent startup ("refresh on down" mode), rows are capped via AGENT_LOG_CAP,
and loguru extras are stored as a JSON column.
"""

import json
import os
import sqlite3
import sys

from loguru import logger

from config import DB_LOGS


def setup_logging(log_db_path: str | None = None) -> None:
    """Drop/recreate the logs table and wire loguru sinks (stderr + SQLite)."""
    path = log_db_path or DB_LOGS
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

    conn = sqlite3.connect(path)
    try:
        # agent-down refresh: old table dropped, fresh one on boot
        conn.execute("DROP TABLE IF EXISTS logs")
        conn.execute(
            """CREATE TABLE logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                time REAL NOT NULL,
                level TEXT NOT NULL,
                module TEXT NOT NULL,
                message TEXT NOT NULL,
                extra TEXT NOT NULL
            )"""
        )
        conn.commit()
    finally:
        conn.close()

    cap = int(os.getenv("AGENT_LOG_CAP", "5000"))

    def db_sink(message) -> None:
        conn = sqlite3.connect(path)
        try:
            record = message.record
            conn.execute(
                "INSERT INTO logs (time, level, module, message, extra) VALUES (?, ?, ?, ?, ?)",
                (
                    record["time"].timestamp(),
                    record["level"].name,
                    record["name"],
                    str(message),
                    json.dumps(record["extra"], default=str),
                ),
            )
            # ponytail: per-write connect + O(n) cap prune; batch/queue if write volume grows
            conn.execute(
                "DELETE FROM logs WHERE id NOT IN (SELECT id FROM logs ORDER BY id DESC LIMIT ?)",
                (cap,),
            )
            conn.commit()
        finally:
            conn.close()

    logger.remove()
    logger.add(db_sink, level=os.getenv("AGENT_LOG_LEVEL", "INFO"))
    logger.add(sys.stderr, level="DEBUG")
