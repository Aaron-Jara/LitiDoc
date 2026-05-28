from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ANTHROPIC_API_KEY: str
    CHUNK_SIZE: int = 3000
    CHUNK_OVERLAP: int = 200
    MAX_CONCURRENT: int = 25
    STORAGE_PATH: str = "storage"
    UPLOAD_PATH: str = "storage/uploads"
    JOBS_PATH: str = "storage/jobs"


settings = Settings()
