import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import auth
from app.db import Base, get_db
from app.main import app


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    auth._rate_limit_attempts.clear()
    yield
    auth._rate_limit_attempts.clear()


def test_register_creates_user_and_sets_session_cookie(client):
    response = client.post(
        "/api/auth/register", json={"email": "anna@example.com", "password": "secret123"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "anna@example.com"
    assert isinstance(body["user"]["id"], int)
    assert response.cookies.get("session") is not None


def test_session_cookie_has_httponly_and_samesite_flags(client):
    response = client.post(
        "/api/auth/register", json={"email": "bella@example.com", "password": "secret123"}
    )
    assert response.status_code == 201
    set_cookie = response.headers["set-cookie"].lower()
    assert "httponly" in set_cookie
    assert "samesite=lax" in set_cookie


def test_register_duplicate_email_returns_409(client):
    payload = {"email": "dup@example.com", "password": "secret123"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_login_returns_user_and_sets_cookie(client):
    client.post("/api/auth/register", json={"email": "carl@example.com", "password": "secret"})
    response = client.post(
        "/api/auth/login", json={"email": "carl@example.com", "password": "secret"}
    )
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "carl@example.com"
    assert response.cookies.get("session") is not None


def test_login_wrong_password_returns_401(client):
    client.post("/api/auth/register", json={"email": "dora@example.com", "password": "correct"})
    response = client.post(
        "/api/auth/login", json={"email": "dora@example.com", "password": "wrong"}
    )
    assert response.status_code == 401
    assert "detail" in response.json()


def test_me_without_session_returns_401(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_with_valid_session_returns_user(client):
    client.post("/api/auth/register", json={"email": "eric@example.com", "password": "secret"})
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "eric@example.com"


def test_logout_deletes_session_and_clears_cookie(client):
    client.post("/api/auth/register", json={"email": "fred@example.com", "password": "secret"})
    assert client.get("/api/auth/me").status_code == 200

    response = client.post("/api/auth/logout")
    assert response.status_code == 204
    assert client.get("/api/auth/me").status_code == 401


def test_register_rate_limited_after_5_attempts(client):
    for index in range(5):
        response = client.post(
            "/api/auth/register",
            json={"email": f"burst{index}@example.com", "password": "secret"},
        )
        assert response.status_code == 201

    response = client.post(
        "/api/auth/register", json={"email": "overflow@example.com", "password": "secret"}
    )
    assert response.status_code == 429


def test_login_rate_limited_after_5_attempts(client):
    client.post("/api/auth/register", json={"email": "loginrl@example.com", "password": "secret"})
    for _ in range(5):
        response = client.post(
            "/api/auth/login", json={"email": "loginrl@example.com", "password": "wrong"}
        )
        assert response.status_code == 401

    response = client.post(
        "/api/auth/login", json={"email": "loginrl@example.com", "password": "wrong"}
    )
    assert response.status_code == 429
