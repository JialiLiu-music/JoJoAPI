from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import api_key_prefix, generate_api_key, hash_api_key
from app.models.api_key import APIKey
from app.models.user import User


def create_api_key(db: Session, user: User) -> tuple[APIKey, str]:
    plain_key = generate_api_key()
    api_key = APIKey(
        user_id=user.id,
        key_hash=hash_api_key(plain_key),
        key_prefix=api_key_prefix(plain_key),
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return api_key, plain_key


def list_api_keys(db: Session, user: User) -> list[APIKey]:
    statement = select(APIKey).where(APIKey.user_id == user.id).order_by(APIKey.created_at.desc())
    return list(db.scalars(statement))


def revoke_api_key(db: Session, user: User, api_key_id: int) -> None:
    api_key = db.scalar(select(APIKey).where(APIKey.id == api_key_id, APIKey.user_id == user.id))
    if not api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")

    api_key.status = "revoked"
    api_key.revoked_at = datetime.now(UTC)
    db.commit()