from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()

# ────────────────────────────────────────────────────────────────
# Comprehensive Knowledge Graph Node & Link Data
# Mirrors the Neo4j schema; used as static fallback when Neo4j is
# not connected (and also served to the frontend visualization)
# ────────────────────────────────────────────────────────────────

KG_NODES = [
    # ── Crops ────────────────────────────────────────────────────
    {
        "id": "rice", "label": "Rice", "type": "crop", "color": "#00d97e", "size": 16,
        "details": {
            "scientific": "Oryza sativa",
            "season": "Kharif (Rainy)",
            "duration": "90–150 days",
            "water_req": "High (1200–2000 mm)",
            "soil_type": "Clayey / Loamy",
            "n_req": "High", "p_req": "Medium", "k_req": "Medium",
            "diseases": ["Leaf Spot", "Bacterial Blight", "Sheath Blight"],
            "description": "Staple cereal crop grown in flooded paddy fields. Requires heavy nitrogen fertilization especially at tillering stage.",
        }
    },
    {
        "id": "wheat", "label": "Wheat", "type": "crop", "color": "#00d97e", "size": 16,
        "details": {
            "scientific": "Triticum aestivum",
            "season": "Rabi (Winter)",
            "duration": "100–130 days",
            "water_req": "Moderate (450–650 mm)",
            "soil_type": "Loamy / Sandy Loam",
            "n_req": "High", "p_req": "High", "k_req": "Low",
            "diseases": ["Powdery Mildew", "Rust", "Smut"],
            "description": "Winter cereal crop. Responds well to N and P fertilization. Basal phosphorus application is critical.",
        }
    },
    {
        "id": "maize", "label": "Maize", "type": "crop", "color": "#00d97e", "size": 16,
        "details": {
            "scientific": "Zea mays",
            "season": "Kharif / Rabi",
            "duration": "85–110 days",
            "water_req": "Moderate (500–800 mm)",
            "soil_type": "Well-drained Loam",
            "n_req": "High", "p_req": "Medium", "k_req": "Medium",
            "diseases": ["Early Blight", "Stalk Rot", "Downy Mildew"],
            "description": "High-yield cereal. Heavy nitrogen feeder at knee-high stage. Responds to split nitrogen application.",
        }
    },
    {
        "id": "cotton", "label": "Cotton", "type": "crop", "color": "#00d97e", "size": 16,
        "details": {
            "scientific": "Gossypium hirsutum",
            "season": "Kharif",
            "duration": "150–180 days",
            "water_req": "Moderate (700–1300 mm)",
            "soil_type": "Black Cotton Soil",
            "n_req": "High", "p_req": "Medium", "k_req": "High",
            "diseases": ["Bacterial Blight", "Verticillium Wilt", "Leaf Curl Virus"],
            "description": "Cash crop requiring balanced NPK. Potassium strengthens fiber quality and disease resistance.",
        }
    },
    {
        "id": "sugarcane", "label": "Sugarcane", "type": "crop", "color": "#00d97e", "size": 15,
        "details": {
            "scientific": "Saccharum officinarum",
            "season": "Year-round",
            "duration": "10–18 months",
            "water_req": "Very High (1500–2500 mm)",
            "soil_type": "Deep Loamy",
            "n_req": "Very High", "p_req": "Medium", "k_req": "High",
            "diseases": ["Red Rot", "Ratoon Stunting", "Smut"],
            "description": "Long-duration crop. Requires very high N through split doses. Potassium improves sucrose content.",
        }
    },
    {
        "id": "groundnut", "label": "Groundnut", "type": "crop", "color": "#00d97e", "size": 14,
        "details": {
            "scientific": "Arachis hypogaea",
            "season": "Kharif",
            "duration": "90–130 days",
            "water_req": "Low–Moderate (500–700 mm)",
            "soil_type": "Sandy Loam",
            "n_req": "Low (fixes N2)", "p_req": "High", "k_req": "Medium",
            "diseases": ["Tikka Leaf Spot", "Rust", "Collar Rot"],
            "description": "Legume that fixes atmospheric nitrogen. Phosphorus and gypsum are key inputs for pod development.",
        }
    },

    # ── Nutrients ─────────────────────────────────────────────────
    {
        "id": "nitrogen", "label": "Nitrogen (N)", "type": "nutrient", "color": "#3b82f6", "size": 14,
        "details": {
            "symbol": "N", "atomic_number": 7,
            "soil_optimal_ppm": "280–560 kg/ha",
            "deficiency_symptom": "Chlorosis (yellowing) of older leaves, stunted growth",
            "toxicity_symptom": "Excessive vegetative growth, lodging, delayed maturity",
            "mobility": "Mobile",
            "function": "Essential for chlorophyll, amino acids, proteins, and nucleic acids",
            "soil_forms": ["Nitrate (NO3-)", "Ammonium (NH4+)", "Organic N"],
            "description": "Primary macronutrient. Controls leaf area development and photosynthesis rate.",
        }
    },
    {
        "id": "phosphorus", "label": "Phosphorus (P)", "type": "nutrient", "color": "#3b82f6", "size": 14,
        "details": {
            "symbol": "P", "atomic_number": 15,
            "soil_optimal_ppm": "22–55 kg/ha (available P2O5)",
            "deficiency_symptom": "Purple/reddish coloration of leaves and stems",
            "toxicity_symptom": "Zinc and iron deficiency due to antagonism",
            "mobility": "Immobile",
            "function": "Energy transfer (ATP), root development, seed formation",
            "soil_forms": ["H2PO4-", "HPO4²-"],
            "description": "Key for root growth and early plant establishment. Applied as basal dose before sowing.",
        }
    },
    {
        "id": "potassium", "label": "Potassium (K)", "type": "nutrient", "color": "#3b82f6", "size": 14,
        "details": {
            "symbol": "K", "atomic_number": 19,
            "soil_optimal_ppm": "120–280 kg/ha",
            "deficiency_symptom": "Brown scorching and curling of leaf tips, weak stalks",
            "toxicity_symptom": "Rare; can cause Mg and Ca deficiency",
            "mobility": "Mobile",
            "function": "Enzyme activation, water regulation, disease resistance",
            "soil_forms": ["K+ (exchangeable)", "K+ in soil solution"],
            "description": "Regulates osmosis, strengthens cell walls, improves drought tolerance and grain quality.",
        }
    },

    # ── Fertilizers ───────────────────────────────────────────────
    {
        "id": "urea", "label": "Urea", "type": "fertilizer", "color": "#f59e0b", "size": 13,
        "details": {
            "formula": "CO(NH2)2", "npk": "46-0-0",
            "n_content": "46%", "form": "Granular / Prilled",
            "application": "Top-dressing, fertigation",
            "dose_rice": "120 kg N/ha (split: basal+tillering+panicle)",
            "dose_wheat": "120 kg N/ha (split: basal+crown root)",
            "caution": "Apply only in moist soil. Do not apply before heavy rain to avoid leaching.",
            "cost": "₹270–310/bag (50 kg)",
            "description": "Most commonly used nitrogen fertilizer in India. Hydrolizes to ammonium in soil.",
        }
    },
    {
        "id": "dap", "label": "DAP", "type": "fertilizer", "color": "#f59e0b", "size": 13,
        "details": {
            "formula": "Diammonium Phosphate", "npk": "18-46-0",
            "n_content": "18%", "p_content": "46% P2O5", "form": "Granular",
            "application": "Basal dose at sowing",
            "dose_general": "100–125 kg/ha depending on crop P requirement",
            "caution": "Avoid mixing with basic fertilizers like urea without proper interval.",
            "cost": "₹1,350–1,500/bag (50 kg)",
            "description": "Primary phosphate fertilizer. Also supplies nitrogen. Ideal basal application for most crops.",
        }
    },
    {
        "id": "mop", "label": "MOP", "type": "fertilizer", "color": "#f59e0b", "size": 13,
        "details": {
            "formula": "KCl (Muriate of Potash)", "npk": "0-0-60",
            "k_content": "60% K2O", "form": "Granular / Crystalline",
            "application": "Basal or split application",
            "dose_general": "40–60 kg K2O/ha",
            "caution": "Avoid in salt-sensitive crops and in high EC soils.",
            "cost": "₹1,200–1,400/bag (50 kg)",
            "description": "Primary potassium source. Improves crop quality, disease resistance, and water efficiency.",
        }
    },
    {
        "id": "ssp", "label": "SSP", "type": "fertilizer", "color": "#f59e0b", "size": 12,
        "details": {
            "formula": "Single Superphosphate", "npk": "0-16-0",
            "p_content": "16% P2O5", "s_content": "11% S", "form": "Powder / Granular",
            "application": "Basal dose",
            "dose_general": "200–300 kg/ha",
            "caution": "Contains sulfur which is beneficial for oilseed crops.",
            "cost": "₹350–450/bag (50 kg)",
            "description": "Lower phosphate content than DAP but provides sulfur as secondary benefit. Good for oilseeds.",
        }
    },
    {
        "id": "npk_complex", "label": "NPK Complex", "type": "fertilizer", "color": "#f59e0b", "size": 12,
        "details": {
            "formula": "NPK 20-20-0 / 19-19-19", "npk": "Variable",
            "form": "Granular / WS Grade",
            "application": "Basal or fertigation",
            "dose_general": "50–100 kg/ha based on nutrient requirement",
            "caution": "Select grade based on deficient nutrient profile.",
            "cost": "₹1,100–1,800/bag (50 kg)",
            "description": "Balanced multi-nutrient fertilizer. Used when multiple nutrients are deficient simultaneously.",
        }
    },

    # ── Diseases ──────────────────────────────────────────────────
    {
        "id": "early_blight", "label": "Early Blight", "type": "disease", "color": "#f43f5e", "size": 11,
        "details": {
            "pathogen": "Alternaria solani",
            "affected_crops": ["Maize", "Tomato", "Potato"],
            "symptoms": "Dark brown spots with concentric rings (target-board appearance)",
            "spread": "Airborne spores, rainfall splash",
            "favorable_conditions": "High humidity (>90%), moderate temperature (24–29°C)",
            "economic_loss": "20–40% yield loss if untreated",
            "description": "Fungal disease causing characteristic ringed leaf lesions. Spreads rapidly in warm humid conditions.",
        }
    },
    {
        "id": "late_blight", "label": "Late Blight", "type": "disease", "color": "#f43f5e", "size": 11,
        "details": {
            "pathogen": "Phytophthora infestans",
            "affected_crops": ["Potato", "Tomato"],
            "symptoms": "Water-soaked lesions with white sporulation on lower leaf surface",
            "spread": "Wind, rain; highly contagious",
            "favorable_conditions": "Cool (10–25°C) and wet conditions",
            "economic_loss": "Up to 100% total crop failure",
            "description": "Highly destructive oomycete disease. Caused the Irish Potato Famine. Fast-spreading under cool wet weather.",
        }
    },
    {
        "id": "leaf_spot", "label": "Leaf Spot", "type": "disease", "color": "#f43f5e", "size": 11,
        "details": {
            "pathogen": "Cercospora spp. / Helminthosporium spp.",
            "affected_crops": ["Rice", "Groundnut", "Maize"],
            "symptoms": "Small brown/tan circular spots with yellow halos",
            "spread": "Airborne conidia and infected seed",
            "favorable_conditions": "High humidity and nitrogen deficiency",
            "economic_loss": "10–25% yield loss",
            "description": "Common fungal foliar disease. Nitrogen-deficient plants show greater susceptibility.",
        }
    },
    {
        "id": "powdery_mildew", "label": "Powdery Mildew", "type": "disease", "color": "#f43f5e", "size": 10,
        "details": {
            "pathogen": "Erysiphe spp. / Podosphaera spp.",
            "affected_crops": ["Wheat", "Cucurbits", "Grapes"],
            "symptoms": "White powdery coating on leaves and stems",
            "spread": "Wind-dispersed spores; no free water needed",
            "favorable_conditions": "Warm dry days + cool humid nights (15–26°C)",
            "economic_loss": "10–40% in susceptible varieties",
            "description": "Obligate biotrophic fungus. Unique in that it thrives in dry weather unlike most fungal diseases.",
        }
    },
    {
        "id": "bacterial_blight", "label": "Bacterial Blight", "type": "disease", "color": "#f43f5e", "size": 10,
        "details": {
            "pathogen": "Xanthomonas oryzae pv. oryzae",
            "affected_crops": ["Rice", "Cotton"],
            "symptoms": "Water-soaked lesions, yellowing, wilting, kresek (seedling death)",
            "spread": "Infected water, wounds, seed",
            "favorable_conditions": "High temperature (25–35°C) with flooding",
            "economic_loss": "Up to 50% in severe outbreaks",
            "description": "Bacterial disease causing significant rice yield losses. Spread by irrigation water and wind-driven rain.",
        }
    },

    # ── Deficiencies ──────────────────────────────────────────────
    {
        "id": "n_def", "label": "N-Deficiency", "type": "deficiency", "color": "#ec4899", "size": 11,
        "details": {
            "nutrient": "Nitrogen",
            "visual_symptom": "Yellowing (chlorosis) of older/lower leaves first",
            "soil_ph_effect": "Deficiency worsens in acidic soils (pH < 5.5)",
            "critical_stage": "Vegetative and tillering stages",
            "diagnosis": "Soil test: below 280 kg N/ha; SPAD meter < 40",
            "quick_fix": "Foliar spray: 2% urea solution",
            "long_term_fix": "Incorporate organic matter and basal urea",
            "description": "Most common deficiency. Nitrogen is mobile, so symptoms appear first on old leaves.",
        }
    },
    {
        "id": "p_def", "label": "P-Deficiency", "type": "deficiency", "color": "#ec4899", "size": 11,
        "details": {
            "nutrient": "Phosphorus",
            "visual_symptom": "Purple/reddish coloration on underside of leaves; stunted roots",
            "soil_ph_effect": "Fixation worsens at pH < 5 and pH > 7.5",
            "critical_stage": "Early seedling and root development stage",
            "diagnosis": "Soil test: available P2O5 < 22 kg/ha (Olsen method)",
            "quick_fix": "Foliar spray: 0.5% DAP solution (monoammonium phosphate)",
            "long_term_fix": "Basal DAP or SSP application",
            "description": "Phosphorus deficiency restricts root growth and energy transfer. Affects early seedling establishment.",
        }
    },
    {
        "id": "k_def", "label": "K-Deficiency", "type": "deficiency", "color": "#ec4899", "size": 11,
        "details": {
            "nutrient": "Potassium",
            "visual_symptom": "Marginal leaf scorch (brown edges), weak stems, poor grain filling",
            "soil_ph_effect": "Deficiency worsens in sandy and waterlogged soils",
            "critical_stage": "Grain filling and boll development stages",
            "diagnosis": "Soil test: exchangeable K < 120 kg/ha",
            "quick_fix": "Foliar spray: 1% KNO3 solution",
            "long_term_fix": "Basal MOP application",
            "description": "K deficiency causes poor drought tolerance and susceptibility to lodging and disease.",
        }
    },

    # ── Medicines ─────────────────────────────────────────────────
    {
        "id": "mancozeb", "label": "Mancozeb", "type": "medicine", "color": "#8b5cf6", "size": 10,
        "details": {
            "type": "Fungicide (Dithiocarbamate)",
            "mode_of_action": "Multi-site contact fungicide",
            "dose": "2.0–2.5 g/litre of water",
            "frequency": "Every 7–10 days; max 4 applications",
            "spectrum": "Broad spectrum (Early Blight, Downy Mildew, Rust)",
            "preharvest_interval": "7 days",
            "caution": "Protective only; apply before disease onset. Avoid mixing with alkaline pesticides.",
            "description": "Most widely used multi-site fungicide. Preventive action; needs to be applied early.",
        }
    },
    {
        "id": "metalaxyl", "label": "Metalaxyl", "type": "medicine", "color": "#8b5cf6", "size": 10,
        "details": {
            "type": "Fungicide (Phenylamide / Systemic)",
            "mode_of_action": "Systemic: inhibits RNA synthesis in Oomycetes",
            "dose": "2.0 g/litre (Ridomil formulation)",
            "frequency": "Every 14 days; max 3 applications",
            "spectrum": "Oomycetes only (Late Blight, Downy Mildew, Damping-off)",
            "preharvest_interval": "14 days",
            "caution": "Resistance risk — rotate with contact fungicides. Never use alone.",
            "description": "Systemic fungicide with curative action against Phytophthora. High resistance risk demands rotation.",
        }
    },
    {
        "id": "copper_hyd", "label": "Copper Hydroxide", "type": "medicine", "color": "#8b5cf6", "size": 10,
        "details": {
            "type": "Bactericide + Fungicide (Inorganic Copper)",
            "mode_of_action": "Releases Cu²⁺ ions that disrupt enzyme function",
            "dose": "2.5–3.0 g/litre of water",
            "frequency": "Every 7–10 days preventively",
            "spectrum": "Bacterial Blight, Leaf Spot, Anthracnose, Downy Mildew",
            "preharvest_interval": "3 days",
            "caution": "Phytotoxic at high doses; avoid application in hot dry weather.",
            "description": "Broad-spectrum inorganic protectant effective against both bacterial and fungal diseases.",
        }
    },
    {
        "id": "sulfur_fun", "label": "Sulfur Fungicide", "type": "medicine", "color": "#8b5cf6", "size": 10,
        "details": {
            "type": "Fungicide (Inorganic Sulfur)",
            "mode_of_action": "Disrupts cell membrane lipid synthesis",
            "dose": "2.0–3.0 g/litre (wettable sulfur)",
            "frequency": "Every 10–14 days",
            "spectrum": "Powdery Mildew, Rust, Mites",
            "preharvest_interval": "1 day",
            "caution": "Avoid application above 35°C — causes phytotoxicity. Do not apply with oils.",
            "description": "Oldest known fungicide. Excellent against powdery mildew. Also controls mites at high doses.",
        }
    },

    # ── Weather ───────────────────────────────────────────────────
    {
        "id": "rainy", "label": "Rainy Season", "type": "weather", "color": "#06b6d4", "size": 10,
        "details": {
            "season": "Kharif (June–October)",
            "rainfall": "600–2000 mm",
            "temperature": "25–35°C",
            "humidity": "70–95%",
            "spray_advisories": ["Avoid fungicide spraying during or immediately after rain", "Use systemic fungicides for better efficacy"],
            "fertilizer_precautions": ["Avoid surface urea application before rain (leaching risk)", "Split N doses to avoid runoff loss"],
            "suitable_crops": ["Rice", "Maize", "Cotton", "Groundnut", "Sugarcane"],
            "description": "High moisture season favoring water-intensive crops. Disease pressure is highest. Use systemic treatments.",
        }
    },
    {
        "id": "dry", "label": "Dry Season", "type": "weather", "color": "#06b6d4", "size": 10,
        "details": {
            "season": "Rabi (November–March)",
            "rainfall": "100–300 mm",
            "temperature": "10–25°C",
            "humidity": "30–65%",
            "spray_advisories": ["Best time for pesticide and fertilizer applications", "Wind speed should be <8 km/h for spraying"],
            "fertilizer_precautions": ["Irrigate after fertilizer application in dry soils", "Potassium is more available in dry soils"],
            "suitable_crops": ["Wheat", "Cotton", "Mustard", "Chickpea"],
            "description": "Cool dry season suits rabi crops. Fertilizer efficiency is higher in dry conditions with irrigation.",
        }
    },
]

KG_LINKS = [
    # Crop → Nutrient (NEEDS)
    {"source": "rice",       "target": "nitrogen",   "label": "NEEDS",       "priority": "high",   "color": "#00d97e55"},
    {"source": "rice",       "target": "phosphorus", "label": "NEEDS",       "priority": "medium", "color": "#00d97e44"},
    {"source": "rice",       "target": "potassium",  "label": "NEEDS",       "priority": "medium", "color": "#00d97e44"},
    {"source": "wheat",      "target": "nitrogen",   "label": "NEEDS",       "priority": "high",   "color": "#00d97e55"},
    {"source": "wheat",      "target": "phosphorus", "label": "NEEDS",       "priority": "high",   "color": "#00d97e55"},
    {"source": "maize",      "target": "nitrogen",   "label": "NEEDS",       "priority": "high",   "color": "#00d97e55"},
    {"source": "maize",      "target": "potassium",  "label": "NEEDS",       "priority": "medium", "color": "#00d97e44"},
    {"source": "cotton",     "target": "nitrogen",   "label": "NEEDS",       "priority": "high",   "color": "#00d97e55"},
    {"source": "cotton",     "target": "potassium",  "label": "NEEDS",       "priority": "high",   "color": "#00d97e55"},
    {"source": "sugarcane",  "target": "nitrogen",   "label": "NEEDS",       "priority": "very_high", "color": "#00d97e66"},
    {"source": "sugarcane",  "target": "potassium",  "label": "NEEDS",       "priority": "high",   "color": "#00d97e55"},
    {"source": "groundnut",  "target": "phosphorus", "label": "NEEDS",       "priority": "high",   "color": "#00d97e55"},

    # Nutrient → Fertilizer (RECOMMENDED_FERTILIZER)
    {"source": "nitrogen",   "target": "urea",        "label": "FERTILIZER",  "primary": True,  "color": "#3b82f655"},
    {"source": "nitrogen",   "target": "dap",         "label": "FERTILIZER",  "primary": False, "color": "#3b82f644"},
    {"source": "nitrogen",   "target": "npk_complex", "label": "FERTILIZER",  "primary": False, "color": "#3b82f644"},
    {"source": "phosphorus", "target": "dap",         "label": "FERTILIZER",  "primary": True,  "color": "#3b82f655"},
    {"source": "phosphorus", "target": "ssp",         "label": "FERTILIZER",  "primary": False, "color": "#3b82f644"},
    {"source": "phosphorus", "target": "npk_complex", "label": "FERTILIZER",  "primary": False, "color": "#3b82f644"},
    {"source": "potassium",  "target": "mop",         "label": "FERTILIZER",  "primary": True,  "color": "#3b82f655"},
    {"source": "potassium",  "target": "npk_complex", "label": "FERTILIZER",  "primary": False, "color": "#3b82f644"},

    # Disease → Medicine (TREATED_BY)
    {"source": "early_blight",    "target": "mancozeb",   "label": "TREATED_BY",  "color": "#f43f5e55"},
    {"source": "late_blight",     "target": "metalaxyl",  "label": "TREATED_BY",  "color": "#f43f5e55"},
    {"source": "leaf_spot",       "target": "copper_hyd", "label": "TREATED_BY",  "color": "#f43f5e55"},
    {"source": "leaf_spot",       "target": "mancozeb",   "label": "TREATED_BY",  "color": "#f43f5e44"},
    {"source": "powdery_mildew",  "target": "sulfur_fun", "label": "TREATED_BY",  "color": "#f43f5e55"},
    {"source": "bacterial_blight","target": "copper_hyd", "label": "TREATED_BY",  "color": "#f43f5e55"},

    # Deficiency → Fertilizer (CORRECTED_BY)
    {"source": "n_def", "target": "urea",        "label": "CORRECTED_BY", "dose": "50 kg/acre", "color": "#ec489955"},
    {"source": "n_def", "target": "dap",         "label": "CORRECTED_BY", "dose": "50 kg/acre", "color": "#ec489944"},
    {"source": "p_def", "target": "dap",         "label": "CORRECTED_BY", "dose": "50 kg/acre", "color": "#ec489955"},
    {"source": "p_def", "target": "ssp",         "label": "CORRECTED_BY", "dose": "150 kg/acre","color": "#ec489944"},
    {"source": "k_def", "target": "mop",         "label": "CORRECTED_BY", "dose": "25 kg/acre", "color": "#ec489955"},

    # Weather → Crop (SUITS)
    {"source": "rainy", "target": "rice",      "label": "SUITS", "color": "#06b6d455"},
    {"source": "rainy", "target": "maize",     "label": "SUITS", "color": "#06b6d455"},
    {"source": "rainy", "target": "cotton",    "label": "SUITS", "color": "#06b6d444"},
    {"source": "rainy", "target": "sugarcane", "label": "SUITS", "color": "#06b6d444"},
    {"source": "rainy", "target": "groundnut", "label": "SUITS", "color": "#06b6d444"},
    {"source": "dry",   "target": "wheat",     "label": "SUITS", "color": "#06b6d455"},
    {"source": "dry",   "target": "cotton",    "label": "SUITS", "color": "#06b6d444"},

    # Crop → Disease (SUSCEPTIBLE_TO)
    {"source": "rice",   "target": "leaf_spot",       "label": "SUSCEPTIBLE", "color": "#f43f5e33"},
    {"source": "rice",   "target": "bacterial_blight", "label": "SUSCEPTIBLE","color": "#f43f5e33"},
    {"source": "maize",  "target": "early_blight",    "label": "SUSCEPTIBLE", "color": "#f43f5e33"},
    {"source": "wheat",  "target": "powdery_mildew",  "label": "SUSCEPTIBLE", "color": "#f43f5e33"},
    {"source": "cotton", "target": "bacterial_blight", "label": "SUSCEPTIBLE","color": "#f43f5e33"},

    # Nutrient → Deficiency (DEFICIENCY_OF)
    {"source": "nitrogen",   "target": "n_def", "label": "DEFICIENCY_OF", "color": "#3b82f633"},
    {"source": "phosphorus", "target": "p_def", "label": "DEFICIENCY_OF", "color": "#3b82f633"},
    {"source": "potassium",  "target": "k_def", "label": "DEFICIENCY_OF", "color": "#3b82f633"},
]

# ─── Graph Statistics ────────────────────────────────────────────
def _graph_stats():
    type_counts = {}
    for n in KG_NODES:
        type_counts[n["type"]] = type_counts.get(n["type"], 0) + 1

    rel_counts = {}
    for l in KG_LINKS:
        rel_counts[l["label"]] = rel_counts.get(l["label"], 0) + 1

    return {
        "total_nodes": len(KG_NODES),
        "total_relationships": len(KG_LINKS),
        "node_types": type_counts,
        "relationship_types": rel_counts,
    }


# ─── Routes ──────────────────────────────────────────────────────

@router.get("/knowledge-graph")
async def get_knowledge_graph():
    """Return full Knowledge Graph data (nodes + links + stats)."""
    return {
        "nodes": KG_NODES,
        "links": KG_LINKS,
        "stats": _graph_stats(),
    }


@router.get("/knowledge-graph/node/{node_id}")
async def get_node_detail(node_id: str):
    """Return detailed information for a specific node."""
    node = next((n for n in KG_NODES if n["id"] == node_id), None)
    if not node:
        return {"error": f"Node '{node_id}' not found"}

    connections = []
    for link in KG_LINKS:
        src_id = link["source"] if isinstance(link["source"], str) else link["source"]["id"]
        tgt_id = link["target"] if isinstance(link["target"], str) else link["target"]["id"]
        if src_id == node_id or tgt_id == node_id:
            other_id = tgt_id if src_id == node_id else src_id
            other = next((n for n in KG_NODES if n["id"] == other_id), None)
            if other:
                connections.append({
                    "node": {"id": other["id"], "label": other["label"], "type": other["type"], "color": other["color"]},
                    "relationship": link["label"],
                    "direction": "outgoing" if src_id == node_id else "incoming",
                })

    return {**node, "connections": connections}


@router.get("/knowledge-graph/search")
async def search_graph(q: str = Query(..., min_length=1)):
    """Search nodes by label or type."""
    q_lower = q.lower()
    results = [
        {"id": n["id"], "label": n["label"], "type": n["type"], "color": n["color"]}
        for n in KG_NODES
        if q_lower in n["label"].lower() or q_lower in n["type"].lower()
    ]
    return {"results": results, "count": len(results)}


@router.get("/knowledge-graph/path")
async def find_reasoning_path(from_id: str = Query(...), to_id: str = Query(...)):
    """Find direct reasoning path between two nodes."""
    paths = []
    for link in KG_LINKS:
        src = link["source"] if isinstance(link["source"], str) else link["source"]["id"]
        tgt = link["target"] if isinstance(link["target"], str) else link["target"]["id"]
        if src == from_id and tgt == to_id:
            paths.append({"relationship": link["label"], "direct": True})
        elif src == to_id and tgt == from_id:
            paths.append({"relationship": link["label"], "direct": False, "reversed": True})

    return {"from": from_id, "to": to_id, "paths": paths}


@router.get("/knowledge-graph/stats")
async def get_stats():
    """Return knowledge graph statistics."""
    return _graph_stats()
