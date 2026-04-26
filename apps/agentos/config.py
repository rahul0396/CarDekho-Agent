from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env into os.environ BEFORE Settings is instantiated, so SDKs that read
# the environment directly (Anthropic, Exa, etc.) can find their keys.
load_dotenv()


class Settings(BaseSettings):
    # Server
    port: int = 7777
    env: str = "development"
    log_level: str = "info"

    # Auth — shared secret with the Next.js frontend
    agentos_api_key: str = ""

    # External APIs
    anthropic_api_key: str = ""
    exa_api_key: str = ""

    # MongoDB — accepts MONGO_URI or MONGODB_URL
    mongo_uri: str = "mongodb://localhost:27017"
    mongodb_url: str = ""          # legacy alias; mongo_uri takes precedence
    mongodb_db: str = "cardekho_agent"

    # CORS — accepts ALLOWED_ORIGINS or CORS_ORIGINS
    allowed_origins: str = "http://localhost:3000"
    cors_origins: str = ""         # legacy alias; allowed_origins takes precedence

    # Model IDs
    model_opus: str = "claude-opus-4-7"
    model_sonnet: str = "claude-sonnet-4-6"

    # EMI defaults (Indian market 2026 ballpark)
    new_interest_rate: float = 9.5
    used_interest_rate: float = 13.5
    default_tenure_months: int = 60
    default_downpayment_pct: float = 20.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def effective_mongo_uri(self) -> str:
        return self.mongo_uri or self.mongodb_url or "mongodb://localhost:27017"

    @property
    def effective_cors_origins(self) -> str:
        return self.allowed_origins or self.cors_origins or "http://localhost:3000"


settings = Settings()

CORS_ORIGINS_LIST: list[str] = [
    o.strip() for o in settings.effective_cors_origins.split(",") if o.strip()
]
