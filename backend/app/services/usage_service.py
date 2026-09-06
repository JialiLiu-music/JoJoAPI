from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.api_key import APIKey
from app.models.usage import UsageRecord
from app.models.user import User


def record_usage(
    db: Session, user: User, api_key: APIKey | None, model: str, input_tokens: int,
    output_tokens: int, cost: Decimal, request_id: str | None = None,
    status: str = "success", error_message: str | None = None,
) -> UsageRecord:
    usage = UsageRecord(
        user_id=user.id, api_key_id=api_key.id if api_key else None, provider="vovoapi",
        model=model, input_tokens=input_tokens, output_tokens=output_tokens,
        total_tokens=input_tokens + output_tokens, cost=cost, request_id=request_id,
        status=status, error_message=error_message,
    )
    db.add(usage)
    return usage


def list_user_usage(db: Session, user: User) -> list[UsageRecord]:
    statement = select(UsageRecord).where(UsageRecord.user_id == user.id).order_by(UsageRecord.created_at.desc()).limit(100)
    return list(db.scalars(statement))