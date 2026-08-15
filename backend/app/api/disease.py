import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from app.config import settings
from app.models.disease_model import predict_disease

router = APIRouter()


@router.post("/disease")
async def detect_disease(file: UploadFile = File(...)):
    """Detect plant disease from uploaded leaf image using YOLOv11 model-3."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Save uploaded file
    ext = Path(file.filename).suffix or ".jpg"
    filename = f"disease_{uuid.uuid4().hex}{ext}"
    upload_path = Path(settings.upload_dir) / filename

    content = await file.read()
    if len(content) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large (max {settings.max_file_size_mb}MB)")

    with open(upload_path, "wb") as f:
        f.write(content)

    try:
        result = predict_disease(str(upload_path))
        result["image_url"] = f"/uploads/{filename}"
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Optionally clean up after inference
        pass
