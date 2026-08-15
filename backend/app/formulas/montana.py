"""
Montana Fertilizer Formula Engine
Based on Montana State University Fertilizer Guidelines.

Formulas implemented:
1. N(lb/acre) = NO3-N(ppm) × 2 × soil_depth(in) / 6
2. Fertilizer N = Total N Required - Soil Available N
3. Urea Required = Fertilizer N / 0.46
4. SOM Adjustment: +20 lb if SOM<1%, -20 lb if SOM>3%
5. Legume Credit: 10-40 lb N/acre
6. Stubble Correction: 10 lb N / 1000 lb residue
7. MAP Required = P2O5 / 0.52
8. MOP Required = K2O / 0.61
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class MontanaResult:
    # Nitrogen
    no3_n_ppm: float
    soil_depth_inches: float
    soil_available_n: float           # lb/acre from soil test
    total_n_required: float           # crop requirement lb/acre
    som_adjustment: float             # +20 or -20 lb
    legume_credit: float              # lb/acre
    stubble_credit: float             # lb/acre
    fertilizer_n_required: float      # net N to apply
    urea_required_lb: float           # lb/acre
    urea_required_kg: float           # kg/acre (× 0.4536 × 2.471)

    # Phosphorus
    p2o5_required: float              # lb/acre
    map_required_lb: float            # lb/acre (P2O5/0.52)
    map_required_kg: float

    # Potassium
    k2o_required: float               # lb/acre
    mop_required_lb: float            # lb/acre (K2O/0.61)
    mop_required_kg: float

    # Summary
    steps: list


# Crop nitrogen requirement lookup (lb N/acre)
CROP_N_REQUIREMENTS = {
    'rice':       125, 'wheat':    120, 'maize':    150, 'cotton':   100,
    'sugarcane':  200, 'sorghum':  100, 'barley':   90,  'oats':     80,
    'soybean':    20,  'chickpea': 20,  'lentil':   20,  'groundnut': 35,
    'banana':     180, 'coffee':   140, 'jute':     110, 'tobacco':  120,
    'potato':     160, 'tomato':   140, 'default':  100,
}

# Crop P2O5 requirement (lb/acre)
CROP_P2O5_REQUIREMENTS = {
    'rice': 60, 'wheat': 60, 'maize': 75, 'cotton': 50, 'sugarcane': 80,
    'groundnut': 60, 'banana': 90, 'coffee': 60, 'jute': 50, 'tobacco': 70,
    'potato': 80, 'tomato': 70, 'soybean': 40, 'chickpea': 40, 'lentil': 35,
    'default': 50,
}

# Crop K2O requirement (lb/acre)
CROP_K2O_REQUIREMENTS = {
    'rice': 40, 'wheat': 40, 'maize': 50, 'cotton': 50, 'sugarcane': 100,
    'groundnut': 40, 'banana': 150, 'coffee': 120, 'jute': 60, 'tobacco': 90,
    'potato': 120, 'tomato': 90, 'soybean': 40, 'chickpea': 30, 'lentil': 30,
    'default': 40,
}

LB_TO_KG = 0.4536
ACRE_FACTOR = 1.0  # 1 acre


def calculate_soil_available_n(no3_n_ppm: float, soil_depth_inches: float) -> float:
    """
    Formula: N(lb/acre) = NO3-N(ppm) × 2 × depth(in) / 6
    """
    return round(no3_n_ppm * 2 * soil_depth_inches / 6, 2)


def calculate_som_adjustment(som_percent: float) -> float:
    """
    If SOM < 1%  → +20 lb N/acre
    If SOM > 3%  → -20 lb N/acre
    Else          → 0
    """
    if som_percent < 1.0:
        return +20.0
    elif som_percent > 3.0:
        return -20.0
    return 0.0


def calculate_legume_credit(previous_legume: bool, legume_type: str = 'soybean') -> float:
    """
    Soybean/alfalfa: 40 lb N/acre
    Field peas/lentils: 20 lb N/acre
    No legume: 0
    """
    if not previous_legume:
        return 0.0
    credits = {'soybean': 40, 'alfalfa': 40, 'peas': 20, 'lentil': 20, 'chickpea': 15}
    return float(credits.get(legume_type, 20))


def calculate_stubble_credit(residue_lb_per_acre: float) -> float:
    """10 lb N per 1000 lb residue"""
    return round(residue_lb_per_acre / 1000 * 10, 2)


def lb_per_acre_to_kg_per_acre(lb: float) -> float:
    return round(lb * LB_TO_KG, 2)


def run_montana_formulas(
    crop: str,
    no3_n_ppm: float,
    soil_depth_inches: float,
    som_percent: float,
    previous_legume: bool = False,
    legume_type: str = 'none',
    residue_lb_per_acre: float = 0.0,
    p_ppm: float = 20.0,
    k_ppm: float = 100.0,
) -> MontanaResult:
    """Run all Montana fertilizer formulas for given crop and soil data."""
    steps = []
    crop_lower = crop.lower()

    # 1. Soil available N
    soil_n = calculate_soil_available_n(no3_n_ppm, soil_depth_inches)
    steps.append({
        'step': 1,
        'name': 'Soil Available N',
        'formula': f'NO3-N({no3_n_ppm} ppm) × 2 × depth({soil_depth_inches} in) / 6',
        'result': f'{soil_n} lb/acre',
    })

    # 2. Total N required by crop
    total_n = float(CROP_N_REQUIREMENTS.get(crop_lower, CROP_N_REQUIREMENTS['default']))
    steps.append({
        'step': 2,
        'name': 'Total N Required (Crop)',
        'formula': f'Standard requirement for {crop}',
        'result': f'{total_n} lb/acre',
    })

    # 3. SOM adjustment
    som_adj = calculate_som_adjustment(som_percent)
    if som_adj != 0:
        steps.append({
            'step': 3,
            'name': 'SOM Adjustment',
            'formula': f'SOM={som_percent}% → {"Add" if som_adj > 0 else "Subtract"} {abs(som_adj)} lb',
            'result': f'{som_adj:+.0f} lb/acre',
        })

    # 4. Legume credit
    leg_credit = calculate_legume_credit(previous_legume, legume_type)
    if leg_credit > 0:
        steps.append({
            'step': 4,
            'name': 'Legume Credit',
            'formula': f'Previous {legume_type} crop',
            'result': f'-{leg_credit} lb/acre',
        })

    # 5. Stubble correction
    stubble = calculate_stubble_credit(residue_lb_per_acre)
    if stubble > 0:
        steps.append({
            'step': 5,
            'name': 'Stubble Correction',
            'formula': f'{residue_lb_per_acre} lb/acre residue × (10/1000)',
            'result': f'+{stubble} lb/acre',
        })

    # 6. Fertilizer N required
    fert_n = max(0, total_n + som_adj - soil_n - leg_credit + stubble)
    steps.append({
        'step': 6,
        'name': 'Fertilizer N Required',
        'formula': f'Total N({total_n}) + SOM adj({som_adj:+}) - Soil N({soil_n}) - Legume({leg_credit}) + Stubble({stubble})',
        'result': f'{fert_n:.1f} lb/acre',
    })

    # 7. Urea calculation (46% N)
    urea_lb = round(fert_n / 0.46, 1)
    urea_kg = lb_per_acre_to_kg_per_acre(urea_lb)
    steps.append({
        'step': 7,
        'name': 'Urea Required',
        'formula': f'Fertilizer N ({fert_n:.1f}) / 0.46',
        'result': f'{urea_lb} lb/acre = {urea_kg} kg/acre',
    })

    # 8. Phosphorus → MAP
    p2o5 = float(CROP_P2O5_REQUIREMENTS.get(crop_lower, CROP_P2O5_REQUIREMENTS['default']))
    map_lb = round(p2o5 / 0.52, 1)
    map_kg = lb_per_acre_to_kg_per_acre(map_lb)
    steps.append({
        'step': 8,
        'name': 'MAP Required (P)',
        'formula': f'P2O5({p2o5}) / 0.52',
        'result': f'{map_lb} lb/acre = {map_kg} kg/acre',
    })

    # 9. Potassium → MOP
    k2o = float(CROP_K2O_REQUIREMENTS.get(crop_lower, CROP_K2O_REQUIREMENTS['default']))
    mop_lb = round(k2o / 0.61, 1)
    mop_kg = lb_per_acre_to_kg_per_acre(mop_lb)
    steps.append({
        'step': 9,
        'name': 'MOP Required (K)',
        'formula': f'K2O({k2o}) / 0.61',
        'result': f'{mop_lb} lb/acre = {mop_kg} kg/acre',
    })

    return MontanaResult(
        no3_n_ppm=no3_n_ppm,
        soil_depth_inches=soil_depth_inches,
        soil_available_n=soil_n,
        total_n_required=total_n,
        som_adjustment=som_adj,
        legume_credit=leg_credit,
        stubble_credit=stubble,
        fertilizer_n_required=round(fert_n, 1),
        urea_required_lb=urea_lb,
        urea_required_kg=urea_kg,
        p2o5_required=p2o5,
        map_required_lb=map_lb,
        map_required_kg=map_kg,
        k2o_required=k2o,
        mop_required_lb=mop_lb,
        mop_required_kg=mop_kg,
        steps=steps,
    )
