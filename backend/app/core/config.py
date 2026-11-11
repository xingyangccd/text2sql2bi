from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        extra="ignore",
        case_sensitive=False,
    )

    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    POSTGRES_DSN: str = (
        "postgresql://bi:bi_dev_password@localhost:54320/text2sql2bi"
    )
    QUERY_POSTGRES_DSN: str = (
        "postgresql://bi_reader:bi_reader_password@localhost:54320/text2sql2bi"
    )
    REDIS_URL: str = "redis://localhost:56379/0"
    QDRANT_URL: str = "http://localhost:56333"
    QDRANT_API_KEY: str = ""

    @property
    def allowed_origins(self) -> list[str]:
        return [
            item.strip()
            for item in self.ALLOWED_ORIGINS.split(",")
            if item.strip()
        ]

@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()