from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.models.model_price import ModelPrice

router = APIRouter(prefix="/platform", tags=["platform"])


@router.get("")
def platform_info() -> dict[str, str | list[str]]:
    return {
        "status": "ready",
        "name": "AI Gateway",
        "version": "0.1.0",
        "capabilities": ["auth", "api-key", "billing", "usage", "gateway", "admin", "models", "pricing"],
    }


@router.get("/health")
def platform_health() -> dict[str, str]:
    return {"status": "healthy"}


@router.get("/limits")
def platform_limits() -> dict[str, int | str]:
    return {
        "rate_limit_per_minute": settings.rate_limit_per_minute,
        "rate_limit_window_seconds": 60,
        "scope": "per-api-key",
    }


@router.get("/models")
def platform_models(db: Session = Depends(get_db)) -> list[dict[str, str | bool]]:
    prices = db.scalars(
        select(ModelPrice).where(ModelPrice.is_active.is_(True)).order_by(ModelPrice.provider, ModelPrice.model)
    ).all()
    return [
        {
            "provider": price.provider,
            "model": price.model,
            "input_token_price": str(price.input_token_price),
            "output_token_price": str(price.output_token_price),
            "currency": price.currency,
            "is_active": price.is_active,
        }
        for price in prices
    ]