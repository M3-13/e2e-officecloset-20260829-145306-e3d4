import pathlib
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import Depends, HTTPException, Request
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app import account as account_module
from app import models
from app.auth import get_current_user
from app.db import Base, get_db
from app.main import app


@pytest.fixture()
def db_factory(tmp_path: pathlib.Path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'account_test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    yield factory
    engine.dispose()


@pytest.fixture()
def client(db_factory):
    def override_get_db():
        db = db_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def override_current_user(email: str):
    def _override(request: Request, db: Session = Depends(get_db)) -> models.User:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return user

    return _override


def seed_user(db_factory, email: str, image_names: list[str | None]) -> int:
    db = db_factory()
    user = models.User(email=email, password_hash="not-a-real-hash")
    db.add(user)
    db.flush()

    db.add(
        models.Session(
            user_id=user.id,
            token_hash=f"token-{email}",
            expires_at=datetime.now(UTC).replace(tzinfo=None) + timedelta(days=1),
        )
    )

    category = models.Category(name="Shirts", owner_id=user.id)
    db.add(category)
    db.flush()

    items = []
    for i, image_name in enumerate(image_names):
        item = models.Item(
            name=f"Item {i}",
            category_id=category.id,
            owner_id=user.id,
            image_filename=image_name,
        )
        db.add(item)
        items.append(item)
    db.flush()

    outfit = models.Outfit(name="Fancy", owner_id=user.id)
    outfit.items.extend(items)
    db.add(outfit)

    db.commit()
    user_id = user.id
    db.close()
    return user_id


def test_delete_account_removes_all_related_rows(client, db_factory, monkeypatch):
    email = "alice@example.com"
    seed_user(db_factory, email, ["a.png", None])
    app.dependency_overrides[get_current_user] = override_current_user(email)

    removed: list[str] = []
    monkeypatch.setattr(account_module, "delete_image_file", removed.append)

    response = client.delete("/api/account")
    assert response.status_code == 204

    db = db_factory()
    try:
        assert db.query(models.User).count() == 0
        assert db.query(models.Session).count() == 0
        assert db.query(models.Category).count() == 0
        assert db.query(models.Item).count() == 0
        assert db.query(models.Outfit).count() == 0
    finally:
        db.close()

    assert removed == ["a.png"]


def test_delete_account_removes_image_files(client, db_factory, monkeypatch, tmp_path):
    email = "bob@example.com"
    seed_user(db_factory, email, ["a.png", "b.png", None])
    app.dependency_overrides[get_current_user] = override_current_user(email)

    image_dir = tmp_path / "images"
    image_dir.mkdir()
    (image_dir / "a.png").write_bytes(b"aaa")
    (image_dir / "b.png").write_bytes(b"bbb")

    removed: list[str] = []

    def fake_delete(filename: str) -> None:
        removed.append(filename)
        (image_dir / filename).unlink(missing_ok=True)

    monkeypatch.setattr(account_module, "delete_image_file", fake_delete)

    response = client.delete("/api/account")
    assert response.status_code == 204

    assert removed == ["a.png", "b.png"]
    assert not (image_dir / "a.png").exists()
    assert not (image_dir / "b.png").exists()


def test_delete_account_leaves_other_users_intact(client, db_factory, monkeypatch):
    seed_user(db_factory, "alice@example.com", ["a.png"])
    seed_user(db_factory, "bob@example.com", ["b.png"])
    app.dependency_overrides[get_current_user] = override_current_user("alice@example.com")

    removed: list[str] = []
    monkeypatch.setattr(account_module, "delete_image_file", removed.append)

    response = client.delete("/api/account")
    assert response.status_code == 204

    db = db_factory()
    try:
        users = db.query(models.User).all()
        assert [u.email for u in users] == ["bob@example.com"]
        assert db.query(models.Session).count() == 1
        assert db.query(models.Category).count() == 1
        assert db.query(models.Item).count() == 1
        assert db.query(models.Outfit).count() == 1
        bob_item = db.query(models.Item).first()
        assert bob_item.image_filename == "b.png"
    finally:
        db.close()

    assert removed == ["a.png"]
