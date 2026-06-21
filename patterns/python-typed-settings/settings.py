"""Typed, validated app config in ONE place — loaded from env / .env, validated at startup.

Reach for this instead of scattering os.getenv() with ad-hoc casts: a single typed object,
fail-fast validation, and editor autocomplete. Requires `pydantic-settings` (v2).
"""

from functools import lru_cache

from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # env_prefix namespaces vars (APP_DATABASE_URL); .env for local dev, real env in prod.
    model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env", extra="ignore")

    debug: bool = False
    database_url: PostgresDsn  # REQUIRED + validated as a real DSN -> app won't boot misconfigured
    request_timeout_s: float = Field(default=5.0, gt=0)  # constraint enforced on load
    allowed_hosts: list[str] = Field(default_factory=list)


@lru_cache  # load + validate exactly once; import and call settings() anywhere
def settings() -> Settings:
    # Raises pydantic.ValidationError at startup if a required var is missing/invalid (fail fast).
    return Settings()  # type: ignore[call-arg]  # values come from env, not constructor args
