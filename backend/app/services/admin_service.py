from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.model_price import ModelPrice
from app.models.usage import UsageRecord
from app.models.user import User


def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).limit(100).all()


def update_user_balance(db: Session, user_id: int, balance: Decimal) -> User | None:
    user = db.get(User, user_id)
    if not user:
        return None
    user.balance = balance
    db.commit()
    db.refresh(user)
    return user


def list_model_prices(db: Session) -> list[ModelPrice]:
    return db.query(ModelPrice).order_by(ModelPrice.created_at.desc()).all()


def upsert_model_price(
    db: Session,
    provider: str,
    model: str,
    input_token_price: Decimal,
    output_token_price: Decimal,
    currency: str,
) -> ModelPrice:
    price = db.query(ModelPrice).filter(ModelPrice.provider == provider, ModelPrice.model == model).first()
    if not price:
        price = ModelPrice(provider=provider, model=model)
        db.add(price)
    price.input_token_price = input_token_price
    price.output_token_price = output_token_price
    price.currency = currency
    price.is_active = True
    db.commit()
    db.refresh(price)
    return price


def get_revenue(db: Session) -> dict[str, Decimal | int]:
    records = db.query(UsageRecord).filter(UsageRecord.status == "success").all()
    return {
        "total_revenue": sum((record.cost for record in records), Decimal("0")),
        "total_calls": len(records),
    }
