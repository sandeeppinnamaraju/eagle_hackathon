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
		is_valid = bcrypt.checkpw(
			payload.password.encode("utf-8"),
			password_hash.encode("utf-8"),
		)
	except ValueError:
		is_valid = False

	if not is_valid:
		raise HTTPException(status_code=401, detail="Invalid username or password")

	return {
		"success": True,
		"message": "Authentication successful",
		"username": username,
		"role": role,
	}
