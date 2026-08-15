"""
Neo4j Knowledge Graph Seed Script
Run this after installing Neo4j Desktop to populate all relationships.

Usage:
  python -m app.kg.seed_graph
"""
from app.kg.neo4j_client import get_driver

SEED_CYPHER = """
// ── Clear existing ─────────────────────────────────────────
MATCH (n) DETACH DELETE n;

// ── Crops ──────────────────────────────────────────────────
MERGE (rice:Crop    {name: 'rice',    display: 'Rice'})
MERGE (wheat:Crop   {name: 'wheat',   display: 'Wheat'})
MERGE (maize:Crop   {name: 'maize',   display: 'Maize'})
MERGE (cotton:Crop  {name: 'cotton',  display: 'Cotton'})
MERGE (sugarcane:Crop {name: 'sugarcane', display: 'Sugarcane'});

// ── Nutrients ──────────────────────────────────────────────
MERGE (N:Nutrient {name: 'nitrogen',   display: 'Nitrogen (N)'})
MERGE (P:Nutrient {name: 'phosphorus', display: 'Phosphorus (P)'})
MERGE (K:Nutrient {name: 'potassium',  display: 'Potassium (K)'});

// ── Fertilizers ────────────────────────────────────────────
MERGE (urea:Fertilizer {name: 'Urea',  formula: '46-0-0',  n_content: 0.46})
MERGE (dap:Fertilizer  {name: 'DAP',   formula: '18-46-0', n_content: 0.18})
MERGE (mop:Fertilizer  {name: 'MOP',   formula: '0-0-60',  k_content: 0.60})
MERGE (ssp:Fertilizer  {name: 'SSP',   formula: '0-16-0',  p_content: 0.16})
MERGE (npk:Fertilizer  {name: 'NPK 20-20-0', formula: '20-20-0'});

// ── Diseases ───────────────────────────────────────────────
MERGE (eb:Disease {name: 'Early Blight',   pathogen: 'Alternaria solani'})
MERGE (lb:Disease {name: 'Late Blight',    pathogen: 'Phytophthora infestans'})
MERGE (ls:Disease {name: 'Leaf Spot',      pathogen: 'Cercospora spp.'})
MERGE (pm:Disease {name: 'Powdery Mildew', pathogen: 'Erysiphe spp.'})
MERGE (bs:Disease {name: 'Bacterial Blight', pathogen: 'Xanthomonas spp.'});

// ── Deficiencies ───────────────────────────────────────────
MERGE (nd:Deficiency {name: 'Nitrogen Deficiency',   symptom: 'Yellowing of older leaves'})
MERGE (pd:Deficiency {name: 'Phosphorus Deficiency', symptom: 'Purple/reddish coloration'})
MERGE (kd:Deficiency {name: 'Potassium Deficiency',  symptom: 'Brown leaf margins'});

// ── Medicines ──────────────────────────────────────────────
MERGE (mancozeb:Medicine  {name: 'Mancozeb',     dose: '2g/L', type: 'fungicide'})
MERGE (metalaxyl:Medicine {name: 'Metalaxyl',    dose: '2g/L', type: 'fungicide'})
MERGE (copper:Medicine    {name: 'Copper Hydroxide', dose: '3g/L', type: 'bactericide'})
MERGE (sulfur:Medicine    {name: 'Sulfur',        dose: '2g/L', type: 'fungicide'});

// ── Weather ────────────────────────────────────────────────
MERGE (rainy:Weather {name: 'Rainy', season: 'Kharif'})
MERGE (dry:Weather   {name: 'Dry',   season: 'Rabi'});

// ── Relationships: Crop NEEDS Nutrient ─────────────────────
MATCH (rice:Crop {name:'rice'}), (N:Nutrient {name:'nitrogen'})   MERGE (rice)-[:NEEDS {priority:'high'}]->(N);
MATCH (rice:Crop {name:'rice'}), (P:Nutrient {name:'phosphorus'}) MERGE (rice)-[:NEEDS {priority:'medium'}]->(P);
MATCH (rice:Crop {name:'rice'}), (K:Nutrient {name:'potassium'})  MERGE (rice)-[:NEEDS {priority:'medium'}]->(K);
MATCH (wheat:Crop {name:'wheat'}), (N:Nutrient {name:'nitrogen'})   MERGE (wheat)-[:NEEDS {priority:'high'}]->(N);
MATCH (wheat:Crop {name:'wheat'}), (P:Nutrient {name:'phosphorus'}) MERGE (wheat)-[:NEEDS {priority:'high'}]->(P);
MATCH (maize:Crop {name:'maize'}), (N:Nutrient {name:'nitrogen'})   MERGE (maize)-[:NEEDS {priority:'high'}]->(N);
MATCH (maize:Crop {name:'maize'}), (K:Nutrient {name:'potassium'})  MERGE (maize)-[:NEEDS {priority:'medium'}]->(K);
MATCH (cotton:Crop {name:'cotton'}), (N:Nutrient {name:'nitrogen'})  MERGE (cotton)-[:NEEDS {priority:'high'}]->(N);
MATCH (cotton:Crop {name:'cotton'}), (K:Nutrient {name:'potassium'}) MERGE (cotton)-[:NEEDS {priority:'high'}]->(K);

// ── Relationships: Nutrient RECOMMENDED_FERTILIZER ─────────
MATCH (N:Nutrient {name:'nitrogen'}),   (urea:Fertilizer {name:'Urea'}) MERGE (N)-[:RECOMMENDED_FERTILIZER {primary:true}]->(urea);
MATCH (N:Nutrient {name:'nitrogen'}),   (dap:Fertilizer  {name:'DAP'})  MERGE (N)-[:RECOMMENDED_FERTILIZER {primary:false}]->(dap);
MATCH (P:Nutrient {name:'phosphorus'}), (dap:Fertilizer  {name:'DAP'})  MERGE (P)-[:RECOMMENDED_FERTILIZER {primary:true}]->(dap);
MATCH (P:Nutrient {name:'phosphorus'}), (ssp:Fertilizer  {name:'SSP'})  MERGE (P)-[:RECOMMENDED_FERTILIZER {primary:false}]->(ssp);
MATCH (K:Nutrient {name:'potassium'}),  (mop:Fertilizer  {name:'MOP'})  MERGE (K)-[:RECOMMENDED_FERTILIZER {primary:true}]->(mop);

// ── Relationships: Disease TREATED_BY ──────────────────────
MATCH (eb:Disease {name:'Early Blight'}),   (m:Medicine {name:'Mancozeb'})    MERGE (eb)-[:TREATED_BY]->(m);
MATCH (lb:Disease {name:'Late Blight'}),    (m:Medicine {name:'Metalaxyl'})   MERGE (lb)-[:TREATED_BY]->(m);
MATCH (ls:Disease {name:'Leaf Spot'}),      (m:Medicine {name:'Copper Hydroxide'}) MERGE (ls)-[:TREATED_BY]->(m);
MATCH (pm:Disease {name:'Powdery Mildew'}), (m:Medicine {name:'Sulfur'})      MERGE (pm)-[:TREATED_BY]->(m);
MATCH (bs:Disease {name:'Bacterial Blight'}),(m:Medicine {name:'Copper Hydroxide'}) MERGE (bs)-[:TREATED_BY]->(m);

// ── Relationships: Deficiency CORRECTED_BY ─────────────────
MATCH (nd:Deficiency {name:'Nitrogen Deficiency'}),   (f:Fertilizer {name:'Urea'}) MERGE (nd)-[:CORRECTED_BY {dose:'50 kg/acre'}]->(f);
MATCH (pd:Deficiency {name:'Phosphorus Deficiency'}), (f:Fertilizer {name:'DAP'})  MERGE (pd)-[:CORRECTED_BY {dose:'50 kg/acre'}]->(f);
MATCH (kd:Deficiency {name:'Potassium Deficiency'}),  (f:Fertilizer {name:'MOP'})  MERGE (kd)-[:CORRECTED_BY {dose:'25 kg/acre'}]->(f);

// ── Relationships: Weather SUITS Crop ──────────────────────
MATCH (rainy:Weather {name:'Rainy'}), (rice:Crop {name:'rice'})     MERGE (rainy)-[:SUITS]->(rice);
MATCH (rainy:Weather {name:'Rainy'}), (maize:Crop {name:'maize'})   MERGE (rainy)-[:SUITS]->(maize);
MATCH (dry:Weather {name:'Dry'}),     (wheat:Crop {name:'wheat'})   MERGE (dry)-[:SUITS]->(wheat);
MATCH (dry:Weather {name:'Dry'}),     (cotton:Crop {name:'cotton'}) MERGE (dry)-[:SUITS]->(cotton);
"""


def seed_knowledge_graph():
    driver = get_driver()
    if driver is None:
        print("[Seed] Neo4j not connected. Install Neo4j Desktop first.")
        print("       Download: https://neo4j.com/download/")
        return False

    try:
        with driver.session() as session:
            for statement in SEED_CYPHER.strip().split(';'):
                stmt = statement.strip()
                if stmt:
                    session.run(stmt)
        print("[Seed] ✅ Knowledge Graph seeded successfully!")
        print("[Seed]    Nodes: Crops(5) + Nutrients(3) + Fertilizers(5) + Diseases(5) + Deficiencies(3) + Medicines(4) + Weather(2)")
        print("[Seed]    Open Neo4j Browser at http://localhost:7474 to visualize")
        return True
    except Exception as e:
        print(f"[Seed] Error: {e}")
        return False


if __name__ == "__main__":
    seed_knowledge_graph()
