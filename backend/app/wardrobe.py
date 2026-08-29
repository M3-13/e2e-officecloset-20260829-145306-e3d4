from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.images import delete_image_file
from app.models import Category, Item, User
from app.schemas import ItemCreate, ItemOut, ItemUpdate

router = APIRouter(prefix="/api/items", tags=["items"])


def item_to_out(item: Item) -> ItemOut:
    return ItemOut(
        id=item.id,
        name=item.name,
        category_id=item.category_id,
        description=item.description,
        image_url=f"/api/images/{item.image_filename}" if item.image_filename else None,
    )


@router.get("", response_model=list[ItemOut])
def list_items(
    category_id: int | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ItemOut]:
    query = db.query(Item).filter(Item.owner_id == user.id)
    if category_id is not None:
        query = query.filter(Item.category_id == category_id)
    if q:
        query = query.filter(Item.name.ilike(f"%{q}%"))
    return [item_to_out(item) for item in query.order_by(Item.id).all()]


@router.post("", status_code=201, response_model=ItemOut)
def create_item(
    body: ItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ItemOut:
    category = (
        db.query(Category)
        .filter(Category.id == body.category_id, Category.owner_id == user.id)
        .first()
    )
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    item = Item(
        name=body.name,
        description=body.description,
        image_filename=body.image_filename,
        category_id=body.category_id,
        owner_id=user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item_to_out(item)


@router.get("/{id}", response_model=ItemOut)
def get_item(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ItemOut:
    item = db.query(Item).filter(Item.id == id, Item.owner_id == user.id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item_to_out(item)


@router.patch("/{id}", response_model=ItemOut)
def update_item(
    id: int,
    body: ItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ItemOut:
    item = db.query(Item).filter(Item.id == id, Item.owner_id == user.id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    data = body.model_dump(exclude_unset=True, exclude_none=True)
    if "category_id" in data:
        category = (
            db.query(Category)
            .filter(Category.id == data["category_id"], Category.owner_id == user.id)
            .first()
        )
        if category is None:
            raise HTTPException(status_code=404, detail="Category not found")

    for field, value in data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item_to_out(item)


@router.delete("/{id}", status_code=204)
def delete_item(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    item = db.query(Item).filter(Item.id == id, Item.owner_id == user.id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    image_filename = item.image_filename
    db.delete(item)
    db.commit()
    if image_filename:
        delete_image_file(image_filename)
