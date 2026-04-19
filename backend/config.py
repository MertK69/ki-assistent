from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_ENABLED: bool = True

    FRONTEND_ORIGIN: str = "http://localhost:3000"

    @property
    def supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL.strip() and self.SUPABASE_ANON_KEY.strip())

    @property
    def llm_configured(self) -> bool:
        return self.OPENAI_ENABLED and bool(self.OPENAI_API_KEY.strip())


settings = Settings()
