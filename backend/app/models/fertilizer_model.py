"""
Fertilizer/Crop Recommendation Model Loader
Loads: ml_models/fertilizer_model.pkl
"""
import joblib
import numpy as np
from pathlib import Path
from app.config import settings

_fert_model = None

CROP_LABEL_MAP = {
    0: 'rice', 1: 'maize', 2: 'chickpea', 3: 'kidneybeans', 4: 'pigeonpeas',
    5: 'mothbeans', 6: 'mungbean', 7: 'blackgram', 8: 'lentil', 9: 'pomegranate',
    10: 'banana', 11: 'mango', 12: 'grapes', 13: 'watermelon', 14: 'muskmelon',
    15: 'apple', 16: 'orange', 17: 'papaya', 18: 'coconut', 19: 'cotton',
    20: 'jute', 21: 'coffee', 22: 'wheat', 23: 'sugarcane',
}

CROP_FERTILIZER_MAP = {
    'rice':       {'fertilizer': 'Urea + DAP', 'season': 'Kharif', 'n': 120, 'p': 60, 'k': 40},
    'wheat':      {'fertilizer': 'Urea + SSP', 'season': 'Rabi',   'n': 120, 'p': 60, 'k': 40},
    'maize':      {'fertilizer': 'NPK 20-20-0','season': 'Kharif', 'n': 150, 'p': 75, 'k': 50},
    'cotton':     {'fertilizer': 'DAP + MOP',  'season': 'Kharif', 'n': 100, 'p': 50, 'k': 50},
    'sugarcane':  {'fertilizer': 'Urea + MOP', 'season': 'Kharif', 'n': 200, 'p': 80, 'k': 100},
    'chickpea':   {'fertilizer': 'DAP',        'season': 'Rabi',   'n': 20,  'p': 40, 'k': 20},
    'kidneybeans':{'fertilizer': 'DAP + MOP',  'season': 'Kharif', 'n': 25,  'p': 50, 'k': 25},
    'banana':     {'fertilizer': 'NPK 12-12-17','season': 'Annual','n': 200, 'p': 60, 'k': 300},
    'mango':      {'fertilizer': 'NPK 10-26-26','season': 'Annual','n': 100, 'p': 50, 'k': 100},
    'coffee':     {'fertilizer': 'NPK 17-8-12', 'season': 'Annual','n': 100, 'p': 50, 'k': 80},
    'default':    {'fertilizer': 'NPK Complex', 'season': 'Kharif','n': 100, 'p': 50, 'k': 50},
}


def get_fert_model():
    global _fert_model
    if _fert_model is None:
        path = Path(settings.fertilizer_model_path)
        if path.exists() and path.stat().st_size > 0:
            try:
                _fert_model = joblib.load(path)
                print(f"[FertModel] Loaded from {path}")
            except Exception as e:
                print(f"[FertModel] Error loading model: {e}")
                _fert_model = None
        else:
            print(f"[FertModel] WARNING: Model not found or empty at {path}. Using mock predictions.")
    return _fert_model


def predict_crop(n, p, k, temperature, humidity, ph, rainfall):
    """Return top crop recommendations with suitability scores."""
    model = get_fert_model()
    features = np.array([[n, p, k, temperature, humidity, ph, rainfall]])

    if model is None:
        # Heuristic mock
        crops = []
        if ph >= 5.5 and ph <= 7.5 and rainfall > 150:
            crops.append(('rice', 0.92))
        if temperature < 25 and rainfall < 100:
            crops.append(('wheat', 0.87))
        crops.append(('maize', 0.78))
        crops.append(('cotton', 0.65))
        if not crops:
            crops = [('rice', 0.80), ('wheat', 0.70), ('maize', 0.60)]
        crops = sorted(crops, key=lambda x: -x[1])[:4]
    else:
        try:
            if hasattr(model, 'predict_proba'):
                proba = model.predict_proba(features)[0]
                top_idx = np.argsort(proba)[::-1][:4]
                crops = [(CROP_LABEL_MAP.get(i, f'crop_{i}'), float(proba[i])) for i in top_idx]
            else:
                pred = model.predict(features)[0]
                crop_name = CROP_LABEL_MAP.get(int(pred), str(pred))
                crops = [(crop_name, 0.92), ('maize', 0.75), ('wheat', 0.68), ('cotton', 0.55)]
        except Exception as e:
            print(f"[FertModel] Error: {e}")
            crops = [('rice', 0.85), ('maize', 0.72), ('wheat', 0.65), ('cotton', 0.58)]

    results = []
    for crop_name, score in crops:
        info = CROP_FERTILIZER_MAP.get(crop_name, CROP_FERTILIZER_MAP['default'])
        results.append({
            'crop': crop_name,
            'suitability': round(score, 4),
            'fertilizer': info['fertilizer'],
            'season': info['season'],
        })

    return results
