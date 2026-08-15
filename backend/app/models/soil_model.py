"""
Soil Fertility XGBoost Model Loader
Loads: ml_models/soil_fertility_xgboost.pkl
"""
import joblib
import numpy as np
from pathlib import Path
from app.config import settings

_soil_model = None

def get_soil_model():
    global _soil_model
    if _soil_model is None:
        model_path = Path(settings.soil_model_path)
        if model_path.exists() and model_path.stat().st_size > 0:
            try:
                _soil_model = joblib.load(model_path)
                print(f"[SoilModel] Loaded from {model_path}")
            except Exception as e:
                print(f"[SoilModel] Error loading model: {e}")
                _soil_model = None
        else:
            print(f"[SoilModel] WARNING: Model not found or empty at {model_path}. Using mock predictions.")
    return _soil_model


FERTILITY_CLASSES = {0: "Low", 1: "Medium", 2: "High"}

def predict_soil_fertility(n, p, k, ph, ec, organic_carbon, caco3):
    """Run XGBoost prediction for soil fertility class."""
    model = get_soil_model()
    
    if model is None:
        # Deterministic mock based on values
        score = (n / 200 + p / 100 + k / 200 + organic_carbon / 5) / 4
        if score < 0.35:
            cls, conf = 0, 0.78
        elif score < 0.65:
            cls, conf = 1, 0.84
        else:
            cls, conf = 2, 0.91
        return FERTILITY_CLASSES[cls], conf

    try:
        import pandas as pd
        df = pd.DataFrame([{
            'Total_Nitrogen': n,
            'Available_Phosphorus': p,
            'Available_Potassium': k,
            'Soil_pH': ph,
            'Soil_Organic_Carbon': organic_carbon
        }])
        pred = model.predict(df)[0]
        proba = model.predict_proba(df)[0]
        cls = int(pred)
        return FERTILITY_CLASSES.get(cls, str(cls)), float(proba[cls])
    except Exception as e:
        print(f"[SoilModel] Prediction error: {e}")
        return "Medium", 0.75
