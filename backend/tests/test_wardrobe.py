import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import images
from app.auth import get_current_user
from app.db import Base, get_db
from app.main import app
from app.models import Category, Item, User


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


def create_item(
    session_factory,
    owner_id: int,
    category_id: int,
    name: str,
    image_filename: str | None = None,
) -> Item:
    s = session_factory()
    item = Item(
        name=name,
        category_id=category_id,
        owner_id=owner_id,
        image_filename=image_filename,
    )
    s.add(item)
    s.commit()
    s.close()
    return item


def login_as(user: User) -> None:
    app.dependency_overrides[get_current_user] = lambda: user


def test_create_item(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    cat = create_category(session_factory, owner.id, "Shirts")
    login_as(owner)

    resp = client.post("/api/items", json={"name": "Hemd", "category_id": cat.id})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Hemd"
    assert data["category_id"] == cat.id
    assert data["description"] is None
    assert data["image_url"] is None


def test_list_items_returns_only_own(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    other = create_user(session_factory, "other@example.com")
    cat = create_category(session_factory, owner.id, "Shirts")
    other_cat = create_category(session_factory, other.id, "Hosen")
    create_item(session_factory, owner.id, cat.id, "Hemd")
    create_item(session_factory, owner.id, cat.id, "Jacke")
    create_item(session_factory, other.id, other_cat.id, "Jeans")
    login_as(owner)

    resp = client.get("/api/items")
    assert resp.status_code == 200
    names = {item["name"] for item in resp.json()}
    assert names == {"Hemd", "Jacke"}


def test_list_items_filter_by_category(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    cat1 = create_category(session_factory, owner.id, "Shirts")
    cat2 = create_category(session_factory, owner.id, "Hosen")
    create_item(session_factory, owner.id, cat1.id, "Hemd")
    create_item(session_factory, owner.id, cat2.id, "Jeans")
    login_as(owner)

    resp = client.get("/api/items", params={"category_id": cat1.id})
    assert resp.status_code == 200
    names = [item["name"] for item in resp.json()]
    assert names == ["Hemd"]


def test_list_items_search_by_name(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    cat = create_category(session_factory, owner.id, "Shirts")
    create_item(session_factory, owner.id, cat.id, "Rotes Hemd")
    create_item(session_factory, owner.id, cat.id, "Blaue Jeans")
    login_as(owner)

    resp = client.get("/api/items", params={"q": "hemd"})
    assert resp.status_code == 200
    names = [item["name"] for item in resp.json()]
    assert names == ["Rotes Hemd"]


def test_get_item(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    cat = create_category(session_factory, owner.id, "Shirts")
    item = create_item(session_factory, owner.id, cat.id, "Hemd")
    login_as(owner)

    resp = client.get(f"/api/items/{item.id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Hemd"


def test_get_item_not_found(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    login_as(owner)

    resp = client.get("/api/items/9999")
    assert resp.status_code == 404


def test_get_foreign_item_returns_404(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    other = create_user(session_factory, "other@example.com")
    other_cat = create_category(session_factory, other.id, "Hosen")
    item = create_item(session_factory, other.id, other_cat.id, "Jeans")
    login_as(owner)

    resp = client.get(f"/api/items/{item.id}")
    assert resp.status_code == 404


def test_create_item_with_foreign_category_returns_404(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    other = create_user(session_factory, "other@example.com")
    other_cat = create_category(session_factory, other.id, "Hosen")
    login_as(owner)

    resp = client.post("/api/items", json={"name": "Hemd", "category_id": other_cat.id})
    assert resp.status_code == 404


def test_update_item(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    cat = create_category(session_factory, owner.id, "Shirts")
    item = create_item(session_factory, owner.id, cat.id, "Hemd")
    login_as(owner)

    resp = client.patch(
        f"/api/items/{item.id}",
        json={"name": "Neues Hemd", "description": "Baumwolle"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Neues Hemd"
    assert data["description"] == "Baumwolle"


def test_update_foreign_item_returns_404(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    other = create_user(session_factory, "other@example.com")
    other_cat = create_category(session_factory, other.id, "Hosen")
    item = create_item(session_factory, other.id, other_cat.id, "Jeans")
    login_as(owner)

    resp = client.patch(f"/api/items/{item.id}", json={"name": "X"})
    assert resp.status_code == 404


def test_delete_item(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    cat = create_category(session_factory, owner.id, "Shirts")
    item = create_item(session_factory, owner.id, cat.id, "Hemd")
    login_as(owner)

    resp = client.delete(f"/api/items/{item.id}")
    assert resp.status_code == 204

    resp = client.get(f"/api/items/{item.id}")
    assert resp.status_code == 404


def test_delete_foreign_item_returns_404(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    other = create_user(session_factory, "other@example.com")
    other_cat = create_category(session_factory, other.id, "Hosen")
    item = create_item(session_factory, other.id, other_cat.id, "Jeans")
    login_as(owner)

    resp = client.delete(f"/api/items/{item.id}")
    assert resp.status_code == 404


def test_delete_item_removes_image_file(client, session_factory):
    owner = create_user(session_factory, "owner@example.com")
    cat = create_category(session_factory, owner.id, "Shirts")
    login_as(owner)

    images.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    image_path = images.UPLOAD_DIR / "photo.jpg"
    image_path.write_bytes(b"image-bytes")

    resp = client.post(
        "/api/items",
        json={"name": "Hemd", "category_id": cat.id, "image_filename": "photo.jpg"},
    )
    assert resp.status_code == 201
    item_id = resp.json()["id"]
    assert image_path.exists()

    resp = client.delete(f"/api/items/{item_id}")
    assert resp.status_code == 204
    assert not image_path.exists()
