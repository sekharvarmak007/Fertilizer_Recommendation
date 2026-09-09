import urllib.request, json

BASE = "http://127.0.0.1:8000"

body = {
    "nitrogen": 30,
    "phosphorus": 40,
    "potassium": 180,
    "ph": 6.5,
    "ec": 1.2,
    "organic_carbon": 0.91,
    "som": 1.8,
    "soil_depth": 12,
    "temperature": 28,
    "humidity": 85,
    "rainfall": 25,
    "crop": "rice",
    "previous_legume": True,
    "legume_type": "soybean",
    "residue_lb_per_acre": 0,
    "leaf_data": {
        "disease_label": "Healthy",
        "deficiency_type": "Nitrogen Deficiency",
        "confidence": 0.93
    },
    "weather_data": {
        "temperature": 28,
        "humidity": 85,
        "rainfall": 25,
        "description": "Rain Expected"
    },
    "language": "en"
}

data = json.dumps(body).encode()
req = urllib.request.Request(BASE + "/recommendation", data=data, headers={"Content-Type": "application/json"}, method="POST")

try:
    with urllib.request.urlopen(req, timeout=120) as r:
        result = json.loads(r.read())

    print("=" * 60)
    print("  AGRISENSE AI - LIVE SCENARIO TEST REPORT")
    print("=" * 60)

    print("\n--- CROP ---")
    print("  Crop:           ", result.get("crop"))
    print("  Suitability:    ", result.get("crop_suitability"))
    print("  Season:         ", result.get("season"))

    print("\n--- MONTANA FORMULA BREAKDOWN ---")
    mb = result.get("montana_breakdown", {})
    print("  Total N Required:  ", mb.get("total_n_required"), "lb/acre")
    print("  Soil Available N:  ", mb.get("soil_available_n"), "lb/acre")
    print("  SOM Adjustment:    ", mb.get("som_adjustment"), "lb/acre")
    print("  Legume Credit:     ", mb.get("legume_credit"), "lb/acre")
    print("  Fertilizer N Need: ", mb.get("fertilizer_n_required"), "lb/acre")
    print("  ---------------------")
    print("  UREA Required:     ", mb.get("urea_required"), "kg/acre")
    print("  MAP (Phosphorus):  ", mb.get("phosphorus_map"), "kg/acre")
    print("  MOP (Potassium):   ", mb.get("potassium_mop"), "kg/acre")

    print("\n--- FERTILIZER RECOMMENDATION ---")
    print("  Fertilizer:     ", result.get("fertilizer"))
    print("  Quantity:       ", result.get("quantity_kg_per_acre"), "kg/acre")
    print("  Method:         ", result.get("application_method"))
    print("  First Action:   ", result.get("application_time"))

    print("\n--- NUTRIENT PLAN ---")
    np_data = result.get("nutrient_plan", {})
    for nutrient, info in np_data.items():
        req_val = str(info["required"]).ljust(8)
        avail_val = str(info["available"]).ljust(8)
        print(f"  {nutrient.upper():12s}  Required: {req_val}  Available: {avail_val}  Source: {info['source']}")

    print("\n--- APPLICATION SCHEDULE ---")
    for s in result.get("schedule", []):
        print(f"  Day {s['days']:3d}: {s['timing']}")
        print(f"          {s['action']}")

    print("\n--- FORMULA STEPS (Montana) ---")
    for step in result.get("formula_steps", []):
        print(f"  Step {step['step']}: {step['name']}")
        print(f"         {step['formula']}")
        print(f"         = {step['result']}")

    print("\n--- MULTIMODAL INPUTS USED ---")
    mi = result.get("multimodal_inputs_used", {})
    print("  Soil Loaded:    ", mi.get("soil_loaded"))
    print("  Leaf Loaded:    ", mi.get("leaf_loaded"))
    print("  Crop Selected:  ", mi.get("crop_selected"))
    print("  Weather Loaded: ", mi.get("weather_loaded"))

    print("\n--- AI ENGINE ---")
    print("  Source:         ", result.get("ai_source"))
    print("  Model:          ", result.get("ai_model"))

    print("\n--- GEMINI AI PRESCRIPTION ---")
    ai_text = result.get("ai_prescription", "")
    if ai_text:
        print(ai_text[:2500])
    else:
        print("  (EMPTY - AI did not respond)")

    print("\n" + "=" * 60)
    print("  TEST COMPLETE")
    print("=" * 60)

except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print(e.read().decode()[:2000])
except Exception as e:
    print("EXCEPTION:", type(e).__name__, str(e))
