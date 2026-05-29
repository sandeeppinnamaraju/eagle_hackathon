from __future__ import annotations

from typing import Optional, Tuple

import bcrypt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from eagle_hackathon.apps.backend.src.db.connection import get_db_connection


router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
	username: str
	password: str


def _normalize_password_hash(password_hash: object) -> bytes:
	if isinstance(password_hash, str):
		return password_hash.encode("utf-8")
	if isinstance(password_hash, (bytes, bytearray)):
		return bytes(password_hash)
	if isinstance(password_hash, memoryview):
		return password_hash.tobytes()
	raise TypeError("Unsupported password hash type")


def _fetch_user(username: str) -> Optional[Tuple[str, str, str]]:
	try:
		with get_db_connection() as conn:
			with conn.cursor() as cursor:
				cursor.execute(
					"""
					SELECT username, password, role
					FROM public.login_details
					WHERE username = %s
					LIMIT 1
					""",
					[username],
				)
				row = cursor.fetchone()
				if not row:
					return None
				return row[0], row[1], row[2]
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(status_code=500, detail="Database error") from exc


@router.post("/auth/login")
def login(payload: LoginRequest):
	record = _fetch_user(payload.username)
	if not record:
		raise HTTPException(status_code=401, detail="Invalid username or password")

	username, password_hash, role = record
	try:
		hash_bytes = _normalize_password_hash(password_hash)
		is_valid = bcrypt.checkpw(
			payload.password.encode("utf-8"),
			hash_bytes,
		)
	except (ValueError, TypeError):
		is_valid = False

	if not is_valid:
		raise HTTPException(status_code=401, detail="Invalid username or password")

	return {
		"success": True,
		"message": "Authentication successful",
		"username": username,
		"role": role,
	}
