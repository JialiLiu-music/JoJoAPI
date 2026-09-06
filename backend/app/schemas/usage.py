from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class UsageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    api_key_id: int | None
    provider: str
    model: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost: Decimal
    request_id: str | None
    status: str
    error_message: str | None
    created_at: datetime