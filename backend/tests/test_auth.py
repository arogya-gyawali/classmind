from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))
import auth  # noqa: E402


class AuthTests(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        auth.AUTH_DB_PATH = Path(self.tmp_dir.name) / "auth.db"
        auth.init_auth_db()

    def tearDown(self):
        self.tmp_dir.cleanup()

    def test_hash_and_verify(self):
        password = "secret123"
        hashed = auth.hash_password(password)
        self.assertTrue(auth.verify_password(password, hashed))
        self.assertFalse(auth.verify_password("wrong", hashed))

    def test_create_and_authenticate_user(self):
        created = auth.create_user(username="alice", password="secret123", role="student")
        self.assertEqual(created["username"], "alice")
        self.assertEqual(created["role"], "student")

        user = auth.authenticate_user("alice", "secret123")
        self.assertIsNotNone(user)
        self.assertEqual(user["username"], "alice")

    def test_jwt_encode_decode(self):
        token = auth.create_access_token({"sub": "1", "role": "teacher", "username": "teach"})
        payload = auth.decode_access_token(token)
        self.assertEqual(payload["sub"], "1")
        self.assertEqual(payload["role"], "teacher")


if __name__ == "__main__":
    unittest.main()
