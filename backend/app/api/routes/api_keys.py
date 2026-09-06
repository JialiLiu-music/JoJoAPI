from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.api_key import APIKeyCreateResponse, APIKeyRead
from app.services.api_key_service import create_api_key, list_api_keys, revoke_api_key

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.get("", response_model=list[APIKeyRead])
def get_api_keys(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[APIKeyRead]:
    return [APIKeyRead.model_validate(key) for key in list_api_keys(db, current_user)]


@router.post("", response_model=APIKeyCreateResponse, status_code=status.HTTP_201_CREATED)
def create_key(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> APIKeyCreateResponse:
    api_key, plain_key = create_api_key(db, current_user)
    return APIKeyCreateResponse(
        id=api_key.id, key=plain_key, prefix=api_key.key_prefix, status=api_key.status,
        created_at=api_key.created_at,
    )


@router.delete("/{api_key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_key(
    api_key_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Response:
    revoke_api_key(db, current_user, api_key_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)