import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from app.config import settings
from app.services.gemini_service import analyze_leaf_disease_with_gemini

router = APIRouter()


@router.post("/disease")
async def detect_disease(file: UploadFile = File(...)):
    """
    Detect plant disease from uploaded leaf image using Gemini Vision AI.
    Analyzes ANY plant species and returns detailed disease diagnosis.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPG, PNG, WEBP)")

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
        # Use Gemini Vision AI for real disease detection
        result = await analyze_leaf_disease_with_gemini(str(upload_path))
        result["image_url"] = f"/uploads/{filename}"

        # Build backward-compatible fields so frontend works
        result["disease_label"] = result.get("disease_name", "Unknown")
        result["confidence"] = result.get("confidence", 0.0)

        # Map top_alternatives → disease_classes for frontend compatibility
        top_alts = result.get("top_alternatives", [])
        result["disease_classes"] = [
            {"label": alt.get("label", ""), "confidence": alt.get("confidence", 0.0)}
            for alt in top_alts
        ]

        # Add the main disease as the first entry if not present
        main_label = result["disease_label"]
        if not any(d["label"] == main_label for d in result["disease_classes"]):
            result["disease_classes"].insert(0, {
                "label": main_label,
                "confidence": result["confidence"]
            })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        pass
