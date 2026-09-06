from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.model_price import ModelPrice
from app.models.user import User


def calculate_cost(db: Session, model: str, input_tokens: int, output_tokens: int) -> Decimal:
    price = db.scalar(select(ModelPrice).where(ModelPrice.model == model, ModelPrice.is_active.is_(True)).limit(1))
    if not price:
        return Decimal("0")
    return (Decimal(input_tokens) * price.input_token_price) + (Decimal(output_tokens) * price.output_token_price)


def ensure_balance(user: User) -> None:
    if user.balance <= 0:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient balance")


def deduct_balance(db: Session, user: User, cost: Decimal) -> None:
    if cost <= 0:
        return

    result = db.execute(
        update(User)
        .where(User.id == user.id, User.balance >= cost)
        .values(balance=User.balance - cost)
    )
    if result.rowcount != 1:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient balance")
