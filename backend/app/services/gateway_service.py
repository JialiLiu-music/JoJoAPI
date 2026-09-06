import json
from collections.abc import AsyncIterable, AsyncIterator
from typing import Any

from fastapi import HTTPException, status
from fastapi.responses import JSONResponse, Response, StreamingResponse
from sqlalchemy.orm import Session

from app.models.api_key import APIKey
from app.models.user import User
from app.providers.vovoapi import forward_chat_completion
from app.services.billing_service import calculate_cost, deduct_balance, ensure_balance
from app.services.usage_service import record_usage


def extract_usage(payload: dict[str, Any]) -> tuple[int, int]:
    usage = payload.get("usage") or {}
    input_tokens = int(usage.get("prompt_tokens") or usage.get("input_tokens") or 0)
    output_tokens = int(usage.get("completion_tokens") or usage.get("output_tokens") or 0)
    return input_tokens, output_tokens


def settle_usage(
    db: Session,
    user: User,
    api_key: APIKey,
    payload: dict[str, Any],
    data: dict[str, Any],
) -> None:
    input_tokens, output_tokens = extract_usage(data)
    model = payload.get("model", "unknown")
    cost = calculate_cost(db, model, input_tokens, output_tokens)
    deduct_balance(db, user, cost)
    record_usage(
        db=db,
        user=user,
        api_key=api_key,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost=cost,
        request_id=data.get("id"),
    )
    db.commit()


async def meter_stream(
    source: AsyncIterable[bytes],
    db: Session,
    user: User,
    api_key: APIKey,
    payload: dict[str, Any],
) -> AsyncIterator[bytes]:
    buffer = b""
    usage_payload: dict[str, Any] = {}
    try:
        async for chunk in source:
            yield chunk
            buffer += chunk
            while b"\n" in buffer:
                line, buffer = buffer.split(b"\n", 1)
                if not line.startswith(b"data:"):
                    continue
                raw_data = line[5:].strip()
                if not raw_data or raw_data == b"[DONE]":
                    continue
                try:
                    event = json.loads(raw_data)
                except json.JSONDecodeError:
                    continue
                if event.get("usage"):
                    usage_payload = event
        if usage_payload:
            settle_usage(db, user, api_key, payload, usage_payload)
        else:
            record_usage(db, user, api_key, payload.get("model", "unknown"), 0, 0, 0)
            db.commit()
    except Exception as exc:
        db.rollback()
        record_usage(
            db,
            user,
            api_key,
            payload.get("model", "unknown"),
            0,
            0,
            0,
            status="failed",
            error_message=str(exc),
        )
        db.commit()
        raise


async def handle_chat_completion(
    db: Session, user: User, api_key: APIKey, payload: dict[str, Any]
) -> Response:
    ensure_balance(user)
    provider_response = await forward_chat_completion(payload)

    if isinstance(provider_response, StreamingResponse):
        return StreamingResponse(
            meter_stream(provider_response.body_iterator, db, user, api_key, payload),
            status_code=provider_response.status_code,
            headers=dict(provider_response.headers),
            media_type=provider_response.media_type,
        )

    if not isinstance(provider_response, JSONResponse):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid provider response")
    data = json.loads(provider_response.body)
    if provider_response.status_code >= 400:
        record_usage(
            db,
            user,
            api_key,
            payload.get("model", "unknown"),
            0,
            0,
            0,
            status="failed",
            error_message=str(data),
        )
        db.commit()
        return provider_response

    settle_usage(db, user, api_key, payload, data)
    return provider_response