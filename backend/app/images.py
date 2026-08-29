import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from starlette.types import ASGIApp, Receive, Scope, Send

from app.auth import get_current_user
from app.db import get_db
from app.models import Item, User

router = APIRouter(prefix="/api/images", tags=["images"])

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

UPLOAD_DIR = Path(
    os.environ.get("UPLOAD_DIR", str(Path(__file__).resolve().parent.parent / "uploads"))
)

_ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}


def _extension_for(filename: str | None) -> str:
    if not filename:
        return ""
    suffix = Path(filename).suffix.lower()
    return suffix if suffix in _ALLOWED_EXTENSIONS else ""


def _owner_id_from_filename(filename: str) -> int | None:
    if "_" not in filename:
        return None
    prefix = filename.split("_", 1)[0]
    if not prefix.isdigit():
        return None
    return int(prefix)


def delete_image_file(filename: str) -> None:
    if not filename or Path(filename).name != filename:
        return
    (UPLOAD_DIR / filename).unlink(missing_ok=True)


def _content_length(scope: Scope) -> int | None:
    for name, value in scope.get("headers", []):
        if name.lower() == b"content-length":
            try:
                return int(value)
            except ValueError:
                return None
    return None


class ImageUploadSizeLimitMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if (
            scope["type"] == "http"
            and scope.get("method") == "POST"
            and scope.get("path") == "/api/images"
        ):
            content_length = _content_length(scope)
            if content_length is not None and content_length > MAX_IMAGE_SIZE_BYTES:
                response = JSONResponse(status_code=413, content={"detail": "File too large"})
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)


@router.post("", status_code=201)
def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
) -> dict:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{user.id}_{uuid.uuid4().hex}{_extension_for(file.filename)}"
    path = UPLOAD_DIR / filename

    total = 0
    try:
        with path.open("wb") as out:
            while chunk := file.file.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_IMAGE_SIZE_BYTES:
                    raise HTTPException(status_code=413, detail="File too large")
                out.write(chunk)
    except HTTPException:
        path.unlink(missing_ok=True)
        raise
    finally:
        file.file.close()

    return {"filename": filename}


@router.get("/{filename}")
def get_image(
    filename: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> FileResponse:
    if Path(filename).name != filename:
        raise HTTPException(status_code=404, detail="Not Found")

    if _owner_id_from_filename(filename) != user.id:
        raise HTTPException(status_code=404, detail="Not Found")

    item = db.query(Item).filter(Item.owner_id == user.id, Item.image_filename == filename).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Not Found")

    path = UPLOAD_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Not Found")

    return FileResponse(path)
