from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.models.fertilizer_model import predict_crop

router = APIRouter()


class CropInput(BaseModel):
    nitrogen: float = Field(..., ge=0, le=500)
    phosphorus: float = Field(..., ge=0, le=300)
    potassium: float = Field(..., ge=0, le=500)
    temperature: float = Field(..., ge=-10, le=60)
    humidity: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=0, le=14)
    rainfall: float = Field(..., ge=0, le=1000)


@router.post("/crop")
async def recommend_crop(data: CropInput):
    """Recommend top crops based on soil and climate parameters."""
    crops = predict_crop(
        data.nitrogen, data.phosphorus, data.potassium,
        data.temperature, data.humidity, data.ph, data.rainfall,
    )
    return {
        "recommended_crops": crops,
        "top_crop": crops[0]['crop'] if crops else None,
        "input": data.model_dump(),
    }
