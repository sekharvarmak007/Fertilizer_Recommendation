from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from app.models.soil_model import predict_soil_fertility
from app.formulas.montana import calculate_soil_available_n

router = APIRouter()


class SoilInput(BaseModel):
    nitrogen: float = Field(..., ge=0, le=500, description="Nitrogen in ppm")
    phosphorus: float = Field(..., ge=0, le=300, description="Phosphorus in ppm")
    potassium: float = Field(..., ge=0, le=500, description="Potassium in ppm")
    ph: float = Field(..., ge=0, le=14, description="Soil pH")
    ec: float = Field(..., ge=0, le=20, description="Electrical Conductivity dS/m")
    organic_carbon: float = Field(..., ge=0, le=10, description="Organic Carbon %")
    caco3: float = Field(default=5.0, ge=0, le=50, description="CaCO3 %")
    som: float = Field(default=1.8, ge=0, le=15, description="Soil Organic Matter %")
    soil_depth: float = Field(default=12.0, ge=1, le=60, description="Soil depth in inches")


def _get_nutrient_status(n, p, k, ph, ec, oc):
    return {
        "nitrogen":        "Optimal" if 60 <= n <= 140 else ("Low" if n < 60 else "High"),
        "phosphorus":      "Optimal" if 20 <= p <= 60 else ("Low" if p < 20 else "High"),
        "potassium":       "Optimal" if 50 <= k <= 150 else ("Low" if k < 50 else "High"),
        "ph":              "Optimal" if 6.0 <= ph <= 7.5 else ("Acidic" if ph < 6.0 else "Alkaline"),
        "ec":              "Normal" if ec <= 4.0 else "High Salinity",
        "organic_carbon":  "Adequate" if oc >= 0.5 else "Low",
    }


def _generate_recommendations(nutrient_status, fertility_class):
    recs = []
    if nutrient_status['nitrogen'] == 'Low':
        recs.append("Apply Urea (46-0-0) @ 50 kg/acre to correct nitrogen deficiency")
    if nutrient_status['phosphorus'] == 'Low':
        recs.append("Apply DAP (18-46-0) @ 50 kg/acre for phosphorus correction")
    if nutrient_status['potassium'] == 'Low':
        recs.append("Apply MOP (0-0-60) @ 25 kg/acre for potassium correction")
    if nutrient_status['ph'] == 'Acidic':
        recs.append("Apply Agricultural Lime @ 500 kg/acre to raise pH")
    if nutrient_status['ph'] == 'Alkaline':
        recs.append("Apply Gypsum or Sulfur @ 200 kg/acre to lower pH")
    if nutrient_status['ec'] == 'High Salinity':
        recs.append("Leach soil with irrigation. Consider drainage improvement")
    if nutrient_status['organic_carbon'] == 'Low':
        recs.append("Add organic compost @ 2-3 tonnes/acre to improve OC")
    if not recs:
        recs.append("Soil is in good condition. Maintain with regular testing")
    return recs


@router.post("/soil")
async def analyze_soil(data: SoilInput):
    """Predict soil fertility class using XGBoost model."""
    fertility_class, confidence = predict_soil_fertility(
        data.nitrogen, data.phosphorus, data.potassium,
        data.ph, data.ec, data.organic_carbon, data.caco3,
    )

    nutrient_status = _get_nutrient_status(
        data.nitrogen, data.phosphorus, data.potassium,
        data.ph, data.ec, data.organic_carbon,
    )

    montana_n_available = calculate_soil_available_n(data.nitrogen, data.soil_depth)

    return {
        "fertility_class": fertility_class,
        "confidence": round(confidence, 4),
        "nutrient_status": nutrient_status,
        "montana_n_available": montana_n_available,
        "input": data.model_dump(),
        "recommendations": _generate_recommendations(nutrient_status, fertility_class),
    }
