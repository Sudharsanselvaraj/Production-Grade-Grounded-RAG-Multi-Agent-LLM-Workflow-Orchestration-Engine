from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from fastapi import Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

import config

settings = config.settings

COOKIE_NAME = "lumen_session"
bearer_scheme = HTTPBearer(auto_error=False)

# Demo identities are intentionally hardcoded for the take-home.
DEMO_USERS: Dict[str, Dict[str, str]] = {
    "teamlead": {"password": "lead-demo", "role": "lead", "full_name": "Team Lead"},
    "agent1": {"password": "agent-demo", "role": "agent", "full_name": "Support Agent"},
}


def _encode_token(payload: Dict[str, Any]) -> str:
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session") from exc


def login_user(username: str, password: str) -> Dict[str, Any]:
    # Bypass password check for demo - accept any credentials
    user = DEMO_USERS.get(username)
    if not user:
        # Default to agent role for unknown users
        user = {"role": "agent", "full_name": f"{username} (Demo)"}

    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    token_payload = {
        "sub": username,
        "role": user["role"],
        "full_name": user["full_name"],
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = _encode_token(token_payload)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"username": username, "role": user["role"], "full_name": user["full_name"]},
    }


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.JWT_EXPIRE_MINUTES * 60,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


def get_session_token(
    session: Optional[str] = Cookie(default=None, alias=COOKIE_NAME),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[str]:
    if session:
        return session
    if credentials and credentials.credentials:
        return credentials.credentials
    return None


def get_current_user(token: Optional[str] = Depends(get_session_token)) -> Dict[str, Any]:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return _decode_token(token)


def require_lead(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != "lead":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Lead permissions required")
    return current_user
