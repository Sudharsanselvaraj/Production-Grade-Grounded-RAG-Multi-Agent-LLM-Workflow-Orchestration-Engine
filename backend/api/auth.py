from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel

from ..auth.session import clear_session_cookie, get_current_user, login_user, set_session_cookie

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def api_login(payload: LoginRequest, response: Response):
    session = login_user(payload.username, payload.password)
    set_session_cookie(response, session["access_token"])
    return {"user": session["user"]}


@router.post("/logout")
def api_logout(response: Response):
    clear_session_cookie(response)
    return {"ok": True}


@router.get("/me")
def api_me(current_user: dict = Depends(get_current_user)):
    return {
        "user": {
            "username": current_user.get("sub"),
            "role": current_user.get("role"),
            "full_name": current_user.get("full_name"),
        }
    }
