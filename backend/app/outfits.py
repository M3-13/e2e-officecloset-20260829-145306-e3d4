from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import OutfitCreate, OutfitOut

router = APIRouter(prefix="/api/outfits", tags=["outfits"])


@router.get("", response_model=list[OutfitOut])
def list_outfits(db: Session = Depends(get_db)) -> list[OutfitOut]:
    raise HTTPException(status_code=501, detail="outfits #11 implements this")


@router.post("", status_code=201, response_model=OutfitOut)
def create_outfit(body: OutfitCreate, db: Session = Depends(get_db)) -> OutfitOut:
    raise HTTPException(status_code=501, detail="outfits #11 implements this")


@router.delete("/{id}", status_code=204)
def delete_outfit(id: int, db: Session = Depends(get_db)) -> None:
    raise HTTPException(status_code=501, detail="outfits #11 implements this")
