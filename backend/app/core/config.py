from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "AI Gateway"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    api_key_pepper: str = "change-me-too"
    vovoapi_base_url: str = "https://api.vovoapi.example"
    vovoapi_api_key: str = "change-me"
    vovoapi_timeout_seconds: float = 120.0
    database_url: str = "postgresql+psycopg://postgres:postgres@postgres:5432/ai_gateway"
    redis_url: str = "redis://redis:6379/0"
    rate_limit_per_minute: int = 60

    @model_validator(mode="after")
    def reject_unsafe_production_defaults(self) -> "Settings":
        if self.app_env.lower() != "production":
            return self

        unsafe_values = {
            "jwt_secret_key": {"change-me", "replace-with-a-long-random-secret"},
            "api_key_pepper": {"change-me-too", "replace-with-a-different-random-secret"},
            "vovoapi_api_key": {"change-me", "replace-me", ""},
        }
        for field_name, placeholders in unsafe_values.items():
            if getattr(self, field_name) in placeholders:
                raise ValueError(f"{field_name} must be configured for production")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()