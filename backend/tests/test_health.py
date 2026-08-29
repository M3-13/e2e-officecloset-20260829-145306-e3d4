import inspect

from fastapi.testclient import TestClient

from app import auth, images
from app.main import app


def test_health_endpoint_returns_ok() -> None:
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_stub_helper_signatures_exist() -> None:
    assert callable(auth.get_current_user)
    current_user_params = inspect.signature(auth.get_current_user).parameters
    assert "request" in current_user_params
    assert "db" in current_user_params

    assert callable(images.delete_image_file)
    delete_params = inspect.signature(images.delete_image_file).parameters
    assert "filename" in delete_params


def test_stub_routes_are_wired() -> None:
    requests = [
        ("POST", "/api/auth/register", {"email": "user@example.com", "password": "secret"}),
        ("POST", "/api/auth/login", {"email": "user@example.com", "password": "secret"}),
        ("POST", "/api/auth/logout", None),
        ("GET", "/api/auth/me", None),
        ("GET", "/api/categories", None),
        ("POST", "/api/categories", {"name": "Shirts"}),
        ("DELETE", "/api/categories/1", None),
        ("GET", "/api/items", None),
        ("POST", "/api/items", {"name": "Hemd", "category_id": 1}),
        ("GET", "/api/items/1", None),
        ("PATCH", "/api/items/1", {"name": "Neu"}),
        ("DELETE", "/api/items/1", None),
        ("POST", "/api/images", None),
        ("GET", "/api/images/somefile.png", None),
        ("GET", "/api/outfits", None),
        ("POST", "/api/outfits", {"name": "Outfit", "item_ids": [1]}),
        ("DELETE", "/api/outfits/1", None),
        ("DELETE", "/api/account", None),
    ]

    with TestClient(app) as client:
        for method, path, body in requests:
            if body is None:
                response = client.request(method, path)
            else:
                response = client.request(method, path, json=body)
            assert response.status_code not in (404, 405), (
                f"{method} {path} is not wired: answered {response.status_code}"
            )
