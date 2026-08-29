import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import get_current_user
from app.db import Base, get_db
from app.main import app
from app.models import Category, Item, Outfit, User


@pytest.fixture()
def db() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = testing_session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _clear_overrides() -> None:
    yield
    app.dependency_overrides.clear()


def _make_client(db: Session, user: User) -> TestClient:
    def override_get_db():
        yield db

    def override_get_current_user() -> User:
        return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    return TestClient(app)


def _create_user(db: Session, email: str) -> User:
    user = User(email=email, password_hash="x")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_category(db: Session, owner: User, name: str) -> Category:
    category = Category(name=name, owner_id=owner.id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def _create_item(
    db: Session,
    owner: User,
    category: Category,
    name: str,
    image_filename: str | None = None,
) -> Item:
    item = Item(
        name=name,
        category_id=category.id,
        owner_id=owner.id,
        image_filename=image_filename,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def test_create_outfit_saves_named_outfit_with_embedded_items(db: Session) -> None:
    user = _create_user(db, "owner@example.com")
    category = _create_category(db, user, "Shirts")
    hemd = _create_item(db, user, category, "Hemd", image_filename="hemd.png")
    bluse = _create_item(db, user, category, "Bluse")

    client = _make_client(db, user)
    response = client.post("/api/outfits", json={"name": "Büro", "item_ids": [hemd.id, bluse.id]})

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Büro"
    assert set(body["item_ids"]) == {hemd.id, bluse.id}
    assert {item["id"] for item in body["items"]} == {hemd.id, bluse.id}

    hemd_out = next(item for item in body["items"] if item["id"] == hemd.id)
    assert hemd_out["name"] == "Hemd"
    assert hemd_out["category_id"] == category.id
    assert hemd_out["image_url"] == "/api/images/hemd.png"

    bluse_out = next(item for item in body["items"] if item["id"] == bluse.id)
    assert bluse_out["image_url"] is None


def test_list_outfits_returns_only_own_outfits(db: Session) -> None:
    owner = _create_user(db, "owner@example.com")
    other = _create_user(db, "other@example.com")

    owner_category = _create_category(db, owner, "Shirts")
    owner_item = _create_item(db, owner, owner_category, "Hemd")

    other_category = _create_category(db, other, "Jeans")
    other_item = _create_item(db, other, other_category, "Jeanshose")

    foreign_outfit = Outfit(name="Fremdes", owner_id=other.id, items=[other_item])
    db.add(foreign_outfit)
    db.commit()

    owner_client = _make_client(db, owner)
    owner_client.post("/api/outfits", json={"name": "Eigenes", "item_ids": [owner_item.id]})

    listed = owner_client.get("/api/outfits")
    assert listed.status_code == 200
    names = [outfit["name"] for outfit in listed.json()]
    assert names == ["Eigenes"]


def test_create_outfit_rejects_foreign_items(db: Session) -> None:
    owner = _create_user(db, "owner@example.com")
    other = _create_user(db, "other@example.com")

    owner_category = _create_category(db, owner, "Shirts")
    own_item = _create_item(db, owner, owner_category, "Hemd")

    other_category = _create_category(db, other, "Jeans")
    foreign_item = _create_item(db, other, other_category, "Jeanshose")

    client = _make_client(db, owner)
    response = client.post(
        "/api/outfits", json={"name": "Mix", "item_ids": [own_item.id, foreign_item.id]}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"


def test_create_outfit_rejects_missing_item(db: Session) -> None:
    owner = _create_user(db, "owner@example.com")

    client = _make_client(db, owner)
    response = client.post("/api/outfits", json={"name": "Leer", "item_ids": [9999]})

    assert response.status_code == 404


def test_delete_outfit_removes_it(db: Session) -> None:
    owner = _create_user(db, "owner@example.com")
    category = _create_category(db, owner, "Shirts")
    item = _create_item(db, owner, category, "Hemd")

    client = _make_client(db, owner)
    created = client.post("/api/outfits", json={"name": "Büro", "item_ids": [item.id]}).json()

    deleted = client.delete(f"/api/outfits/{created['id']}")
    assert deleted.status_code == 204

    listed = client.get("/api/outfits")
    assert listed.json() == []


def test_delete_outfit_foreign_returns_404(db: Session) -> None:
    owner = _create_user(db, "owner@example.com")
    other = _create_user(db, "other@example.com")

    category = _create_category(db, other, "Jeans")
    item = _create_item(db, other, category, "Jeanshose")

    other_client = _make_client(db, other)
    created = other_client.post(
        "/api/outfits", json={"name": "Fremdes", "item_ids": [item.id]}
    ).json()

    client = _make_client(db, owner)
    response = client.delete(f"/api/outfits/{created['id']}")

    assert response.status_code == 404
