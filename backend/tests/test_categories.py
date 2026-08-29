import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.categories as categories_module
from app import models
from app.db import get_db
from app.main import app
from app.models import User


@pytest.fixture
def env():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    models.Base.metadata.create_all(bind=engine)
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    session = testing_session_local()
    user_a = User(email="a@example.com", password_hash="x")
    user_b = User(email="b@example.com", password_hash="x")
    session.add_all([user_a, user_b])
    session.commit()
    session.refresh(user_a)
    session.refresh(user_b)
    session.close()

    state = {"current_user_id": user_a.id}

    def fake_get_current_user(request, db):
        return db.query(User).filter(User.id == state["current_user_id"]).one()

    original = categories_module.get_current_user
    categories_module.get_current_user = fake_get_current_user

    with TestClient(app) as client:
        yield {
            "client": client,
            "user_a_id": user_a.id,
            "user_b_id": user_b.id,
            "state": state,
            "session_local": testing_session_local,
        }

    categories_module.get_current_user = original
    app.dependency_overrides.clear()
    engine.dispose()


def test_create_category(env):
    client = env["client"]
    resp = client.post("/api/categories", json={"name": "Shirts"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Shirts"
    assert body["id"] >= 1


def test_create_category_scopes_owner_id(env):
    client = env["client"]
    resp = client.post("/api/categories", json={"name": "Shirts"})
    category_id = resp.json()["id"]

    session = env["session_local"]()
    category = session.query(models.Category).filter(models.Category.id == category_id).one()
    session.close()
    assert category.owner_id == env["user_a_id"]


def test_list_categories_shows_only_own(env):
    client = env["client"]
    client.post("/api/categories", json={"name": "Shirts"})

    env["state"]["current_user_id"] = env["user_b_id"]
    client.post("/api/categories", json={"name": "Hosen"})

    env["state"]["current_user_id"] = env["user_a_id"]
    resp = client.get("/api/categories")
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()]
    assert names == ["Shirts"]


def test_list_categories_empty_for_new_user(env):
    client = env["client"]
    env["state"]["current_user_id"] = env["user_b_id"]
    resp = client.get("/api/categories")
    assert resp.status_code == 200
    assert resp.json() == []


def test_delete_own_category(env):
    client = env["client"]
    resp = client.post("/api/categories", json={"name": "Shirts"})
    category_id = resp.json()["id"]

    resp = client.delete(f"/api/categories/{category_id}")
    assert resp.status_code == 204

    resp = client.get("/api/categories")
    assert resp.json() == []


def test_delete_foreign_category_returns_404(env):
    client = env["client"]
    env["state"]["current_user_id"] = env["user_b_id"]
    resp = client.post("/api/categories", json={"name": "Hosen"})
    foreign_id = resp.json()["id"]

    env["state"]["current_user_id"] = env["user_a_id"]
    resp = client.delete(f"/api/categories/{foreign_id}")
    assert resp.status_code == 404

    env["state"]["current_user_id"] = env["user_b_id"]
    resp = client.get("/api/categories")
    names = [c["name"] for c in resp.json()]
    assert names == ["Hosen"]


def test_delete_nonexistent_category_returns_404(env):
    client = env["client"]
    resp = client.delete("/api/categories/9999")
    assert resp.status_code == 404
