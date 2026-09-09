import unittest
import os
import sys
from unittest.mock import patch
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.db import database
from server.db.database import init_db
from server.routes.server import app

TEST_DB = "test_task_api.db"

class TestTaskRoutesAPI(unittest.TestCase):
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

    def test_task_flow(self):
        # Create agent first so task has a valid target
        res = self.client.post("/api/v1/agent/register", json={"ip": "127.0.0.1", "name": "agent007"})
        agent_uuid = res.json()["agent_uuid"]

        # Create task
        res = self.client.post("/api/v1/task/new", json={"agent_id": agent_uuid, "command": "id"})
        self.assertEqual(res.status_code, 200)
        tid = res.json()["task_id"]

        # List tasks
        res = self.client.get("/api/v1/task/list")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()["tasks"]), 1)

        # Task info
        res = self.client.get("/api/v1/task/taskinfobyid", params={"taskid": tid})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["command"], "id")

if __name__ == "__main__":
    unittest.main()
