from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
from app.config import settings

router = APIRouter()

# ── System Prompt ─────────────────────────────────────────
SYSTEM_PROMPT = """You are AgriSense AI, an expert agricultural assistant specializing in smart farming.

Your expertise covers:
1. **Fertilizer Recommendations** — based on Montana State University guidelines:
   - N(lb/acre) = NO₃-N(ppm) × 2 × soil_depth(in) / 6
   - Urea required = Fertilizer N / 0.46 (Urea is 46% N)
   - MAP = P₂O₅ / 0.52 | MOP = K₂O / 0.61
   - SOM < 1% → add 20 lb N/acre | SOM > 3% → subtract 20 lb N/acre
2. **Soil Health** — pH, EC, organic carbon, nutrient levels
3. **Crop Selection** — matching crops to soil and climate conditions
4. **Plant Diseases** — identification and treatment (fungicides, bactericides)
5. **Nutrient Deficiencies** — symptoms and corrections
6. **Weather Impact** — how rainfall, humidity, temperature affect fertilizer application

Guidelines:
- Be concise and practical — give specific quantities, timing, and product names
- Always mention units (kg/acre, lb/acre, ppm, %)
- If soil or crop data is provided in context, use it for personalized advice
- Format responses with **bold** for key terms and numbered lists for steps"""

# ── Agricultural Knowledge Base (rule-based fallback) ──────
KNOWLEDGE_BASE = [
    {
        "keywords": ["urea", "nitrogen fertilizer", "how much urea"],
        "answer": (
            "**Urea Calculation (Montana Formula):**\n\n"
            "1. **Soil Available N** = NO₃-N(ppm) × 2 × depth(in) / 6\n"
            "2. **Fertilizer N needed** = Total N required − Soil N − Legume credit ± SOM adj\n"
            "3. **Urea required** = Fertilizer N / 0.46 (Urea is 46% N)\n\n"
            "**Example:** If you need 92 lb N/acre → 92 / 0.46 = **200 kg Urea/acre**\n\n"
            "Apply in 3 splits: 50% at planting, 30% at vegetative, 20% at reproductive stage."
        )
    },
    {
        "keywords": ["nitrogen deficiency", "yellow leaves", "yellowing", "pale leaves"],
        "answer": (
            "**Nitrogen Deficiency Treatment:**\n\n"
            "Symptoms: Yellowing of older/lower leaves, stunted growth, pale green color.\n\n"
            "1. Apply **Urea (46-0-0)** at **50 kg/acre** broadcast\n"
            "2. For quick response: **Foliar spray** — 2% urea solution (20g/L water)\n"
            "3. Apply in the **morning or evening** to avoid leaf burn\n"
            "4. Repeat after 15 days if needed\n\n"
            "Note: Nitrogen is mobile in plants — symptoms appear on **older leaves first**."
        )
    },
    {
        "keywords": ["phosphorus deficiency", "purple leaves", "reddish", "p deficiency"],
        "answer": (
            "**Phosphorus Deficiency Treatment:**\n\n"
            "Symptoms: Purple/reddish coloration on leaves, poor root development, delayed maturity.\n\n"
            "1. Apply **DAP (18-46-0)** at **50 kg/acre** — incorporates into soil\n"
            "2. Alternative: **SSP (Single Super Phosphate)** at 100 kg/acre\n"
            "3. Apply **before planting** and incorporate into top 15 cm soil\n"
            "4. Phosphorus MAP formula: P₂O₅ required / 0.52\n\n"
            "Note: Phosphorus is immobile — apply at root zone for best uptake."
        )
    },
    {
        "keywords": ["potassium deficiency", "brown margins", "leaf scorch", "k deficiency"],
        "answer": (
            "**Potassium Deficiency Treatment:**\n\n"
            "Symptoms: Brown/scorched leaf margins (tip burn), weak stems, poor fruit quality.\n\n"
            "1. Apply **MOP (Muriate of Potash, 0-0-60)** at **25–50 kg/acre**\n"
            "2. Alternative: **SOP (Sulphate of Potash)** — better for saline soils\n"
            "3. MOP formula: K₂O required / 0.61\n"
            "4. Can apply as foliar: 0.5% KNO₃ solution\n\n"
            "Note: Potassium improves drought resistance and disease tolerance."
        )
    },
    {
        "keywords": ["rice fertilizer", "rice crop", "paddy fertilizer", "paddy nutrient"],
        "answer": (
            "**Rice Fertilizer Recommendation:**\n\n"
            "| Nutrient | Requirement | Fertilizer | Dose |\n"
            "|----------|------------|-----------|------|\n"
            "| Nitrogen | 120–150 lb/acre | Urea (46%) | 130–160 kg/acre |\n"
            "| Phosphorus | 60 lb P₂O₅/acre | DAP (18-46) | 115 kg/acre |\n"
            "| Potassium | 40 lb K₂O/acre | MOP (0-0-60) | 65 kg/acre |\n\n"
            "**Split Application Schedule:**\n"
            "1. **Before transplanting**: 50% N + 100% P + 100% K\n"
            "2. **Tillering (30 DAT)**: 30% N\n"
            "3. **Panicle initiation (60 DAT)**: 20% N"
        )
    },
    {
        "keywords": ["wheat fertilizer", "wheat crop", "wheat nutrient"],
        "answer": (
            "**Wheat Fertilizer Recommendation:**\n\n"
            "| Nutrient | Requirement | Fertilizer | Dose |\n"
            "|----------|------------|-----------|------|\n"
            "| Nitrogen | 120 lb/acre | Urea (46%) | 130 kg/acre |\n"
            "| Phosphorus | 60 lb P₂O₅/acre | SSP or DAP | 375 or 115 kg/acre |\n"
            "| Potassium | 40 lb K₂O/acre | MOP | 65 kg/acre |\n\n"
            "**Application Schedule:**\n"
            "1. **At sowing**: 50% N + 100% P + 100% K\n"
            "2. **Crown root (21 DAS)**: 25% N\n"
            "3. **Jointing (40 DAS)**: 25% N"
        )
    },
    {
        "keywords": ["early blight", "late blight", "blight", "fungal disease"],
        "answer": (
            "**Blight Disease Management:**\n\n"
            "**Early Blight** (Alternaria):\n"
            "- Apply **Mancozeb** 2g/L water or **Chlorothalonil** 2g/L\n"
            "- Spray every 7–10 days\n"
            "- Remove and destroy infected leaves\n\n"
            "**Late Blight** (Phytophthora):\n"
            "- Apply **Metalaxyl + Mancozeb** immediately at first sign\n"
            "- Or **Cymoxanil 8% + Mancozeb 64%** at 2g/L\n"
            "- Avoid overhead irrigation\n"
            "- Improve field drainage"
        )
    },
    {
        "keywords": ["soil ph", "acidic soil", "alkaline soil", "ph correction"],
        "answer": (
            "**Soil pH Correction:**\n\n"
            "Optimal range for most crops: **pH 6.0 – 7.5**\n\n"
            "**Acidic soil (pH < 6.0):**\n"
            "- Apply **Agricultural Lime (CaCO₃)** at 500–1000 kg/acre\n"
            "- Or **Dolomite** at 400–800 kg/acre\n"
            "- Incorporate and re-test after 60 days\n\n"
            "**Alkaline soil (pH > 7.5):**\n"
            "- Apply **Gypsum (CaSO₄)** at 200–400 kg/acre\n"
            "- Or **Elemental Sulfur** at 100–200 kg/acre\n"
            "- Acidifying fertilizers: Ammonium Sulphate instead of Urea"
        )
    },
    {
        "keywords": ["rainfall fertilizer", "rain application", "leaching", "when to apply"],
        "answer": (
            "**Rainfall & Fertilizer Timing:**\n\n"
            "✅ **Safe to apply:**\n"
            "- Light rain (< 5mm) after application helps incorporate urea\n"
            "- Apply 2–3 days after heavy rain when soil drains\n\n"
            "❌ **Avoid applying:**\n"
            "- 24 hours before forecasted heavy rain (> 25mm) — causes N leaching\n"
            "- During rainfall — dilution and runoff loss\n"
            "- On waterlogged soil — denitrification of nitrogen\n\n"
            "**Foliar spray:** Never spray if rain expected within 6 hours."
        )
    },
    {
        "keywords": ["montana formula", "montana guideline", "fertilizer formula", "n formula"],
        "answer": (
            "**Montana Fertilizer Guidelines (All Formulas):**\n\n"
            "| Formula | Equation |\n"
            "|---------|----------|\n"
            "| Soil Available N | NO₃-N(ppm) × 2 × depth(in) / 6 |\n"
            "| Fertilizer N | Total N − Soil N − Legume Credit |\n"
            "| SOM Adjustment | +20 lb if SOM<1% / −20 lb if SOM>3% |\n"
            "| Legume Credit | 10–40 lb N/acre depending on crop |\n"
            "| Stubble Credit | 10 lb N per 1000 lb residue |\n"
            "| Urea | Fert. N / 0.46 |\n"
            "| MAP (P) | P₂O₅ required / 0.52 |\n"
            "| MOP (K) | K₂O required / 0.61 |"
        )
    },
]


class ChatInput(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = {}


# ── Google Gemini (Primary AI Engine) ────────────────────
async def _call_gemini(message: str, context: dict) -> tuple[Optional[str], Optional[str]]:
    """Call Google Gemini API using configured key."""
    api_key = settings.gemini_api_key.strip()
    if not api_key:
        return None, None

    import httpx
    candidate_models = [
        settings.gemini_model,
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
        "gemini-3.5-flash",
        "gemini-pro-latest",
    ]
    unique_models = []
    for m in candidate_models:
        if m and m not in unique_models:
            unique_models.append(m)

    # Build context string for personalized responses
    context_parts = []
    if context.get("soil"):
        s = context["soil"]
        context_parts.append(
            f"Soil lab test: N={s.get('nitrogen')}ppm, P={s.get('phosphorus')}ppm, "
            f"K={s.get('potassium')}ppm, pH={s.get('ph')}, OC={s.get('organic_carbon')}%, SOM={s.get('som', 1.8)}%"
        )
    if context.get("crop"):
        context_parts.append(f"Target crop: {context['crop']}")
    if context.get("disease"):
        context_parts.append(f"Detected foliar disease (YOLOv11): {context['disease']}")
    if context.get("deficiency"):
        context_parts.append(f"Detected nutrient deficiency (YOLOv11): {context['deficiency']}")
    if context.get("weather"):
        w = context["weather"]
        context_parts.append(
            f"Current weather: {w.get('temperature')}°C, humidity {w.get('humidity')}%, rainfall {w.get('rainfall')}mm"
        )

    # Multi-language instruction
    lang_instruction = ""
    lang = context.get("language", "en")
    if lang and lang != "en":
        lang_names = {
            "hi": "Hindi (हिंदी)", "bn": "Bengali (বাংলা)", "mr": "Marathi (मराठी)",
            "te": "Telugu (తెలుగు)", "ta": "Tamil (தமிழ்)", "gu": "Gujarati (ગુજરાતી)",
            "ur": "Urdu (اردو)", "kn": "Kannada (ಕನ್ನಡ)", "or": "Odia (ଓଡ଼ିଆ)", "ml": "Malayalam (മലയാളം)"
        }
        target_name = lang_names.get(lang, lang)
        lang_instruction = f"\n\nIMPORTANT: The user has selected language '{target_name}'. You MUST formulate your answer entirely in {target_name} using its standard script. Maintain technical accuracy and clean bullet points."

    farm_context_str = ("\n\n=== FARM & CROP CONTEXT ===\n" + "\n".join(context_parts)) if context_parts else ""
    full_prompt = f"{SYSTEM_PROMPT}{farm_context_str}{lang_instruction}\n\nUser Question: {message}"

    for candidate in unique_models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate}:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": full_prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.4,
                    "topP": 0.95,
                    "maxOutputTokens": 1500,
                }
            }

            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        content = candidates[0].get("content", {})
                        parts = content.get("parts", [])
                        if parts:
                            return parts[0].get("text", ""), candidate
                else:
                    print(f"[Gemini-Chat] Model {candidate} HTTP {resp.status_code}: {resp.text[:180]}")
        except Exception as e:
            print(f"[Gemini-Chat] Failed on {candidate}: {e}")

    return None, None


# ── OpenAI GPT-4o ─────────────────────────────────────────
async def _call_openai(message: str, context: dict) -> Optional[str]:
    """Call OpenAI GPT-4o API."""
    if not settings.openai_api_key or settings.openai_api_key.startswith("your_"):
        return None
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        context_parts = []
        if context.get("soil"):
            s = context["soil"]
            context_parts.append(
                f"Soil data: N={s.get('nitrogen')}ppm, P={s.get('phosphorus')}ppm, "
                f"K={s.get('potassium')}ppm, pH={s.get('ph')}, OC={s.get('organic_carbon')}%"
            )
        if context.get("crop"):
            context_parts.append(f"Recommended crop: {context['crop']}")
        if context.get("disease"):
            context_parts.append(f"Detected disease: {context['disease']}")
        if context.get("deficiency"):
            context_parts.append(f"Detected deficiency: {context['deficiency']}")
        if context.get("weather"):
            w = context["weather"]
            context_parts.append(
                f"Current weather: {w.get('temperature')}°C, humidity {w.get('humidity')}%, "
                f"rainfall {w.get('rainfall')}mm"
            )

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        lang = context.get("language", "en")
        if lang and lang != "en":
            lang_names = {
                "hi": "Hindi (हिंदी)", "bn": "Bengali (বাংলা)", "mr": "Marathi (मराठी)",
                "te": "Telugu (తెలుగు)", "ta": "Tamil (தமிழ்)", "gu": "Gujarati (ગુજરાતી)",
                "ur": "Urdu (اردو)", "kn": "Kannada (ಕನ್ನಡ)", "or": "Odia (ଓଡ଼ିଆ)", "ml": "Malayalam (മലയാളം)"
            }
            target_name = lang_names.get(lang, lang)
            messages.append({
                "role": "system",
                "content": f"IMPORTANT: The user has selected language '{target_name}'. You MUST answer in {target_name} using its standard script. Maintain clear scientific formatting."
            })

        if context_parts:
            messages.append({
                "role": "system",
                "content": "Farm context: " + " | ".join(context_parts)
            })
        messages.append({"role": "user", "content": message})

        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            max_tokens=800,
            temperature=0.4,
        )
        return response.choices[0].message.content

    except Exception as e:
        print(f"[OpenAI] Error: {e}")
        return None


# ── Ollama Llama 3 (local fallback) ──────────────────────
def _call_ollama(message: str, context: dict) -> Optional[str]:
    """Try local Ollama as secondary fallback."""
    try:
        import requests
        context_str = ""
        if context.get("soil"):
            context_str = f"Soil context: {context['soil']}. "

        payload = {
            "model": settings.ollama_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"{context_str}{message}"}
            ],
            "stream": False,
        }
        response = requests.post(
            f"{settings.ollama_base_url}/api/chat",
            json=payload,
            timeout=25,
        )
        if response.status_code == 200:
            return response.json().get("message", {}).get("content", "")
    except Exception as e:
        print(f"[Ollama] Unavailable: {e}")
    return None


# ── Rule-Based Knowledge Base (always-on fallback) ────────
def _knowledge_base_response(message: str) -> str:
    """Match question to agricultural knowledge base entries."""
    msg_lower = message.lower()
    for entry in KNOWLEDGE_BASE:
        if any(kw in msg_lower for kw in entry["keywords"]):
            return entry["answer"]

    return (
        "**AgriSense AI Advisory:**\n\n"
        "I can help you with:\n"
        "1. **Fertilizer calculations** — Urea, DAP, MOP doses using Montana formulas\n"
        "2. **Soil corrections** — pH, organic carbon, salinity fixes\n"
        "3. **Crop-specific nutrient plans** — Rice, Wheat, Maize, Cotton\n"
        "4. **Disease treatment** — fungicides, bactericides, application rates\n"
        "5. **Deficiency corrections** — N, P, K deficiency identification and fix\n"
        "6. **Weather-based timing** — when to apply fertilizer around rainfall\n\n"
        "**Try asking:** 'How much urea for rice?' or 'My leaves are yellowing — what's wrong?'\n\n"
        "*(Gemini AI engine is active. Please ask any detailed farming query!)*"
    )


# ── Main Endpoint ─────────────────────────────────────────
@router.post("/chatbot")
async def chat(data: ChatInput):
    """
    AI chatbot routing: Google Gemini (Primary) → OpenAI GPT-4o → Ollama → Rule-based fallback.
    """
    context = data.context or {}
    ai_response = None
    source = "rule_based"
    model_used = "knowledge_base"

    # Priority 1: Google Gemini (Primary AI Engine)
    ai_response, gemini_model_used = await _call_gemini(data.message, context)
    if ai_response:
        source = "gemini"
        model_used = gemini_model_used or settings.gemini_model

    # Priority 2: OpenAI GPT-4o
    if not ai_response:
        ai_response = await _call_openai(data.message, context)
        if ai_response:
            source = "openai"
            model_used = settings.openai_model

    # Priority 3: Local Ollama Llama 3
    if not ai_response:
        ai_response = _call_ollama(data.message, context)
        if ai_response:
            source = "ollama"
            model_used = settings.ollama_model

    # Priority 4: Rule-based knowledge base
    if not ai_response:
        ai_response = _knowledge_base_response(data.message)

    return {
        "response": ai_response,
        "source": source,
        "model": model_used,
    }
