import pytest
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import deps
from app.db.base import Base
from app.main import app as fastapi_app
from app.models.model_price import ModelPrice
from app.models.usage import UsageRecord
from app.models.user import User
import app.models  # noqa: F401


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    fastapi_app.state.testing_session = testing_session

    def override_get_db():
        db = testing_session()
        try:
            yield db
        finally:
            db.close()

    fastapi_app.dependency_overrides[deps.get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()
    if hasattr(fastapi_app.state, "testing_session"):
        del fastapi_app.state.testing_session
    Base.metadata.drop_all(engine)


def seed_user(client: TestClient, email: str, balance: str = "100") -> tuple[str, int]:
    registration = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123"},
    )
    assert registration.status_code == 201
    token = registration.json()["access_token"]

    db = fastapi_app.state.testing_session()
    try:
        user = db.query(User).filter(User.email == email).one()
        user.balance = balance
        db.commit()
        db.refresh(user)
        return token, user.id
    finally:
        db.close()


def seed_price(model: str, input_price: str = "0.01000000", output_price: str = "0.02000000") -> None:
    db = fastapi_app.state.testing_session()
    try:
        price = ModelPrice(
            provider="vovoapi",
            model=model,
            input_token_price=input_price,
            output_token_price=output_price,
            currency="USD",
            is_active=True,
        )
        db.add(price)
        db.commit()
    finally:
        db.close()


def test_health_and_authentication_flow(client: TestClient):
    assert client.get("/health").json() == {"status": "healthy"}
    assert client.get("/api/v1/users/me").status_code == 401

    registration = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert registration.status_code == 201
    token = registration.json()["access_token"]

    duplicate = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert duplicate.status_code == 409

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"

    me = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "test@example.com"

    tampered = client.get("/api/v1/users/me", headers={"Authorization": "Bearer invalid-token"})
    assert tampered.status_code == 401


def test_api_key_lifecycle(client: TestClient):
    token, _ = seed_user(client, "keys@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post("/api/v1/api-keys", headers=headers)
    assert created.status_code == 201
    assert created.json()["key"].startswith("sk-user-")
    key_id = created.json()["id"]

    listed = client.get("/api/v1/api-keys", headers=headers)
    assert listed.status_code == 200
    assert listed.json()[0]["status"] == "active"
    assert "key" not in listed.json()[0]

    revoked = client.delete(f"/api/v1/api-keys/{key_id}", headers=headers)
    assert revoked.status_code == 204
    assert client.get("/api/v1/api-keys", headers=headers).json()[0]["status"] == "revoked"


def test_gateway_json_completion_records_usage(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    token, _ = seed_user(client, "gateway-json@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    api_key = client.post("/api/v1/api-keys", headers=headers).json()["key"]
    seed_price("demo-json")

    async def fake_forward_chat_completion(payload: dict[str, object]):
        return JSONResponse(
            content={
                "id": "chatcmpl-json",
                "usage": {"prompt_tokens": 5, "completion_tokens": 7},
            },
            status_code=200,
        )

    monkeypatch.setattr("app.services.gateway_service.forward_chat_completion", fake_forward_chat_completion)

    response = client.post(
        "/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": "demo-json", "messages": [{"role": "user", "content": "hello"}]},
    )
    assert response.status_code == 200
    assert response.json()["id"] == "chatcmpl-json"

    db = fastapi_app.state.testing_session()
    try:
        usage_rows = db.query(UsageRecord).filter(UsageRecord.model == "demo-json").all()
        assert len(usage_rows) == 1
        assert usage_rows[0].status == "success"
        assert usage_rows[0].total_tokens == 12
        assert usage_rows[0].cost > 0
    finally:
        db.close()


def test_gateway_stream_completion_records_usage(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    token, _ = seed_user(client, "gateway-stream@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    api_key = client.post("/api/v1/api-keys", headers=headers).json()["key"]
    seed_price("demo-stream")

    async def stream_source():
        yield b'data: {"id":"chatcmpl-stream","usage":{"prompt_tokens":11,"completion_tokens":13}}\n\n'
        yield b"data: [DONE]\n\n"

    async def fake_forward_chat_completion(payload: dict[str, object]):
        return StreamingResponse(stream_source(), media_type="text/event-stream")

    monkeypatch.setattr("app.services.gateway_service.forward_chat_completion", fake_forward_chat_completion)

    response = client.post(
        "/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": "demo-stream", "stream": True, "messages": [{"role": "user", "content": "hello"}]},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert "chatcmpl-stream" in response.text

    db = fastapi_app.state.testing_session()
    try:
        usage_rows = db.query(UsageRecord).filter(UsageRecord.model == "demo-stream").all()
        assert len(usage_rows) == 1
        assert usage_rows[0].status == "success"
        assert usage_rows[0].total_tokens == 24
        assert usage_rows[0].cost > 0
    finally:
        db.close()


def test_platform_model_prices_and_gateway_models(client: TestClient):
    token, _ = seed_user(client, "models@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    api_key = client.post("/api/v1/api-keys", headers=headers).json()["key"]

    db = fastapi_app.state.testing_session()
    try:
        active_price = ModelPrice(
            provider="vovoapi",
            model="demo-active",
            input_token_price="0.01000000",
            output_token_price="0.02000000",
            currency="USD",
            is_active=True,
        )
        inactive_price = ModelPrice(
            provider="vovoapi",
            model="demo-inactive",
            input_token_price="0.03000000",
            output_token_price="0.04000000",
            currency="USD",
            is_active=False,
        )
        db.add_all([active_price, inactive_price])
        db.commit()
    finally:
        db.close()

    platform_prices = client.get("/api/v1/platform/models")
    assert platform_prices.status_code == 200
    assert len(platform_prices.json()) == 1
    assert platform_prices.json()[0]["model"] == "demo-active"

    gateway_models = client.get("/v1/models", headers={"Authorization": f"Bearer {api_key}"})
    assert gateway_models.status_code == 200
    assert gateway_models.json()["object"] == "list"
    assert gateway_models.json()["data"] == [
        {"id": "demo-active", "object": "model", "owned_by": "vovoapi"}
    ]


def test_platform_limits_endpoint(client: TestClient):
    limits = client.get("/api/v1/platform/limits")
    assert limits.status_code == 200
    assert limits.json()["rate_limit_per_minute"] > 0
    assert limits.json()["rate_limit_window_seconds"] == 60
    assert limits.json()["scope"] == "per-api-key"