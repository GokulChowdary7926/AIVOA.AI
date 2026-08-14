from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "gemma2-9b-it"
    GROQ_MODEL_LARGE: str = "llama-3.3-70b-versatile"
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/aivoa_complaints"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
