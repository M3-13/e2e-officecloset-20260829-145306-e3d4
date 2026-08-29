import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import images
from app.auth import get_current_user
from app.db import Base, get_db
from app.main import app
from app.models import Category, User


@pytest.fixture()
def engine():
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)
    eng.dispose()


@pytest.fixture()
def session_factory(engine):
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


@pytest.fixture()
def client(session_factory, tmp_path, monkeypatch):
    monkeypatch.setattr(images, "UPLOAD_DIR", tmp_path / "uploads")

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def create_user(session_factory, email: str) -> User:
    s = session_factory()
    user = User(email=email, password_hash="x")
    s.add(user)
    s.commit()
    s.close()
    return user


def create_category(session_factory, owner_id: int, name: str) -> Category:
    s = session_factory()
    cat = Category(name=name, owner_id=owner_id)
    s.add(cat)
    s.commit()
    s.close()
    return cat


def login_as(user: User) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


def test_upload_image_returns_filename(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    login_as(owner)

    resp = client.post(
        "/api/images",
        files={"file": ("photo.jpg", b"image-bytes", "image/jpeg")},
    )
    assert resp.status_code == 201
    filename = resp.json()["filename"]
    assert filename.endswith(".jpg")
    assert (images.UPLOAD_DIR / filename).exists()


def test_upload_too_large_returns_413(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    login_as(owner)

    big = b"a" * (images.MAX_IMAGE_SIZE_BYTES + 1)
    resp = client.post(
        "/api/images",
        files={"file": ("big.jpg", big, "image/jpeg")},
    )
    assert resp.status_code == 413

    files_on_disk = list(images.UPLOAD_DIR.glob("*")) if images.UPLOAD_DIR.exists() else []
    assert files_on_disk == []


def test_get_image_serves_owned_item(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    cat = create_category(session_factory, owner.id, "Shirts")
    login_as(owner)

    upload = client.post(
        "/api/images",
        files={"file": ("photo.jpg", b"image-bytes", "image/jpeg")},
    )
    filename = upload.json()["filename"]

    create_resp = client.post(
        "/api/items",
        json={"name": "Hemd", "category_id": cat.id, "image_filename": filename},
    )
    assert create_resp.status_code == 201
    assert create_resp.json()["image_url"] == f"/api/images/{filename}"

    get_resp = client.get(f"/api/images/{filename}")
    assert get_resp.status_code == 200
    assert get_resp.content == b"image-bytes"


def test_get_image_returns_404_when_not_referenced(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    login_as(owner)

    upload = client.post(
        "/api/images",
        files={"file": ("photo.jpg", b"image-bytes", "image/jpeg")},
    )
    filename = upload.json()["filename"]

    get_resp = client.get(f"/api/images/{filename}")
    assert get_resp.status_code == 404


def test_get_image_returns_404_for_other_user(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    other = create_user(session_factory, "other@example.com")
    cat = create_category(session_factory, owner.id, "Shirts")
    login_as(owner)

    upload = client.post(
        "/api/images",
        files={"file": ("photo.jpg", b"image-bytes", "image/jpeg")},
    )
    filename = upload.json()["filename"]
    client.post(
        "/api/items",
        json={"name": "Hemd", "category_id": cat.id, "image_filename": filename},
    )

    login_as(other)
    get_resp = client.get(f"/api/images/{filename}")
    assert get_resp.status_code == 404


def test_get_image_returns_404_when_referencing_foreign_upload(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    other = create_user(session_factory, "other@example.com")
    login_as(owner)

    upload = client.post(
        "/api/images",
        files={"file": ("photo.jpg", b"image-bytes", "image/jpeg")},
    )
    filename = upload.json()["filename"]

    other_cat = create_category(session_factory, other.id, "Hosen")
    login_as(other)
    create_resp = client.post(
        "/api/items",
        json={"name": "Hemd", "category_id": other_cat.id, "image_filename": filename},
    )
    assert create_resp.status_code == 201

    get_resp = client.get(f"/api/images/{filename}")
    assert get_resp.status_code == 404


def test_get_image_unknown_filename_returns_404(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    login_as(owner)

    resp = client.get("/api/images/nonexistent.jpg")
    assert resp.status_code == 404


def test_delete_image_file_removes_file(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    login_as(owner)

    images.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    path = images.UPLOAD_DIR / "todelete.jpg"
    path.write_bytes(b"x")
    assert path.exists()

    images.delete_image_file("todelete.jpg")
    assert not path.exists()
