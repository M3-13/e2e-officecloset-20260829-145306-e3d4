from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

router = APIRouter(prefix="/api/images", tags=["images"])


def delete_image_file(filename: str) -> None:
    raise HTTPException(status_code=501, detail="images #2 implements this")


@router.post("", status_code=201)
def upload_image(file: UploadFile = File(...)) -> dict:
    raise HTTPException(status_code=501, detail="images #2 implements this")


@router.get("/{filename}")
def get_image(filename: str) -> Response:
    raise HTTPException(status_code=501, detail="images #2 implements this")
