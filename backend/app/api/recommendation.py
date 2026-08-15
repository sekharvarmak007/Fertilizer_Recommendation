from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Union
from app.models.fertilizer_model import predict_crop, CROP_FERTILIZER_MAP
from app.formulas.montana import run_montana_formulas
from app.services.gemini_service import generate_gemini_recommendation

router = APIRouter()


class RecommendationInput(BaseModel):
    # Soil parameters (flat or nested)
    nitrogen: float = 90.0
    phosphorus: float = 42.0
    potassium: float = 43.0
    ph: float = 6.5
    ec: float = 1.2
    organic_carbon: float = 0.91
    caco3: float = 4.5
    som: float = 1.8
    soil_depth: float = 12.0

    # Climate
    temperature: float = 25.5
    humidity: float = 80.4
    rainfall: float = 202.9

    # Multimodal Connected Session Objects (optional)
    crop: Optional[str] = None
    crop_suitability: Optional[float] = None
    previous_legume: Union[bool, str] = False
    legume_type: str = "none"
    residue_lb_per_acre: float = 0.0

    # Nested contextual data from prior modules
    soil_data: Optional[Dict[str, Any]] = None
    leaf_data: Optional[Dict[str, Any]] = None
    crop_data: Optional[Dict[str, Any]] = None
    weather_data: Optional[Dict[str, Any]] = None
    language: str = "en"


FERTILIZER_METHODS = {
    'rice':    'Broadcast and incorporate into soil before transplanting; top-dress at tillering',
    'wheat':   'Broadcast at sowing; top-dress at first node and boot stages',
    'maize':   'Band placement 5 cm below seed at sowing; side-dress at knee-high stage',
    'cotton':  'Apply in furrow at planting; top-dress at square and boll development stages',
    'sugarcane':'Apply in furrows at planting; top-dress at tillering and grand growth period',
    'default': 'Broadcast and incorporate into root zone (top 15 cm) before planting',
}

APPLICATION_SCHEDULES = {
    'rice': [
        {'timing': 'Basal (Before Transplanting)', 'action': 'Apply 50% Urea + 100% DAP/MAP + 100% MOP', 'days': 0},
        {'timing': 'Active Tillering (30 DAT)',    'action': 'Apply 30% Urea as top-dressing into moist soil', 'days': 30},
        {'timing': 'Panicle Initiation (60 DAT)',  'action': 'Apply remaining 20% Urea before heading', 'days': 60},
    ],
    'wheat': [
        {'timing': 'At Sowing (Basal)',            'action': 'Apply 50% Urea + 100% DAP/SSP + 100% MOP', 'days': 0},
        {'timing': 'Crown Root / 1st Node (40 DAS)','action': 'Apply 30% Urea after first irrigation', 'days': 40},
        {'timing': 'Boot Stage (75 DAS)',          'action': 'Apply remaining 20% Urea', 'days': 75},
    ],
    'maize': [
        {'timing': 'At Sowing (Basal)',            'action': 'Apply 33% Urea + 100% DAP/SSP + 100% MOP in bands', 'days': 0},
        {'timing': 'Knee-High Stage (30 DAS)',      'action': 'Side-dress 33% Urea 10 cm away from plant rows', 'days': 30},
        {'timing': 'Tasseling Stage (55 DAS)',     'action': 'Apply final 34% Urea top-dressing', 'days': 55},
    ],
    'default': [
        {'timing': 'Before Planting (Basal)',       'action': 'Apply 50% Urea + 100% Phosphorus + 100% Potassium', 'days': 0},
        {'timing': 'Vegetative Stage (30 Days)',    'action': 'Apply 30% Urea top-dressing', 'days': 30},
        {'timing': 'Reproductive Stage (60 Days)',  'action': 'Apply remaining 20% Urea', 'days': 60},
    ],
}


@router.post("/recommendation")
async def get_recommendation(data: RecommendationInput):
    """
    Multimodal Recommendation Endpoint:
    Combines Soil Chemical Analysis + Leaf Disease/Deficiency Scan + Crop Suitability +
    Montana State University Agronomic Formulas + Google Gemini AI Agronomist Prescription.
    """
    # 1. Extract and normalize soil metrics
    n = data.nitrogen
    p = data.phosphorus
    k = data.potassium
    ph = data.ph
    som = data.som
    soil_depth = data.soil_depth

    if data.soil_data:
        s_input = data.soil_data.get('input', data.soil_data)
        n = float(s_input.get('nitrogen', n))
        p = float(s_input.get('phosphorus', p))
        k = float(s_input.get('potassium', k))
        ph = float(s_input.get('ph', ph))
        som = float(s_input.get('som', som))
        soil_depth = float(s_input.get('soil_depth', soil_depth))

    # 2. Determine target crop
    crop = None
    crop_suitability = 0.90

    if data.crop:
        crop = data.crop.lower()
        crop_suitability = data.crop_suitability or 1.0
    elif data.crop_data and data.crop_data.get('selected_crop'):
        crop = data.crop_data['selected_crop'].lower()
    elif data.crop_data and data.crop_data.get('recommended_crops'):
        top = data.crop_data['recommended_crops'][0]
        crop = top.get('crop', 'rice').lower()
        crop_suitability = top.get('suitability', 0.90)
    else:
        crops = predict_crop(
            n, p, k, data.temperature, data.humidity, ph, data.rainfall,
        )
        crop = crops[0]['crop'] if crops else 'rice'
        crop_suitability = crops[0]['suitability'] if crops else 0.85

    # 3. Compute Montana Agronomic Formulas
    montana = run_montana_formulas(
        crop=crop,
        no3_n_ppm=n,
        soil_depth_inches=soil_depth,
        som_percent=som,
        previous_legume=data.previous_legume,
        legume_type=data.legume_type,
        residue_lb_per_acre=data.residue_lb_per_acre,
        p_ppm=p,
        k_ppm=k,
    )

    montana_summary = {
        "total_n_required": montana.total_n_required,
        "soil_available_n": montana.soil_available_n,
        "som_adjustment": montana.som_adjustment,
        "legume_credit": montana.legume_credit,
        "fertilizer_n_required": montana.fertilizer_n_required,
        "urea_required_kg": montana.urea_required_kg,
        "map_required_kg": montana.map_required_kg,
        "mop_required_kg": montana.mop_required_kg,
        "steps": montana.steps,
    }

    # 4. Standard Crop Information
    crop_info = CROP_FERTILIZER_MAP.get(crop, CROP_FERTILIZER_MAP['default'])
    method = FERTILIZER_METHODS.get(crop, FERTILIZER_METHODS['default'])
    schedule = APPLICATION_SCHEDULES.get(crop, APPLICATION_SCHEDULES['default'])

    # 5. Multimodal Aggregation for Gemini
    crop_context = {
        "crop": crop.title(),
        "suitability": crop_suitability,
        "season": crop_info['season'],
        "temperature_c": data.temperature,
        "humidity_pct": data.humidity,
        "rainfall_mm": data.rainfall,
    }

    soil_context = data.soil_data or {
        "nitrogen_ppm": n,
        "phosphorus_ppm": p,
        "potassium_ppm": k,
        "ph": ph,
        "som_pct": som,
        "soil_depth_in": soil_depth,
    }

    leaf_context = data.leaf_data or {
        "disease_label": "Healthy",
        "deficiency_type": "Healthy",
    }

    weather_context = data.weather_data or {
        "temperature": data.temperature,
        "humidity": data.humidity,
        "rainfall": data.rainfall,
    }

    # 6. Invoke Google Gemini Service
    ai_result = await generate_gemini_recommendation(
        soil_data=soil_context,
        leaf_data=leaf_context,
        crop_data=crop_context,
        weather_data=weather_context,
        montana_calc=montana_summary,
        language=data.language,
    )

    return {
        "crop": crop.title(),
        "crop_suitability": round(crop_suitability, 4),
        "fertilizer": crop_info['fertilizer'],
        "quantity_kg_per_acre": montana.urea_required_kg,
        "application_method": method,
        "application_time": schedule[0]['action'],
        "season": crop_info['season'],
        "schedule": schedule,
        "montana_breakdown": {
            "total_n_required": montana.total_n_required,
            "soil_available_n": montana.soil_available_n,
            "som_adjustment": montana.som_adjustment,
            "legume_credit": montana.legume_credit,
            "fertilizer_n_required": montana.fertilizer_n_required,
            "urea_required": montana.urea_required_kg,
            "phosphorus_map": montana.map_required_kg,
            "potassium_mop": montana.mop_required_kg,
        },
        "nutrient_plan": {
            "nitrogen":   {"required": montana.total_n_required, "available": montana.soil_available_n, "source": "Urea (46-0-0)"},
            "phosphorus": {"required": montana.p2o5_required,     "available": round(p / 3.5, 1),        "source": "MAP (11-52-0)"},
            "potassium":  {"required": montana.k2o_required,      "available": round(k / 3.0, 1),        "source": "MOP (0-0-60)"},
        },
        "formula_steps": montana.steps,
        # Gemini AI Fields
        "ai_prescription": ai_result.get("ai_prescription", ""),
        "ai_source": ai_result.get("source", "gemini"),
        "ai_model": ai_result.get("model", "gemini-2.0-flash"),
        "multimodal_inputs_used": {
            "soil_loaded": bool(data.soil_data or n != 90.0),
            "leaf_loaded": bool(data.leaf_data and (data.leaf_data.get('disease_label') != 'Healthy' or data.leaf_data.get('deficiency_type') != 'Healthy')),
            "crop_selected": crop.title(),
            "weather_loaded": bool(data.weather_data or data.rainfall > 0),
        }
    }
