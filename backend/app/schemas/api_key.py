from datetime import datetime

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class APIKeyCreateResponse(BaseModel):
    id: int
    key: str
    prefix: str
    status: str
    created_at: datetime | None = None


class APIKeyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prefix: str = Field(validation_alias=AliasChoices("prefix", "key_prefix"))
    status: str
    created_at: datetime | None = None