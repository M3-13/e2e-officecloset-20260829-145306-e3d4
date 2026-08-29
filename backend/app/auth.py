from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    raise HTTPException(status_code=501, detail="auth #12 implements this")


@router.post("/register", status_code=201)
def register(body: UserCreate, response: Response, db: Session = Depends(get_db)) -> dict:
    raise HTTPException(status_code=501, detail="auth #12 implements this")


@router.post("/login")
def login(body: UserLogin, response: Response, db: Session = Depends(get_db)) -> dict:
    raise HTTPException(status_code=501, detail="auth #12 implements this")


@router.post("/logout", status_code=204)
def logout(request: Request, db: Session = Depends(get_db)) -> None:
    raise HTTPException(status_code=501, detail="auth #12 implements this")


@router.get("/me")
def me(request: Request, db: Session = Depends(get_db)) -> dict:
    raise HTTPException(status_code=501, detail="auth #12 implements this")
