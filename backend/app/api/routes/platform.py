from fastapi import APIRouter

router = APIRouter(prefix="/platform", tags=["platform"])


@router.get("")
def platform_info() -> dict[str, str | list[str]]:
    return {
        "status": "ready",
        "name": "AI Gateway",
        "version": "0.1.0",
        "capabilities": ["auth", "api-key", "billing", "usage", "gateway", "admin"],
    }


@router.get("/health")
def platform_health() -> dict[str, str]:
    return {"status": "healthy"}