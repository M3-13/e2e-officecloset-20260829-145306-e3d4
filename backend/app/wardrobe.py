from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import ItemCreate, ItemOut, ItemUpdate

router = APIRouter(prefix="/api/items", tags=["items"])


@router.get("", response_model=list[ItemOut])
def list_items(
    category_id: int | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
) -> list[ItemOut]:
    raise HTTPException(status_code=501, detail="wardrobe #2 implements this")


@router.post("", status_code=201, response_model=ItemOut)
def create_item(body: ItemCreate, db: Session = Depends(get_db)) -> ItemOut:
    raise HTTPException(status_code=501, detail="wardrobe #2 implements this")


@router.get("/{id}", response_model=ItemOut)
def get_item(id: int, db: Session = Depends(get_db)) -> ItemOut:
    raise HTTPException(status_code=501, detail="wardrobe #2 implements this")


@router.patch("/{id}", response_model=ItemOut)
def update_item(id: int, body: ItemUpdate, db: Session = Depends(get_db)) -> ItemOut:
    raise HTTPException(status_code=501, detail="wardrobe #2 implements this")


@router.delete("/{id}", status_code=204)
def delete_item(id: int, db: Session = Depends(get_db)) -> None:
    raise HTTPException(status_code=501, detail="wardrobe #2 implements this")
