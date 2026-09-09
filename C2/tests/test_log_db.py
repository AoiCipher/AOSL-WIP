import unittest
import os
import sqlite3
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import server.logsink as logsink
from loguru import logger
from server.logsink import setup_logging
from server.routes.server import app

TEST_LOG_DB = "test_log.db"


class TestLogDb(unittest.TestCase):
    def setUp(self):
        if os.path.exists(TEST_LOG_DB):
            os.remove(TEST_LOG_DB)
        logsink.DB_LOG = TEST_LOG_DB
        logger.remove()  # drop sinks stacked by previous tests
        setup_logging()

    def tearDown(self):
        if os.path.exists(TEST_LOG_DB):
            os.remove(TEST_LOG_DB)

    def test_connection_logged_with_structured_columns(self):
        with TestClient(app) as client:
            res = client.get("/api/v1/healthC2")
            self.assertEqual(res.status_code, 200)
        rows = logsink.query_logs(limit=100)
        self.assertTrue(any("connect" in r["message"] for r in rows), rows)
        conn_row = next(r for r in rows if "connect" in r["message"])
        self.assertEqual(conn_row["method"], "GET")
        self.assertEqual(conn_row["path"], "/api/v1/healthC2")
        self.assertEqual(conn_row["status"], 200)
        self.assertEqual(conn_row["ip"], "testclient")

    def test_route_log_row(self):
        with TestClient(app) as client:
            res = client.get("/api/v1/healthC2")
            self.assertEqual(res.status_code, 200)
        rows = logsink.query_logs(limit=100)
        self.assertTrue(any(r["route"] == "system" for r in rows), rows)

    def test_table_schema(self):
        with sqlite3.connect(TEST_LOG_DB) as conn:
            cols = [r[1] for r in conn.execute("PRAGMA table_info(logs)").fetchall()]
        self.assertEqual(
            cols, ["id", "ts", "level", "message", "ip", "method", "path", "status", "route", "extra"]
        )

    def test_old_schema_dropped(self):
        with sqlite3.connect(TEST_LOG_DB) as conn:
            conn.execute("DROP TABLE logs")
            conn.execute("CREATE TABLE logs (id INTEGER PRIMARY KEY, ts REAL, level TEXT, message TEXT)")
        setup_logging()
        with sqlite3.connect(TEST_LOG_DB) as conn:
            cols = [r[1] for r in conn.execute("PRAGMA table_info(logs)").fetchall()]
        self.assertIn("ip", cols)

    def test_row_prune(self):
        import sqlite3 as s3
        with s3.connect(TEST_LOG_DB) as conn:
            conn.executemany(
                "INSERT INTO logs (ts, level, message) VALUES (?, 'INFO', 'seed')",
                [(0.0,)] * (logsink.MAX_ROWS + 5),
            )
        logsink.sqlite_sink._n = logsink._PRUNE_EVERY - 1  # next insert triggers prune
        logsink.setup_logging.__globals__["logger"].info("trigger prune")
        with s3.connect(TEST_LOG_DB) as conn:
            count = conn.execute("SELECT COUNT(*) FROM logs").fetchone()[0]
        self.assertEqual(count, logsink.MAX_ROWS)


if __name__ == "__main__":
    unittest.main()
