import json
import logging
from typing import Optional, Dict, Any
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

AGRONOMIST_SYSTEM_PROMPT = """You are AgriSense AI's Chief Agronomist and Precision Agriculture Specialist.
Your mission is to generate a comprehensive, personalized, and scientifically grounded fertilizer prescription by synthesizing multimodal agricultural data:
1. Soil Chemical Analysis (N, P, K, pH, EC, Organic Carbon, SOM, depth)
2. Leaf Vision Diagnosis (Detected Plant Diseases & Visual Nutrient Deficiencies from YOLOv11)
3. Crop Suitability & Climate Requirements (from ML classifiers & seasonal calendar)
4. Scientific Montana State University Fertilizer Equations (Baseline Urea, MAP, MOP kg/acre)
5. Live Weather Forecast & Agricultural Impact Rules

Format your response clearly with these sections:
1. **Executive Summary & Prescription**: Primary fertilizer combination and exact dosage per acre (e.g., Urea: X kg, DAP/MAP: Y kg, MOP: Z kg).
2. **Multimodal Analysis & Diagnosis**: Synthesize why this prescription was selected based on the soil test results AND any leaf disease or visual deficiency detected.
3. **Stage-by-Stage Application Schedule**: Detailed timeline (Basal/Sowing, Vegetative/Tillering, Flowering/Panicle initiation) with exact percentage splits and placement methods (broadcast, soil incorporation, fertigation, or foliar spray).
4. **Disease & Stress Precautions**: Specific advice if any disease (e.g. Early Blight) or deficiency is present, including recommended fungicides or foliar micronutrient sprays.
5. **Organic & Soil Health Enhancements**: Recommended biofertilizers (e.g., Rhizobium, Azotobacter, PSB), organic compost, or amendments (Gypsum/Lime for pH correction).
6. **Weather Advisory**: Practical guidance on timing fertilizer applications relative to current rainfall and humidity.

Keep units precise (kg/acre, g/L for sprays). Be authoritative, practical, and farmer-friendly."""


async def generate_gemini_recommendation(
    soil_data: Optional[Dict[str, Any]] = None,
    leaf_data: Optional[Dict[str, Any]] = None,
    crop_data: Optional[Dict[str, Any]] = None,
    weather_data: Optional[Dict[str, Any]] = None,
    montana_calc: Optional[Dict[str, Any]] = None,
    language: str = "en",
) -> Dict[str, Any]:
    """
    Generate an AI fertilizer prescription using Google Gemini.
    Falls back to structured offline agronomic engine if key is absent or network fails.
    """
    api_key = settings.gemini_api_key.strip()
    model = settings.gemini_model.strip() or "gemini-2.0-flash"

    # Assemble structured multimodal context
    context_payload = {
        "crop_context": crop_data or {},
        "soil_analysis": soil_data or {},
        "leaf_vision_diagnosis": leaf_data or {},
        "weather_conditions": weather_data or {},
        "montana_formula_calculations": montana_calc or {},
        "language": language,
    }

    prompt = f"""Synthesize the following farm data and generate a full Fertilizer & Crop Health Prescription:

=== 1. CROP INFORMATION ===
{json.dumps(context_payload['crop_context'], indent=2)}

=== 2. SOIL TEST ANALYSIS ===
{json.dumps(context_payload['soil_analysis'], indent=2)}

=== 3. LEAF VISION DIAGNOSIS (YOLOv11) ===
{json.dumps(context_payload['leaf_vision_diagnosis'], indent=2)}

=== 4. MONTANA FORMULA CALCULATIONS ===
{json.dumps(context_payload['montana_formula_calculations'], indent=2)}

=== 5. LIVE WEATHER ===
{json.dumps(context_payload['weather_conditions'], indent=2)}

Please provide a detailed, actionable fertilizer plan formatted cleanly with Markdown headers and bullet points."""

    # 1. Try Gemini API with candidate models
    if api_key:
        candidate_models = [
            model,
            "gemini-flash-lite-latest",
            "gemini-flash-latest",
            "gemini-3.5-flash",
            "gemini-pro-latest",
        ]
        # deduplicate while preserving order
        unique_models = []
        for m in candidate_models:
            if m and m not in unique_models:
                unique_models.append(m)

        for candidate in unique_models:
            try:
                url = f"{GEMINI_API_URL.format(model=candidate)}?key={api_key}"
                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                {"text": f"{AGRONOMIST_SYSTEM_PROMPT}\n\n{prompt}"}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.3,
                        "topP": 0.95,
                        "maxOutputTokens": 2048,
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
                                generated_text = parts[0].get("text", "")
                                return {
                                    "ai_prescription": generated_text,
                                    "source": "gemini",
                                    "model": candidate,
                                    "status": "success",
                                }
                    else:
                        logger.warning(f"[Gemini] Candidate {candidate} error HTTP {resp.status_code}: {resp.text[:200]}")
            except Exception as e:
                logger.warning(f"[Gemini] Candidate {candidate} failed: {e}")

    # 2. Fallback Rule-Based Multimodal Agronomic Generator
    return _generate_fallback_prescription(context_payload)


def _generate_fallback_prescription(context: Dict[str, Any]) -> Dict[str, Any]:
    """Offline rule-based fallback generating high-quality agronomic recommendations."""
    crop_ctx = context.get("crop_context", {})
    soil_ctx = context.get("soil_analysis", {})
    leaf_ctx = context.get("leaf_vision_diagnosis", {})
    montana = context.get("montana_formula_calculations", {})
    weather = context.get("weather_conditions", {})

    crop_name = crop_ctx.get("crop", "Target Crop").title()
    urea_kg = montana.get("urea_required_kg", 180)
    map_kg = montana.get("map_required_kg", 80)
    mop_kg = montana.get("mop_required_kg", 50)
    fert_n = montana.get("fertilizer_n_required", 80)

    disease = leaf_ctx.get("disease_label", "Healthy")
    deficiency = leaf_ctx.get("deficiency_type", "Healthy")
    ph = soil_ctx.get("ph", 6.5)

    prescription_lines = [
        f"### 🌾 Precision Fertilizer Plan for {crop_name}\n",
        f"**1. Core Mineral Fertilizer Doses (Montana Guidelines):**",
        f"- **Urea (46-0-0)**: **{urea_kg} kg/acre** (supplying {fert_n} lb Net Nitrogen)",
        f"- **MAP (11-52-0)**: **{map_kg} kg/acre** (Phosphorus source)",
        f"- **MOP (0-0-60)**: **{mop_kg} kg/acre** (Potassium source)\n",
        f"**2. Multimodal Diagnostic Synthesis:**",
    ]

    if disease != "Healthy" and "healthy" not in disease.lower():
        prescription_lines.append(f"- ⚠ **Disease Detected**: `{disease}`. To protect crop yield while applying nitrogen, avoid excessive early urea which creates lush succulent leaves vulnerable to spores.")
    else:
        prescription_lines.append("- ✓ **Crop Foliage**: No active fungal blight detected. Proceed with standard fertilization.")

    if deficiency != "Healthy" and "healthy" not in deficiency.lower():
        prescription_lines.append(f"- ⚠ **Visual Deficiency**: `{deficiency}` identified by YOLOv11 vision model. Complement soil application with a 2% foliar spray for rapid recovery.")
    else:
        prescription_lines.append("- ✓ **Nutrient Balance**: Leaf chlorophyll levels indicate healthy uptake.")

    if ph < 6.0:
        prescription_lines.append(f"- ⚠ **Acidic Soil (pH {ph})**: Phosphorus fixation risk. Apply Agricultural Lime @ 500 kg/acre prior to basal fertilization.")
    elif ph > 7.5:
        prescription_lines.append(f"- ⚠ **Alkaline Soil (pH {ph})**: Apply Gypsum @ 200 kg/acre to improve micronutrient bioavailability.")

    prescription_lines.extend([
        f"\n**3. Stage-Wise Application Schedule:**",
        f"1. **Basal (At Planting / Sowing)**: 50% Urea ({round(urea_kg*0.5, 1)} kg) + 100% MAP ({map_kg} kg) + 100% MOP ({mop_kg} kg) incorporated into top 15 cm soil.",
        f"2. **Vegetative / Tillering Stage (30 Days)**: 30% Urea ({round(urea_kg*0.3, 1)} kg) top-dressed in moist soil.",
        f"3. **Panicle / Flowering Stage (60 Days)**: Remaining 20% Urea ({round(urea_kg*0.2, 1)} kg) broadcast before panicle emergence.\n",
        f"**4. Organic Amendments & Soil Health:**",
        f"- Apply well-decomposed Farm Yard Manure (FYM) @ 2–3 tonnes/acre.",
        f"- Seed treatment with *Rhizobium* / *Azotobacter* and *Phosphorus Solubilizing Bacteria (PSB)* @ 250g/10kg seed.\n",
        f"**5. Weather & Safety Advisory:**",
    ])

    rain = weather.get("rainfall", 0)
    if rain > 5:
        prescription_lines.append(f"- 🌧 **Rainfall Forecast ({rain} mm)**: Delay broadcasting urea by 24–48 hours to avoid surface runoff leaching.")
    else:
        prescription_lines.append(f"- ☀ Apply fertilizers during early morning or late afternoon into moist soil.")

    return {
        "ai_prescription": "\n".join(prescription_lines),
        "source": "rule_based_engine",
        "model": "offline_agronomic_engine",
        "status": "fallback",
    }
