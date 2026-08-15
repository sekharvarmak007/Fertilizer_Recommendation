from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # App
    app_name: str = "AgriSense AI"
    debug: bool = True

    # Weather
    openweathermap_api_key: str = ""

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "agrikg2024"

    # Gemini API (Primary Fertilizer & Multimodal Recommendation Engine)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-flash-latest"

    # OpenAI (Alternative AI Chatbot)
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    # Ollama (local fallback if Cloud API keys not set)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"

    # Model paths
    soil_model_path: str = str(BASE_DIR / "ml_models" / "soil_fertility_xgboost.pkl")
    fertilizer_model_path: str = str(BASE_DIR / "ml_models" / "fertilizer_model.pkl")
    disease_model_path: str = str(BASE_DIR / "ml_models" / "model-3.pt")
    deficiency_model_path: str = str(BASE_DIR / "ml_models" / "model-4.pt")

    # Upload
    upload_dir: str = "uploads"
    max_file_size_mb: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Ensure upload dir exists
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
