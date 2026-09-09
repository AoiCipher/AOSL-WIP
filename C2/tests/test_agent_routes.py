import unittest
import os
import sys
from unittest.mock import patch
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.db import database
from server.db.database import init_db
from server.routes.server import app

TEST_DB = "test_agent_api.db"

class TestAgentRoutesAPI(unittest.TestCase):
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

    def test_agent_flow(self):
        # Register
        res = self.client.post("/api/v1/agent/register", json={"ip": "127.0.0.1", "name": "agent007", "password": "secret"})
        self.assertEqual(res.status_code, 200)
        aid = res.json()["agent_id"]

        # List
        res = self.client.get("/api/v1/agent/list")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()["agents"]), 1)

        # Info & Health
        res = self.client.get("/api/v1/agent/infobyid", params={"agentid": aid})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["name"], "agent007")

        res = self.client.get("/api/v1/healt/infobyid", params={"agentid": aid})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "active")

        # Delete
        res = self.client.delete("/api/v1/agent/delbyid", params={"agentid": aid})
        self.assertEqual(res.status_code, 200)

if __name__ == "__main__":
    unittest.main()
