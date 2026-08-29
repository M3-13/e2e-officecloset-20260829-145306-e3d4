from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import CategoryCreate, CategoryOut

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    raise HTTPException(status_code=501, detail="categories #4 implements this")


@router.post("", status_code=201, response_model=CategoryOut)
def create_category(body: CategoryCreate, db: Session = Depends(get_db)) -> CategoryOut:
    raise HTTPException(status_code=501, detail="categories #4 implements this")


@router.delete("/{id}", status_code=204)
def delete_category(id: int, db: Session = Depends(get_db)) -> None:
    raise HTTPException(status_code=501, detail="categories #4 implements this")
