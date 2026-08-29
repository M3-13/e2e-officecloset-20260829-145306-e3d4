from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.images import delete_image_file
from app.models import User

router = APIRouter(prefix="/api/account", tags=["account"])


@router.delete("", status_code=204)
def delete_account(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    image_filenames = [item.image_filename for item in user.items if item.image_filename]

    db.delete(user)
    db.commit()

    for filename in image_filenames:
        delete_image_file(filename)
