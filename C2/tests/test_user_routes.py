import unittest
import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.db.database import init_db
from server.routes.server import app

TEST_DB = "test_user_api.db"

class TestUserRoutesAPI(unittest.TestCase):
    def setUp(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)
        init_db(TEST_DB)
        self.client = TestClient(app)

    def tearDown(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)

    def test_user_flow(self):
        # Login
        res = self.client.post("/api/v1/login", json={"username": "admin", "password": "admin"}, params={"db_path": TEST_DB})
        self.assertEqual(res.status_code, 200)
        token = res.json()["api_key"]

        # Create user as moderator
        headers = {"Authorization": f"Bearer {token}"}
        res = self.client.post(
            "/api/v1/user/create",
            json={"username": "newuser", "password": "password123", "privilege": "USER"},
            headers=headers,
            params={"db_path": TEST_DB}
        )
        self.assertEqual(res.status_code, 200)

        # List users
        res = self.client.get("/api/v1/user", params={"db_path": TEST_DB})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()["users"]), 2)

        # Get user info
        res = self.client.get("/api/v1/user/userinfobyid", params={"userid": 2, "db_path": TEST_DB})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["username"], "newuser")

        # Delete user
        res = self.client.delete("/api/v1/user/delate", params={"userid": 2, "db_path": TEST_DB}, headers=headers)
        self.assertEqual(res.status_code, 200)

if __name__ == "__main__":
    unittest.main()
