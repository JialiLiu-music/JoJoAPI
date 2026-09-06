from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.payment import Payment
from app.models.user import User

router = APIRouter(prefix="/billing", tags=["billing"])


class CreateOrderRequest(BaseModel):
    amount: Decimal


@router.get("/summary")
def billing_summary(current_user: User = Depends(get_current_user)) -> dict[str, str]:
    return {"balance": str(current_user.balance), "currency": "USD"}


@router.post("/orders", status_code=status.HTTP_201_CREATED)
def create_order(
    payload: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str | int]:
    if payload.amount <= 0:
        raise HTTPException(status_code=422, detail="Amount must be positive")
    payment = Payment(user_id=current_user.id, amount=payload.amount, provider="manual", status="pending")
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {"id": payment.id, "amount": str(payment.amount), "status": payment.status}


@router.get("/orders")
def list_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict[str, str | int]]:
    orders = db.scalars(select(Payment).where(Payment.user_id == current_user.id).order_by(Payment.created_at.desc())).all()
    return [{"id": item.id, "amount": str(item.amount), "status": item.status, "created_at": item.created_at.isoformat()} for item in orders]
