import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentFence - AI Agent Safety & Control Gateway"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./agentfence.db")
    ALLOWED_ORIGINS: list[str] = ["*"]
    
    # Trusted internal email domains
    TRUSTED_DOMAINS: list[str] = ["acmecorp.internal", "company.com", "enterprise.org"]
    
    # Highly restricted database tables
    PROTECTED_TABLES: list[str] = ["customer_pii", "user_credentials", "financial_ledger", "system_secrets"]
    
    # Destructive SQL verbs
    DESTRUCTIVE_SQL_KEYWORDS: list[str] = ["DROP", "TRUNCATE", "ALTER", "DELETE", "UPDATE"]

settings = Settings()
