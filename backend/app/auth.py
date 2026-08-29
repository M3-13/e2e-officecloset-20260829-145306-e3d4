import hashlib
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Session as SessionModel
from app.models import User
from app.schemas import UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

SESSION_COOKIE_NAME = "session"
SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

RATE_LIMIT_MAX_ATTEMPTS = 5
RATE_LIMIT_WINDOW_SECONDS = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_rate_limit_lock = threading.Lock()
_rate_limit_attempts: dict[tuple[str, str], deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    if request.client is not None and request.client.host:
        return request.client.host
    return "unknown"


def _enforce_rate_limit(request: Request, action: str) -> None:
    ip = _client_ip(request)
    key = (ip, action)
    now = time.monotonic()
    with _rate_limit_lock:
        attempts = _rate_limit_attempts[key]
        while attempts and attempts[0] <= now - RATE_LIMIT_WINDOW_SECONDS:
            attempts.popleft()
        if len(attempts) >= RATE_LIMIT_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=429,
                detail="Zu viele Versuche. Bitte versuche es in einer Minute erneut.",
            )
        attempts.append(now)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _create_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    session = SessionModel(
        user_id=user.id,
        token_hash=_hash_token(token),
        expires_at=datetime.utcnow() + timedelta(seconds=SESSION_MAX_AGE_SECONDS),
    )
    db.add(session)
    db.commit()
    return token


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
        path="/",
    )


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Nicht angemeldet.")
    token_hash = _hash_token(token)
    session = db.query(SessionModel).filter(SessionModel.token_hash == token_hash).first()
    if session is None or session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Sitzung ungültig oder abgelaufen.")
    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Benutzer nicht gefunden.")
    return user


@router.post("/register", status_code=201)
def register(
    body: UserCreate, response: Response, request: Request, db: Session = Depends(get_db)
) -> dict:
    _enforce_rate_limit(request, "register")

    email = body.email.strip().lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Diese E-Mail-Adresse ist bereits registriert.")

    user = User(email=email, password_hash=pwd_context.hash(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = _create_session(db, user)
    _set_session_cookie(response, token)
    return {"user": UserOut.model_validate(user)}


@router.post("/login")
def login(
    body: UserLogin, response: Response, request: Request, db: Session = Depends(get_db)
) -> dict:
    _enforce_rate_limit(request, "login")

    email = body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort ist falsch.")

    token = _create_session(db, user)
    _set_session_cookie(response, token)
    return {"user": UserOut.model_validate(user)}


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> None:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        token_hash = _hash_token(token)
        session = db.query(SessionModel).filter(SessionModel.token_hash == token_hash).first()
        if session is not None:
            db.delete(session)
            db.commit()
    response.delete_cookie(SESSION_COOKIE_NAME, path="/", httponly=True, samesite="lax")
    return None


@router.get("/me")
def me(request: Request, db: Session = Depends(get_db)) -> dict:
    user = get_current_user(request, db)
    return {"user": UserOut.model_validate(user)}
