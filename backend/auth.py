from __future__ import annotations

import datetime as dt
import os
import sqlite3
from pathlib import Path
from typing import Any, Callable

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=False)

AUTH_DB_PATH = BASE_DIR / "auth.db"
JWT_SECRET = os.getenv("JWT_SECRET", "devsecret")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", "24"))
TEACHER_INVITE_CODE = os.getenv("TEACHER_INVITE_CODE", "")


http_bearer = HTTPBearer(auto_error=False)


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(AUTH_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_auth_db() -> None:
    AUTH_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = _get_conn()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              role TEXT NOT NULL CHECK(role IN ('student','teacher')),
              created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def get_user_by_username(username: str) -> dict[str, Any] | None:
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT id, username, password_hash, role, created_at FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_user_by_id(user_id: int) -> dict[str, Any] | None:
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT id, username, password_hash, role, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def create_user(
    *,
    username: str,
    password: str,
    role: str,
    invite_code: str | None = None,
) -> dict[str, Any]:
    clean_username = username.strip().lower()
    if not clean_username:
        raise ValueError("Username is required")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters")
    if role not in {"student", "teacher"}:
        raise ValueError("Role must be 'student' or 'teacher'")
    if role == "teacher" and TEACHER_INVITE_CODE and invite_code != TEACHER_INVITE_CODE:
        raise PermissionError("Teacher invite code is invalid")

    conn = _get_conn()
    try:
        password_hash = hash_password(password)
        cur = conn.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (clean_username, password_hash, role),
        )
        conn.commit()
        user_id = int(cur.lastrowid)
        created = get_user_by_id(user_id)
        if not created:
            raise RuntimeError("User was created but could not be loaded")
        return created
    except sqlite3.IntegrityError as exc:
        raise ValueError("Username already exists") from exc
    finally:
        conn.close()


def authenticate_user(username: str, password: str) -> dict[str, Any] | None:
    user = get_user_by_username(username.strip().lower())
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user


def create_access_token(data: dict[str, Any], expires_hours: int = TOKEN_EXPIRE_HOURS) -> str:
    to_encode = data.copy()
    expire_at = dt.datetime.now(tz=dt.timezone.utc) + dt.timedelta(hours=expires_hours)
    to_encode["exp"] = expire_at
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def _public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "created_at": user.get("created_at"),
    }


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
) -> dict[str, Any]:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    try:
        user_id = int(sub)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject") from exc

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return _public_user(user)


def require_role(role: str) -> Callable[[dict[str, Any]], dict[str, Any]]:
    def checker(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        if user["role"] != role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return checker


def bootstrap_teacher_account() -> dict[str, Any] | None:
    teacher_user = os.getenv("TEACHER_USER", "").strip().lower()
    teacher_pass = os.getenv("TEACHER_PASS", "")
    if not teacher_user or not teacher_pass:
        return None

    existing = get_user_by_username(teacher_user)
    if existing:
        return _public_user(existing)

    created = create_user(
        username=teacher_user,
        password=teacher_pass,
        role="teacher",
        invite_code=TEACHER_INVITE_CODE if TEACHER_INVITE_CODE else None,
    )
    return _public_user(created)
