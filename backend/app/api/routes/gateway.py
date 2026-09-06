from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_gateway_identity, get_db
from app.core.rate_limit import consume_rate_limit
from app.models.api_key import APIKey
from app.models.model_price import ModelPrice
from app.models.user import User
from app.schemas.gateway import ChatCompletionRequest
from app.services.gateway_service import handle_chat_completion

router = APIRouter(tags=["gateway"])


@router.get("/v1/models")
def list_models(
    _: tuple[User, APIKey] = Depends(get_gateway_identity),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    prices = db.scalars(
        select(ModelPrice).where(ModelPrice.is_active.is_(True)).order_by(ModelPrice.provider, ModelPrice.model)
    ).all()
    return {
        "object": "list",
        "data": [
            {
                "id": price.model,
                "object": "model",
                "owned_by": price.provider,
            }
            for price in prices
        ],
    }


@router.post("/v1/chat/completions")
async def chat_completions(
    payload: ChatCompletionRequest,
    identity: tuple[User, APIKey] = Depends(get_gateway_identity),
    db: Session = Depends(get_db),
) -> Response:
    user, api_key = identity
    if not consume_rate_limit(str(api_key.id)):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
    return await handle_chat_completion(db, user, api_key, payload.model_dump(exclude_none=True))