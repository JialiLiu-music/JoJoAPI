from collections.abc import AsyncIterator
from typing import Any

import httpx
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse

from app.core.config import settings


async def _stream_request(payload: dict[str, Any]) -> AsyncIterator[bytes]:
    headers = {"Authorization": f"Bearer {settings.vovoapi_api_key}", "Content-Type": "application/json"}
    timeout = httpx.Timeout(settings.vovoapi_timeout_seconds, read=None)
    async with httpx.AsyncClient(base_url=settings.vovoapi_base_url, timeout=timeout) as client:
        async with client.stream("POST", "/v1/chat/completions", json=payload, headers=headers) as response:
            if response.is_error:
                body = await response.aread()
                raise HTTPException(status_code=response.status_code, detail=body.decode("utf-8", "replace"))
            async for chunk in response.aiter_bytes():
                yield chunk


async def forward_chat_completion(payload: dict[str, Any]) -> JSONResponse | StreamingResponse:
    headers = {"Authorization": f"Bearer {settings.vovoapi_api_key}", "Content-Type": "application/json"}
    timeout = httpx.Timeout(settings.vovoapi_timeout_seconds)
    try:
        if payload.get("stream"):
            return StreamingResponse(
                _stream_request(payload),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
            )
        async with httpx.AsyncClient(base_url=settings.vovoapi_base_url, timeout=timeout) as client:
            response = await client.post("/v1/chat/completions", json=payload, headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Upstream provider unavailable") from exc

    if response.is_error:
        return JSONResponse(content=response.json(), status_code=response.status_code)
    return JSONResponse(content=response.json(), status_code=response.status_code)


class VovoAPIClient:
    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or settings.vovoapi_api_key

    async def chat_completions(self, payload: dict[str, Any]) -> JSONResponse | StreamingResponse:
        return await forward_chat_completion(payload)