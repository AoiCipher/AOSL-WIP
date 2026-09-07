import unittest
import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.db.database import init_db
from server.routes.server import app

TEST_DB = "test_task_api.db"

class TestTaskRoutesAPI(unittest.TestCase):
    def setUp(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)
        init_db(TEST_DB)
        self.client = TestClient(app)

    def tearDown(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)

    def test_task_flow(self):
        # Create task
        res = self.client.post("/api/v1/task/new", json={"agent_id": 1, "command": "id"}, params={"db_path": TEST_DB})
        self.assertEqual(res.status_code, 200)
        tid = res.json()["task_id"]

        # List tasks
        res = self.client.get("/api/v1/task/list", params={"db_path": TEST_DB})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()["tasks"]), 1)

        # Task info
        res = self.client.get("/api/v1/task/taskinfobyid", params={"taskid": tid, "db_path": TEST_DB})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["command"], "id")

if __name__ == "__main__":
    unittest.main()
