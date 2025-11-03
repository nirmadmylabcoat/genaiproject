from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    api_prefix: str = Field(default="/api")
    models_dir: Path = Field(default=Path("../models"))
    database_url: str = Field(default="sqlite+aiosqlite:///./genaccess.db")
    summarizer_model: str = Field(default="sshleifer/distilbart-cnn-12-6")
    device: str = Field(default="cpu")
    enable_backend_detection: bool = Field(default=True)

    model_config = SettingsConfigDict(env_file=".env", env_prefix="GENACCESS_", extra="ignore")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.models_dir = settings.models_dir.resolve()
    return settings


settings = get_settings()

