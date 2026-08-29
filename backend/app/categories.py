from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Category, Item
from app.schemas import CategoryCreate, CategoryOut

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(request: Request, db: Session = Depends(get_db)) -> list[CategoryOut]:
    user = get_current_user(request, db)
    categories = db.query(Category).filter(Category.owner_id == user.id).order_by(Category.id).all()
    return [CategoryOut.model_validate(c) for c in categories]


@router.post("", status_code=201, response_model=CategoryOut)
def create_category(
    request: Request, body: CategoryCreate, db: Session = Depends(get_db)
) -> CategoryOut:
    user = get_current_user(request, db)
    category = Category(name=body.name, owner_id=user.id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryOut.model_validate(category)


@router.delete("/{id}", status_code=204)
def delete_category(request: Request, id: int, db: Session = Depends(get_db)) -> None:
    user = get_current_user(request, db)
    category = db.query(Category).filter(Category.id == id, Category.owner_id == user.id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    db.query(Item).filter(Item.category_id == category.id).delete(synchronize_session=False)
    db.delete(category)
    db.commit()
