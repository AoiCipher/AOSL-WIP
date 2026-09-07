"""Unit and integration test suite for AOSL Agent.

Tests agent configuration fallback, HTTP registration, health checks,
task management endpoints, and WebSocket connections.
"""

import importlib
import os
import sys
import tempfile
import unittest
import uuid

# Set up test database path before importing modules
test_db_dir = tempfile.mkdtemp()
TEST_DB_PATH = os.path.join(test_db_dir, f"test_agent_{uuid.uuid4().hex}.db")
os.environ["AGENT_DB_PATH"] = TEST_DB_PATH

# Ensure parent directory (agent root) and src/ are in sys.path
agent_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if agent_root not in sys.path:
    sys.path.insert(0, agent_root)

from fastapi.testclient import TestClient
from main import app
from src.db.db import get_db, init_db

class ConfigSettingsTest(unittest.TestCase):
    """Test suite for agent configuration loading and environment overrides."""

    def tearDown(self) -> None:
        os.environ.pop("AGENT_PORT", None)
        env_path = os.path.join(agent_root, ".env")
        if os.path.exists(env_path):
            os.remove(env_path)
        if "config" in sys.modules:
            import config
            importlib.reload(config)

    def test_default_port_falls_back_to_8000(self) -> None:
        """Verify port falls back to 8000 when AGENT_PORT is not set."""
        os.environ.pop("AGENT_PORT", None)
        env_path = os.path.join(agent_root, ".env")
        if os.path.exists(env_path):
            os.remove(env_path)
        import config
        importlib.reload(config)
        self.assertEqual(config.DEFAULT_PORT, 8000)

    def test_env_port_overrides_default(self) -> None:
        """Verify AGENT_PORT environment variable overrides default port."""
        os.environ["AGENT_PORT"] = "9000"
        import config
        importlib.reload(config)
        self.assertEqual(config.DEFAULT_PORT, 9000)

    def test_dotenv_port_does_not_rewrite_default(self) -> None:
        """Verify .env file override behavior."""
        os.environ.pop("AGENT_PORT", None)
        env_path = os.path.join(agent_root, ".env")
        original = None
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as handle:
                original = handle.read()
        try:
            with open(env_path, "w", encoding="utf-8") as handle:
                handle.write("AGENT_PORT=8190\n")
            import config
            importlib.reload(config)
            self.assertEqual(config.DEFAULT_PORT, 8190)
        finally:
            os.environ.pop("AGENT_PORT", None)
            if original is not None:
                with open(env_path, "w", encoding="utf-8") as handle:
                    handle.write(original)
            elif os.path.exists(env_path):
                os.remove(env_path)


class AgentApiTest(unittest.TestCase):
    """Test suite for Agent REST API endpoints and WebSockets."""

    def setUp(self) -> None:
        self.db_path = os.path.join(test_db_dir, f"test_agent_{uuid.uuid4().hex}.db")
        init_db(self.db_path)
        self.client = TestClient(app)

    def test_register_missing_apikey(self) -> None:
        """Verify registration returns 400 when apikey is missing."""
        res = self.client.post("/agent/v1/register", json={})
        self.assertEqual(res.status_code, 400)

    def test_register_success(self) -> None:
        """Verify successful agent registration."""
        res = self.client.post(
            "/agent/v1/register",
            json={"apikey": "test-key-123", "name": "test-agent-1"},
            params={"db_path": self.db_path}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["message"], "Agent registered")
        self.assertIn("agent_id", data)

    def test_register_duplicate(self) -> None:
        """Verify registering duplicate agent API key yields 409 conflict."""
        self.client.post(
            "/agent/v1/register",
            json={"apikey": "test-key-dup", "name": "agent-dup"},
            params={"db_path": self.db_path}
        )
        res = self.client.post(
            "/agent/v1/register",
            json={"apikey": "test-key-dup", "name": "agent-dup-2"},
            params={"db_path": self.db_path}
        )
        self.assertEqual(res.status_code, 409)

    def test_health_no_key(self) -> None:
        """Verify health check rejects request with no API key header (401)."""
        res = self.client.get("/agent/v1/health", params={"db_path": self.db_path})
        self.assertEqual(res.status_code, 401)

    def test_health_bad_key(self) -> None:
        """Verify health check rejects invalid API key header (401)."""
        res = self.client.get(
            "/agent/v1/health",
            headers={"X-Api-Key": "invalid-key"},
            params={"db_path": self.db_path}
        )
        self.assertEqual(res.status_code, 401)

    def test_health_success(self) -> None:
        """Verify health check succeeds with valid registered API key."""
        self.client.post(
            "/agent/v1/register",
            json={"apikey": "test-health-key", "name": "health-agent"},
            params={"db_path": self.db_path}
        )
        res = self.client.get(
            "/agent/v1/health",
            headers={"X-Api-Key": "test-health-key"},
            params={"db_path": self.db_path}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["agent_name"], "health-agent")
        self.assertIn("cpu_percent", data)
        self.assertIn("memory_percent", data)

    def test_task_creation_and_retrieval(self) -> None:
        """Verify creating, listing, and retrieving tasks."""
        self.client.post(
            "/agent/v1/register",
            json={"apikey": "task-key-1", "name": "task-agent"},
            params={"db_path": self.db_path}
        )
        headers = {"X-Api-Key": "task-key-1"}

        # Create task
        res = self.client.post(
            "/agent/v1/tasks",
            json={"command": "whoami"},
            headers=headers,
            params={"db_path": self.db_path}
        )
        self.assertEqual(res.status_code, 200)
        task_data = res.json()
        self.assertIn("task_id", task_data)
        task_id = task_data["task_id"]

        # List tasks
        res = self.client.get(
            "/agent/v1/tasks",
            headers=headers,
            params={"db_path": self.db_path}
        )
        self.assertEqual(res.status_code, 200)
        tasks = res.json()
        self.assertTrue(any(t["task_id"] == task_id for t in tasks))

        # Get task by ID
        res = self.client.get(
            f"/agent/v1/tasks/{task_id}",
            headers=headers,
            params={"db_path": self.db_path}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["task_id"], task_id)


if __name__ == "__main__":
    unittest.main()
