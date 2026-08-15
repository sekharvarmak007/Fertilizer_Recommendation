"""
Neo4j Knowledge Graph Client
Connects to local Neo4j Desktop instance.
Setup: https://neo4j.com/download/ → Neo4j Desktop → Create DB with password agrikg2024
"""
from app.config import settings

_driver = None


def get_driver():
    global _driver
    if _driver is None:
        try:
            from neo4j import GraphDatabase
            _driver = GraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password),
            )
            _driver.verify_connectivity()
            print(f"[Neo4j] Connected to {settings.neo4j_uri}")
        except Exception as e:
            print(f"[Neo4j] Connection failed: {e}. KG queries will use static fallback.")
            _driver = None
    return _driver


def query_fertilizer_for_crop(crop: str) -> list:
    """Get fertilizers recommended for a crop from KG."""
    driver = get_driver()
    if driver is None:
        return _static_fertilizer_lookup(crop)
    try:
        with driver.session() as session:
            result = session.run(
                """
                MATCH (c:Crop {name: $crop})-[:NEEDS]->(n:Nutrient)-[:RECOMMENDED_FERTILIZER]->(f:Fertilizer)
                RETURN n.name AS nutrient, f.name AS fertilizer, f.formula AS formula
                """,
                crop=crop.lower()
            )
            return [dict(r) for r in result]
    except Exception as e:
        print(f"[Neo4j] Query error: {e}")
        return _static_fertilizer_lookup(crop)


def query_treatment_for_disease(disease: str) -> dict:
    """Get treatment for a detected disease."""
    driver = get_driver()
    if driver is None:
        return _static_disease_lookup(disease)
    try:
        with driver.session() as session:
            result = session.run(
                """
                MATCH (d:Disease)-[:TREATED_BY]->(m:Medicine)
                WHERE toLower(d.name) CONTAINS toLower($disease)
                RETURN d.name AS disease, m.name AS medicine, m.dose AS dose
                LIMIT 1
                """,
                disease=disease
            )
            record = result.single()
            return dict(record) if record else _static_disease_lookup(disease)
    except Exception as e:
        print(f"[Neo4j] Query error: {e}")
        return _static_disease_lookup(disease)


def query_correction_for_deficiency(deficiency: str) -> dict:
    """Get fertilizer correction for a detected deficiency."""
    driver = get_driver()
    if driver is None:
        return _static_deficiency_lookup(deficiency)
    try:
        with driver.session() as session:
            result = session.run(
                """
                MATCH (d:Deficiency)-[:CORRECTED_BY]->(f:Fertilizer)
                WHERE toLower(d.name) CONTAINS toLower($deficiency)
                RETURN d.name AS deficiency, f.name AS fertilizer, f.dose AS dose
                LIMIT 1
                """,
                deficiency=deficiency
            )
            record = result.single()
            return dict(record) if record else _static_deficiency_lookup(deficiency)
    except Exception as e:
        print(f"[Neo4j] Query error: {e}")
        return _static_deficiency_lookup(deficiency)


# ── Static Fallbacks ──────────────────────────────────────

_CROP_FERT = {
    'rice':   [{'nutrient': 'Nitrogen', 'fertilizer': 'Urea', 'formula': '46-0-0'}, {'nutrient': 'Phosphorus', 'fertilizer': 'DAP', 'formula': '18-46-0'}],
    'wheat':  [{'nutrient': 'Nitrogen', 'fertilizer': 'Urea', 'formula': '46-0-0'}, {'nutrient': 'Phosphorus', 'fertilizer': 'SSP', 'formula': '0-16-0'}],
    'maize':  [{'nutrient': 'Nitrogen', 'fertilizer': 'Urea', 'formula': '46-0-0'}, {'nutrient': 'Potassium', 'fertilizer': 'MOP', 'formula': '0-0-60'}],
    'cotton': [{'nutrient': 'Nitrogen', 'fertilizer': 'DAP',  'formula': '18-46-0'}, {'nutrient': 'Potassium', 'fertilizer': 'MOP', 'formula': '0-0-60'}],
}

_DISEASE_TREATMENT = {
    'blight': {'disease': 'Blight', 'medicine': 'Mancozeb', 'dose': '2g/L water'},
    'spot':   {'disease': 'Leaf Spot', 'medicine': 'Copper Hydroxide', 'dose': '3g/L water'},
    'mildew': {'disease': 'Powdery Mildew', 'medicine': 'Sulfur fungicide', 'dose': '2g/L water'},
}

_DEFICIENCY_CORRECTION = {
    'nitrogen':   {'deficiency': 'Nitrogen', 'fertilizer': 'Urea', 'dose': '50 kg/acre'},
    'phosphorus': {'deficiency': 'Phosphorus', 'fertilizer': 'DAP', 'dose': '50 kg/acre'},
    'potassium':  {'deficiency': 'Potassium', 'fertilizer': 'MOP', 'dose': '25 kg/acre'},
}


def _static_fertilizer_lookup(crop):
    return _CROP_FERT.get(crop.lower(), _CROP_FERT.get('rice'))


def _static_disease_lookup(disease):
    for key, val in _DISEASE_TREATMENT.items():
        if key in disease.lower():
            return val
    return {'disease': disease, 'medicine': 'Broad-spectrum fungicide', 'dose': 'As per label'}


def _static_deficiency_lookup(deficiency):
    for key, val in _DEFICIENCY_CORRECTION.items():
        if key in deficiency.lower():
            return val
    return {'deficiency': deficiency, 'fertilizer': 'NPK Complex', 'dose': '50 kg/acre'}
