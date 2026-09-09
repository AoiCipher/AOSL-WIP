"""Tests for loguru-to-SQLite logging setup (src/logging_setup.py)."""

import json
import os
import sqlite3
import sys
import tempfile
import unittest

agent_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if agent_root not in sys.path:
    sys.path.insert(0, agent_root)

from logging_setup import setup_logging
from loguru import logger


class LoggingSetupTest(unittest.TestCase):
    def setUp(self):
        fd, self.db = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        self.rows = lambda: sqlite3.connect(self.db).execute(
            "SELECT time, level, module, message, extra FROM logs"
        ).fetchall()

    def tearDown(self):
        os.remove(self.db)

    def test_logs_land_in_db_with_json_extra(self):
        setup_logging(self.db)
        logger.bind(user="c2-server", port=8000).info("who connected")
        row = self.rows()[-1]
        self.assertEqual(row[1], "INFO")
        self.assertIn("who connected", row[3])
        self.assertEqual(json.loads(row[4])["user"], "c2-server")

    def test_refresh_drops_old_rows(self):
        setup_logging(self.db)
        logger.info("old run")
        setup_logging(self.db)  # agent down -> restart
        self.assertEqual(self.rows(), [])
        logger.info("new run")
        self.assertEqual(len(self.rows()), 1)

    def test_cap_enforced(self):
        os.environ["AGENT_LOG_CAP"] = "3"
        try:
            setup_logging(self.db)
            for i in range(5):
                logger.info("row {}", i)
            rows = self.rows()
            self.assertEqual(len(rows), 3)
            self.assertIn("row 4", rows[-1][3])
        finally:
            os.environ.pop("AGENT_LOG_CAP", None)


if __name__ == "__main__":
    unittest.main()
