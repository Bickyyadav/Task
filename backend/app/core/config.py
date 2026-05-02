"""
Application configuration loaded from environment variables.
Uses Pydantic BaseSettings for validation and type coercion.
"""

from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings
from urllib.parse import quote_plus


class Settings(BaseSettings):
    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "ProjectManager"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── MongoDB ──────────────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "project_manager"

    # ── JWT ──────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-me-to-a-random-64-char-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: Any = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"]

    # ── First Superuser (seeded on startup if DB is empty) ───────
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "changethis"
    FIRST_SUPERUSER_FULL_NAME: str = "System Admin"

    @field_validator("MONGODB_URL", mode="before")
    @classmethod
    def validate_mongodb_url(cls, v: str) -> str:
        if not isinstance(v, str) or "://" not in v:
            return v

        prefix, rest = v.split("://", 1)
        if "@" not in rest:
            return v

        # The last '@' separates userinfo from the host
        parts = rest.rsplit("@", 1)
        if len(parts) != 2:
            return v

        userinfo, host = parts
        if ":" not in userinfo:
            # Just username, no password
            return f"{prefix}://{quote_plus(userinfo)}@{host}"

        # Split at the first ':' to separate username and password
        username, password = userinfo.split(":", 1)
        return f"{prefix}://{quote_plus(username)}:{quote_plus(password)}@{host}"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            items = v.strip("[]").split(",")
            return [
                item.strip().strip('"').strip("'") for item in items if item.strip()
            ]
        return v

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
