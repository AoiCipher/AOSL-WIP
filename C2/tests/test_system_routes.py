import unittest
import os
import sys
from unittest.mock import patch
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.db import database
from server.db.database import init_db
from server.routes.server import app

TEST_DB = "test_system_api.db"

class TestSystemRoutesAPI(unittest.TestCase):
    def setUp(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)
        init_db(TEST_DB)
        self.patcher = patch.object(database, "DB_PATH", TEST_DB)
        self.patcher.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.patcher.stop()
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)

    def test_system_endpoints(self):
        res = self.client.get("/api/v1/healthC2")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

        res = self.client.get("/api/v1/statsC2")
        self.assertEqual(res.status_code, 200)
        self.assertIn("users", res.json())

if __name__ == "__main__":
    unittest.main()
