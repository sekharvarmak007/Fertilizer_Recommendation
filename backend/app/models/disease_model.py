"""
YOLOv11 Disease Detection Model Loader
Loads: ml_models/model-3 (PlantVillage disease detection)
"""
import numpy as np
from pathlib import Path
from app.config import settings

_disease_model = None

# PlantVillage disease classes (standard 38-class)
DISEASE_CLASSES = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Blueberry___healthy', 'Cherry___Powdery_mildew', 'Cherry___healthy',
    'Corn___Cercospora_leaf_spot', 'Corn___Common_rust', 'Corn___Northern_Leaf_Blight', 'Corn___healthy',
    'Grape___Black_rot', 'Grape___Esca', 'Grape___Leaf_blight', 'Grape___healthy',
    'Orange___Haunglongbing',
    'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper___Bacterial_spot', 'Pepper___healthy',
    'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
    'Raspberry___healthy', 'Soybean___healthy', 'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch', 'Strawberry___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
    'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites', 'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy',
]

SIMPLIFIED_NAMES = {c: c.replace('___', ' — ').replace('_', ' ') for c in DISEASE_CLASSES}

DISEASE_TREATMENTS = {
    'Early_blight': 'Apply Mancozeb (2g/L). Remove infected leaves. Avoid overhead irrigation.',
    'Late_blight': 'Apply Metalaxyl or Cymoxanil immediately. Remove infected plants.',
    'Leaf_Mold': 'Improve air circulation. Apply copper-based fungicide.',
    'Bacterial_spot': 'Apply Copper Hydroxide. Avoid working in wet fields.',
    'Powdery_mildew': 'Apply Sulfur-based fungicide or Neem oil (5ml/L).',
    'Black_rot': 'Apply Captan fungicide. Remove mummified fruits.',
    'healthy': 'Plant appears healthy. Continue regular monitoring and maintenance.',
    'default': 'Consult an agronomist. Apply broad-spectrum fungicide as precaution.',
}


def get_disease_model():
    global _disease_model
    if _disease_model is None:
        model_path = Path(settings.disease_model_path)
        if model_path.exists():
            try:
                from ultralytics import YOLO
                _disease_model = YOLO(str(model_path))
                print(f"[DiseaseModel] Loaded from {model_path}")
            except Exception as e:
                print(f"[DiseaseModel] Load error: {e}")
        else:
            print(f"[DiseaseModel] WARNING: Not found at {model_path}")
    return _disease_model


def predict_disease(image_path: str):
    """Run YOLOv11 disease detection on image."""
    model = get_disease_model()

    if model is None:
        return _unavailable_result("The plant disease model could not be loaded.")

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
                [{'label': SIMPLIFIED_NAMES.get(names[i], names[i]), 'confidence': float(probs[i])}
                 for i in range(len(probs))],
                key=lambda x: -x['confidence']
            )[:5]

            treatment_key = next((k for k in DISEASE_TREATMENTS if k.lower() in top_label.lower()), 'default')
            return {
                'disease_label': SIMPLIFIED_NAMES.get(top_label, top_label.replace('___', ' — ').replace('_', ' ')),
                'confidence': top_conf,
                'disease_classes': all_classes,
                'treatment': DISEASE_TREATMENTS.get(treatment_key, DISEASE_TREATMENTS['default']),
            }
    except Exception as e:
        print(f"[DiseaseModel] Inference error: {e}")
        return _unavailable_result("Plant disease inference failed for this image.")

    return _unavailable_result("The model did not return a classification for this image.")


def _unavailable_result(message: str):
    return {
        'error': True,
        'error_message': message,
        'disease_label': 'Not Available',
        'confidence': 0.0,
        'disease_classes': [],
        'treatment': 'No treatment was generated because the image was not classified.',
        'source': 'model_unavailable',
    }
