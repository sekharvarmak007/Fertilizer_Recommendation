# Multimodal AI-Powered Intelligent Fertilizer Recommendation & Plant Health Management System

A full-stack smart agriculture platform combining ML, Deep Learning, Knowledge Graph, Scientific Formulas, Weather Data, and an AI Agent into one explainable recommendation engine.

---

## User Review Required

> [!IMPORTANT]
> **`best.pt` Model Files**: You mentioned you have `best.pt` files (YOLOv11 weights). Please share:
> - Which tasks do these weights cover? (Disease Detection, Nutrient Deficiency, or both?)
> - What are the class labels for each model?
> - File locations so they can be integrated directly.

> [!IMPORTANT]
> **API Keys Required**: The following external keys are needed to build functional modules:
> - `OPENWEATHERMAP_API_KEY` — for weather data
> - `GROQ_API_KEY` or `OLLAMA` local endpoint — for Llama 3 (via LangChain)
> - `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` — for Knowledge Graph
> - `CLOUDINARY_*` — for image storage (optional, can use local disk first)

> [!WARNING]
> **Scope is Very Large**: This system has 7 modules, 8 pages, and 7 API endpoints. We will build it in **4 phases** to ensure quality. The plan below details each phase clearly.

---

## Open Questions

1. Do you have pre-trained XGBoost models for Soil Fertility and Crop Recommendation, or should we train them from the datasets?
2. Do you have both `best.pt` files (disease + deficiency) or just one?
3. Should the AI Agent use **Groq API** (fast, free tier) or **local Ollama** for Llama 3?
4. Do you want **PostgreSQL** for user accounts/history, or is a simpler SQLite sufficient for the first version?
5. Should the frontend be **React + Vite** (fast dev build) or **Next.js** (SSR/SEO)?

---

## Proposed Changes

### Phase 1 — Project Scaffold & Frontend Shell

#### [NEW] Project Root Structure
```
recommendation-agent/
├── frontend/              # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/         # 8 pages
│   │   ├── components/    # Shared UI components
│   │   ├── api/           # Axios API hooks
│   │   └── store/         # Zustand state
│   └── public/
├── backend/               # FastAPI
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   ├── models/        # ML/DL model loaders
│   │   ├── services/      # Business logic
│   │   ├── kg/            # Neo4j Knowledge Graph
│   │   ├── agent/         # LangChain AI Agent
│   │   └── formulas/      # Montana formula engine
│   ├── ml_models/         # .pkl / .pt files
│   └── requirements.txt
├── notebooks/             # Training notebooks
├── docker-compose.yml
└── .env.example
```

---

### Phase 2 — Backend: ML Models + APIs

#### [NEW] `backend/app/api/soil.py`
- `POST /soil` → accepts N, P, K, pH, EC, OC, CaCO3 → XGBoost prediction → returns fertility class + nutrient status

#### [NEW] `backend/app/api/crop.py`
- `POST /crop` → accepts N, P, K, Temp, Humidity, pH, Rainfall → XGBoost → returns top crop recommendations

#### [NEW] `backend/app/api/disease.py`
- `POST /disease` → accepts image upload → YOLOv11 inference → returns disease label + confidence

#### [NEW] `backend/app/api/deficiency.py`
- `POST /deficiency` → accepts image upload → YOLOv11 inference → returns deficiency type + confidence

#### [NEW] `backend/app/api/weather.py`
- `POST /weather` → accepts city/lat-lon → OpenWeatherMap fetch → returns temp, humidity, rainfall

#### [NEW] `backend/app/formulas/montana.py`
- Implements all Montana Fertilizer Formula rules:
  - N requirement, Urea calculation
  - SOM adjustments (+20 / -20 lb N)
  - Legume credit
  - Stubble correction
  - MAP (P₂O₅/0.52), K₂O (K₂O/0.61)

#### [NEW] `backend/app/api/recommendation.py`
- `POST /recommendation` → orchestrates all modules → returns unified fertilizer plan

---

### Phase 3 — Knowledge Graph + AI Agent

#### [NEW] `backend/app/kg/neo4j_client.py`
- Neo4j connection and query interface

#### [NEW] `backend/app/kg/seed_graph.py`
- Seeds relationships:
  - `Crop -[NEEDS]-> Nutrient`
  - `Nutrient -[FERTILIZER]-> Fertilizer`
  - `Fertilizer -[QUANTITY]-> ApplicationRule`
  - `Weather -[AFFECTS]-> Application`
  - `Disease -[TREATEDBY]-> Medicine`
  - `Deficiency -[CORRECTEDBY]-> Fertilizer`

#### [NEW] `backend/app/agent/agent.py`
- LangChain agent with tools:
  - `soil_tool` — query soil model
  - `crop_tool` — query crop model
  - `disease_tool` — analyze image
  - `weather_tool` — fetch weather
  - `kg_tool` — query Neo4j
  - `formula_tool` — run Montana formulas
- Uses **Llama 3** (via Groq or Ollama)
- Returns natural language explanation

#### [NEW] `backend/app/api/chatbot.py`
- `POST /chatbot` → farmer types question → LangChain agent responds

---

### Phase 4 — Frontend Pages & Visualization

#### [NEW] `frontend/src/pages/Home.jsx`
- Hero section, feature cards, animated stats

#### [NEW] `frontend/src/pages/SoilInput.jsx`
- Form: N, P, K, pH, EC, OC inputs
- Radar chart (Chart.js) of nutrient levels
- Fertility prediction results card

#### [NEW] `frontend/src/pages/LeafUpload.jsx`
- Drag-and-drop image upload
- Side-by-side disease + deficiency results
- Confidence score bars

#### [NEW] `frontend/src/pages/CropRecommendation.jsx`
- Crop cards with suitability scores
- Animated ranking list

#### [NEW] `frontend/src/pages/FertilizerRecommendation.jsx`
- Full recommendation card: fertilizer, quantity, timing, method
- Montana formula breakdown panel

#### [NEW] `frontend/src/pages/WeatherDashboard.jsx`
- City search → weather cards
- How weather affects recommendations

#### [NEW] `frontend/src/pages/KnowledgeGraph.jsx`
- Interactive graph visualization (react-force-graph or vis.js)
- Crop → Nutrient → Fertilizer path highlighting

#### [NEW] `frontend/src/pages/Chatbot.jsx`
- Chat UI with bubble messages
- Real-time streaming response from AI Agent

---

## Architecture Diagram

```
User Browser (React)
        │
        ▼
  FastAPI Backend
  ┌─────────────────────────────────────┐
  │  /soil   /crop   /disease  /weather  │
  │  /deficiency  /recommendation        │
  │  /chatbot                            │
  └────────┬────────────────────────────┘
           │
    ┌──────┴──────────────┐
    │                     │
  ML Models           AI Agent (LangChain)
  XGBoost (soil,crop)   Llama 3 via Groq
  YOLOv11 (disease,     ┌──────────────┐
           deficiency)  │  Tools:      │
                        │  - Soil API  │
                        │  - Crop API  │
  Montana Formulas      │  - Weather   │
  (rule engine)         │  - Neo4j KG  │
                        │  - Formulas  │
  Neo4j                 └──────────────┘
  Knowledge Graph
  
  PostgreSQL (history)
  OpenWeatherMap API
```

---

## Technology Stack (Confirmed)

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Chart.js, react-force-graph |
| Backend | FastAPI (Python 3.11) |
| ML | XGBoost, scikit-learn |
| DL | YOLOv11 (ultralytics) |
| Knowledge Graph | Neo4j (Docker) |
| AI Agent | LangChain + Llama 3 (Groq API) |
| Database | PostgreSQL (Docker) |
| Image Storage | Cloudinary / local disk |
| Weather | OpenWeatherMap API |
| Deployment | Docker Compose (dev), Render/AWS (prod) |

---

## Phased Delivery Plan

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Project scaffold + Frontend shell (all pages, routing, UI) | ⬜ Pending |
| 2 | Backend APIs + ML Models + Montana Formula Engine | ⬜ Pending |
| 3 | Neo4j Knowledge Graph + LangChain AI Agent | ⬜ Pending |
| 4 | Integration, Chart.js visualizations, Docker setup | ⬜ Pending |

---

## Verification Plan

### Automated Tests
```bash
# Backend unit tests
pytest backend/tests/

# Frontend linting
npm run lint --prefix frontend
```

### Manual Verification
- Test `/soil` endpoint with sample N/P/K values
- Upload a test leaf image to `/disease` and `/deficiency`
- Verify Knowledge Graph path: Rice → Nitrogen → Urea in Neo4j Browser
- Ask chatbot: "What fertilizer for rice with low nitrogen?" and verify Llama 3 response
- Check all 8 frontend pages render correctly with mock data
