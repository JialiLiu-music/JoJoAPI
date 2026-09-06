from datetime import datetime

from decimal import Decimal

from pydantic import BaseModel, EmailStr, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    balance: Decimal
    is_admin: bool
    created_at: datetime | None = None