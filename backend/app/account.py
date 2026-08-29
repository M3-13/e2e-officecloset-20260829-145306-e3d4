from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db import get_db

router = APIRouter(prefix="/api/account", tags=["account"])


@router.delete("", status_code=204)
def delete_account(request: Request, db: Session = Depends(get_db)) -> None:
    raise HTTPException(status_code=501, detail="account #3 implements this")
