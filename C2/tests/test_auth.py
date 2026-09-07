import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.db.database import init_db
from server.auth.security import (
    authenticate_credentials,
    get_user_by_api_key,
    invalidate_api_key,
)

TEST_DB = "test_auth.db"

class TestAuthSecurity(unittest.TestCase):
    def setUp(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)
        init_db(TEST_DB)

    def tearDown(self):
        if os.path.exists(TEST_DB):
            os.remove(TEST_DB)

    def test_auth_flow(self):
        res = authenticate_credentials("admin", "wrong", db_path=TEST_DB)
        self.assertIsNone(res)

        res = authenticate_credentials("admin", "admin", db_path=TEST_DB)
        self.assertIsNotNone(res)
        key = res["api_key"]

        user = get_user_by_api_key(key, db_path=TEST_DB)
        self.assertIsNotNone(user)
        self.assertEqual(user["username"], "admin")

        invalidate_api_key(user["id"], db_path=TEST_DB)
        user_after = get_user_by_api_key(key, db_path=TEST_DB)
        self.assertIsNone(user_after)

if __name__ == "__main__":
    unittest.main()
