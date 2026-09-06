from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, ConfigDict


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    balance: Decimal
    is_admin: bool
    created_at: datetime


class BalanceUpdateRequest(BaseModel):
    balance: Decimal


class ModelPriceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    provider: str
    model: str
    input_token_price: Decimal
    output_token_price: Decimal
    currency: str
    is_active: bool


class ModelPriceUpsert(BaseModel):
    provider: str = "vovoapi"
    model: str
    input_token_price: Decimal
    output_token_price: Decimal
    currency: str = "USD"
    is_active: bool = True