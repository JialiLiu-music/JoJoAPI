from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.user import User
from app.schemas.admin import (
    AdminUserResponse,
    BalanceUpdateRequest,
    ModelPriceResponse,
    ModelPriceUpsert,
)
from app.services.admin_service import get_revenue, list_model_prices, list_users, update_user_balance, upsert_model_price


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview")
def admin_overview(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict[str, str | int]:
    revenue = get_revenue(db)
    return {"total_revenue": str(revenue["total_revenue"]), "total_calls": revenue["total_calls"]}


@router.get("/users", response_model=list[AdminUserResponse])
def admin_users(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[User]:
    return list_users(db)


@router.patch("/users/{user_id}/balance", response_model=AdminUserResponse)
def change_balance(
    user_id: int,
    payload: BalanceUpdateRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> User:
    user = update_user_balance(db, user_id, payload.balance)
    if not user:
        from fastapi import HTTPException

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/model-prices", response_model=list[ModelPriceResponse])
def admin_model_prices(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[object]:
    return list_model_prices(db)


@router.put("/model-prices", response_model=ModelPriceResponse)
def set_model_price(
    payload: ModelPriceUpsert, _: User = Depends(require_admin), db: Session = Depends(get_db)
) -> object:
    return upsert_model_price(
        db, payload.provider, payload.model, payload.input_token_price, payload.output_token_price, payload.currency
    )