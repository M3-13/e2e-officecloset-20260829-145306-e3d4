from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Item, Outfit, User
from app.schemas import ItemOut, OutfitCreate, OutfitOut

router = APIRouter(prefix="/api/outfits", tags=["outfits"])


def _to_item_out(item: Item) -> ItemOut:
    return ItemOut(
        id=item.id,
        name=item.name,
        category_id=item.category_id,
        description=item.description,
        image_url=f"/api/images/{item.image_filename}" if item.image_filename else None,
    )


def _to_outfit_out(outfit: Outfit) -> OutfitOut:
    items = [_to_item_out(item) for item in outfit.items]
    return OutfitOut(
        id=outfit.id,
        name=outfit.name,
        item_ids=[item.id for item in outfit.items],
        items=items,
    )


@router.get("", response_model=list[OutfitOut])
def list_outfits(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[OutfitOut]:
    outfits = db.query(Outfit).filter(Outfit.owner_id == user.id).order_by(Outfit.id).all()
    return [_to_outfit_out(outfit) for outfit in outfits]


@router.post("", status_code=201, response_model=OutfitOut)
def create_outfit(
    body: OutfitCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OutfitOut:
    item_ids = list(dict.fromkeys(body.item_ids))

    items: list[Item] = []
    if item_ids:
        items = db.query(Item).filter(Item.id.in_(item_ids), Item.owner_id == user.id).all()
        if len(items) != len(item_ids):
            raise HTTPException(status_code=404, detail="Item not found")

    outfit = Outfit(name=body.name, owner_id=user.id, items=items)
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    return _to_outfit_out(outfit)


@router.delete("/{id}", status_code=204)
def delete_outfit(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    outfit = db.query(Outfit).filter(Outfit.id == id, Outfit.owner_id == user.id).first()
    if outfit is None:
        raise HTTPException(status_code=404, detail="Outfit not found")
    db.delete(outfit)
    db.commit()
