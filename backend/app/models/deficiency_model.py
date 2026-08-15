"""
YOLOv11 Nutrient Deficiency Detection Model Loader
Loads: ml_models/model-4
"""
import numpy as np
from pathlib import Path
from app.config import settings

_deficiency_model = None

DEFICIENCY_CLASSES = ['Healthy', 'Nitrogen Deficiency', 'Phosphorus Deficiency', 'Potassium Deficiency']

DEFICIENCY_CORRECTIONS = {
    'Healthy': {
        'advice': 'Plant appears healthy. No nutrient correction required.',
        'fertilizer': None, 'dose_kg_per_acre': None,
    },
    'Nitrogen Deficiency': {
        'advice': 'Apply Urea (46-0-0) at 50 kg/acre. Consider foliar spray: 2% urea solution. Apply in early morning.',
        'fertilizer': 'Urea (46-0-0)', 'dose_kg_per_acre': 50,
    },
    'Phosphorus Deficiency': {
        'advice': 'Apply DAP (18-46-0) at 50 kg/acre or Single Super Phosphate (SSP) at 100 kg/acre.',
        'fertilizer': 'DAP (18-46-0)', 'dose_kg_per_acre': 50,
    },
    'Potassium Deficiency': {
        'advice': 'Apply Muriate of Potash (MOP 0-0-60) at 25 kg/acre or Potassium Sulphate (SOP) at 30 kg/acre.',
        'fertilizer': 'MOP (0-0-60)', 'dose_kg_per_acre': 25,
    },
}


def get_deficiency_model():
    global _deficiency_model
    if _deficiency_model is None:
        model_path = Path(settings.deficiency_model_path)
        if model_path.exists():
            try:
                from ultralytics import YOLO
                _deficiency_model = YOLO(str(model_path))
                print(f"[DeficiencyModel] Loaded from {model_path}")
            except Exception as e:
                print(f"[DeficiencyModel] Load error: {e}")
        else:
            print(f"[DeficiencyModel] WARNING: Not found at {model_path}. Using mock.")
    return _deficiency_model


def predict_deficiency(image_path: str):
    """Run YOLOv11 deficiency detection on image."""
    model = get_deficiency_model()

    if model is None:
        return _mock_deficiency_result()

    try:
        results = model(image_path, verbose=False)
        result = results[0]

        if hasattr(result, 'probs') and result.probs is not None:
            probs = result.probs.data.cpu().numpy()
            names = result.names
            top_idx = int(np.argmax(probs))
            top_label = names[top_idx]
            top_conf = float(probs[top_idx])

            all_classes = sorted(
                [{'label': names[i], 'confidence': float(probs[i])}
                 for i in range(len(probs))],
                key=lambda x: -x['confidence']
            )[:4]

            correction_key = top_label
            for k in DEFICIENCY_CORRECTIONS:
                if (k.split()[0].lower() in top_label.lower()) or (top_label.lower().startswith(k.lower()[:3])):
                    correction_key = k
                    break

            correction = DEFICIENCY_CORRECTIONS.get(correction_key, DEFICIENCY_CORRECTIONS['Nitrogen Deficiency'])
            return {
                'deficiency_type': top_label,
                'confidence': round(top_conf, 4),
                'deficiency_classes': all_classes,
                **correction,
            }
    except Exception as e:
        print(f"[DeficiencyModel] Inference error: {e}")

    return _mock_deficiency_result()


def _mock_deficiency_result():
    correction = DEFICIENCY_CORRECTIONS['Nitrogen Deficiency']
    return {
        'deficiency_type': 'Nitrogen Deficiency',
        'confidence': 0.92,
        'deficiency_classes': [
            {'label': 'Nitrogen Deficiency',   'confidence': 0.92},
            {'label': 'Phosphorus Deficiency', 'confidence': 0.05},
            {'label': 'Healthy',               'confidence': 0.03},
        ],
        **correction,
        'note': 'Demo result — model not loaded'
    }
