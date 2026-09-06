from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.usage import UsageResponse
from app.services.usage_service import list_user_usage

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("", response_model=list[UsageResponse])
def list_usage(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[UsageResponse]:
    return [UsageResponse.model_validate(item) for item in list_user_usage(db, current_user)]