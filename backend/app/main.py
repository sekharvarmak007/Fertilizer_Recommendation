from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.api import soil, crop, disease, deficiency, weather, recommendation, chatbot, knowledge_graph

app = FastAPI(
    title="AgriSense AI — Fertilizer Recommendation API",
    description="Multimodal AI-Powered Intelligent Fertilizer Recommendation and Plant Health Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (uploads) ────────────────────────────────
uploads_path = Path(settings.upload_dir)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# ── Routers ───────────────────────────────────────────────
app.include_router(soil.router,             prefix="",  tags=["Soil Analysis"])
app.include_router(crop.router,             prefix="",  tags=["Crop Recommendation"])
app.include_router(disease.router,          prefix="",  tags=["Disease Detection"])
app.include_router(deficiency.router,       prefix="",  tags=["Deficiency Detection"])
app.include_router(weather.router,          prefix="",  tags=["Weather"])
app.include_router(recommendation.router,   prefix="",  tags=["Recommendation"])
app.include_router(chatbot.router,          prefix="",  tags=["AI Chatbot"])
app.include_router(knowledge_graph.router,  prefix="",  tags=["Knowledge Graph"])

@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.app_name,
        "status": "online",
        "version": "1.0.0",
        "endpoints": [
            "POST /soil", "POST /crop", "POST /disease", "POST /deficiency",
            "POST /weather", "POST /recommendation", "POST /chatbot",
            "GET  /knowledge-graph"
        ]
    }

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
