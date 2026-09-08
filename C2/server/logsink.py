"""Loguru sqlite sink persisting all C2 logs into log.db (with row-cap rotation)."""

import json
import sqlite3
from contextlib import closing
from pathlib import Path

from loguru import logger

from config import DB_LOG

MAX_ROWS = 50_000
_PRUNE_EVERY = 1000

_SCHEMA = """
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    ip TEXT,
    method TEXT,
    path TEXT,
    status INTEGER,
    route TEXT,
    extra TEXT
)
"""


def _ensure_table() -> None:
    Path(DB_LOG).parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(DB_LOG)) as conn, conn:
        cols = {r[1] for r in conn.execute("PRAGMA table_info(logs)").fetchall()}
        if cols and "ip" not in cols:
            # ponytail: drop-and-recreate instead of ALTER migration; logs are
            # ephemeral, ALTER the _SCHEMA guard out if history must survive
            conn.execute("DROP TABLE logs")
        conn.execute(_SCHEMA)


def sqlite_sink(message: "loguru.Message") -> None:
    """Write one loguru record into the logs table of log.db."""
    record = message.record
    extra = {k: v for k, v in record["extra"].items()}
    ip = extra.pop("ip", None)
    method = extra.pop("method", None)
    path = extra.pop("path", None)
    status = extra.pop("status", None)
    route = extra.pop("route", None)
    # ponytail: one sqlite connection per write; switch to a persistent
    # conn + lock (or WAL) if insert contention shows up under load
    with closing(sqlite3.connect(DB_LOG)) as conn, conn:
        conn.execute(
            "INSERT INTO logs (ts, level, message, ip, method, path, status, route, extra)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                record["time"].timestamp(),
                record["level"].name,
                str(message),
                ip,
                method,
                path,
                status,
                route,
                json.dumps(extra) if extra else None,
            ),
        )
        sqlite_sink._n = getattr(sqlite_sink, "_n", 0) + 1
        if sqlite_sink._n % _PRUNE_EVERY == 0:
            # ponytail: count-based cap, not bytes or age; switch to a
            # ts-based DELETE if old-entries retention ever matters
            conn.execute(
                "DELETE FROM logs WHERE id NOT IN"
                " (SELECT id FROM logs ORDER BY id DESC LIMIT ?)",
                (MAX_ROWS,),
            )


def setup_logging() -> None:
    """Attach the log.db sink so every loguru log lands in sqlite."""
    _ensure_table()
    logger.add(sqlite_sink, serialize=False)


def query_logs(limit: int = 100) -> list:
    """Return the most recent log rows from log.db."""
    with closing(sqlite3.connect(DB_LOG)) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute("SELECT * FROM logs ORDER BY id DESC LIMIT ?", (limit,))
        return cur.fetchall()
