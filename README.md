# AgriSense AI — Multimodal Fertilizer Recommendation System

> AI-Powered Intelligent Fertilizer Recommendation and Plant Health Management System for Smart Agriculture

---

## 🚀 Complete Step-by-Step Run Guide

Follow these exact commands to set up and run the entire project on your system.

### 📋 Prerequisites
- **Python 3.9+** (Tested on Python 3.9 – 3.11)
- **Node.js 18+** & **npm**
- *(Optional)* **Docker Desktop** or **Neo4j Desktop** for Knowledge Graph
- *(Optional)* **Ollama** for local AI Chatbot (or use OpenAI API key)

---

### 1️⃣ Backend Setup & Execution (FastAPI)

Open a terminal and navigate to the backend directory:

```bash
# 1. Navigate to backend
cd "recommendation agent/backend"

# 2. Create a Python Virtual Environment
# On Windows:
python -m venv venv
venv\Scripts\activate

# On macOS / Linux:
# python3 -m venv venv
# source venv/bin/activate

# 3. Upgrade pip and install all required packages
pip install --upgrade pip
pip install -r requirements.txt

# 4. (Optional) Configure environment variables
# Copy or edit .env file in backend/
# Make sure OPENWEATHERMAP_API_KEY / OPENAI_API_KEY are configured if desired

# 5. Start the FastAPI Server with auto-reload
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

* **API Base URL:** `http://localhost:8000`
* **Interactive Swagger Documentation:** `http://localhost:8000/docs`
* **Alternative Redoc Documentation:** `http://localhost:8000/redoc`

---

### 2️⃣ Frontend Setup & Execution (React + Vite)

Open a **second** terminal window:

```bash
# 1. Navigate to frontend
cd "recommendation agent/frontend"

# 2. Install all Node.js dependencies
npm install

# 3. Start the Vite Development Server
npm run dev
```

* **Frontend Application URL:** `http://localhost:5173`

---

### 3️⃣ Verify Model Predictions via Command Line

You can verify that all trained `.pkl` and `.pt` models are working and predicting directly from the terminal:

#### A. Test Soil Fertility & Crop Recommendation PKL Models
```bash
cd "recommendation agent/backend"
python -c "
from app.models.soil_model import predict_soil_fertility
from app.models.fertilizer_model import predict_crop

# 1. Test Soil Fertility XGBoost Model (takes N, P, K, pH, EC, Organic Carbon, CaCO3)
fertility, confidence = predict_soil_fertility(
    n=90.0, p=42.0, k=43.0, ph=6.5, ec=1.2, organic_carbon=0.91, caco3=5.0
)
print(f'[Soil Model] Result: {fertility} (Confidence: {confidence:.2%})')

# 2. Test Crop Recommendation Model (takes N, P, K, Temp, Humidity, pH, Rainfall)
crops = predict_crop(
    n=90.0, p=42.0, k=43.0, temperature=25.5, humidity=80.4, ph=6.5, rainfall=202.9
)
print('[Crop Model] Top Predictions:')
for c in crops:
    print(f'  - {c[\"crop\"].title()}: {c[\"suitability\"]*100:.1f}% match | Fertilizer: {c[\"fertilizer\"]} ({c[\"season\"]})')
"
```

#### B. Test Leaf Disease & Deficiency YOLOv11 Models
```bash
cd "recommendation agent/backend"
python -c "
from app.models.disease_model import get_disease_model
from app.models.deficiency_model import get_deficiency_model

print('[Disease Model Loaded]:', get_disease_model())
print('[Deficiency Model Loaded]:', get_deficiency_model())
"
```

---

## 🤖 Machine Learning Models & Input Fields

The models inside `backend/ml_models/` take specific input fields from the application UI and predict results as follows:

| Model File | Type | Expected Input Fields | Output / Prediction |
| :--- | :--- | :--- | :--- |
| **`soil_fertility_xgboost.pkl`** | XGBoost Classifier | `Total_Nitrogen`, `Available_Phosphorus`, `Available_Potassium`, `Soil_pH`, `Soil_Organic_Carbon` | Fertility Class: **Low**, **Medium**, or **High** with confidence score |
| **`fertilizer_model.pkl`** | Random Forest Classifier | `Nitrogen (N)`, `Phosphorus (P)`, `Potassium (K)`, `Temperature (°C)`, `Humidity (%)`, `Soil pH`, `Rainfall (mm)` | Top 4 Suitable Crops (out of 24 crop classes) + Season + Base Fertilizer |
| **`model-3.pt` / `model-3/`** | YOLOv11 Classification | Uploaded Leaf Image (JPG, PNG) | Plant Disease (38 PlantVillage classes) + Treatment advice |
| **`model-4.pt` / `model-4/`** | YOLOv11 Classification | Uploaded Leaf Image (JPG, PNG) | Nutrient Deficiency (N, P, K deficiency or Healthy) + Correction dosage |

---

## 🔑 Environment Configuration (`backend/.env`)

Edit `backend/.env` to configure external APIs:

```env
# Application
APP_NAME="AgriSense AI"
DEBUG=True

# Google Gemini AI (Primary Multimodal Agronomist & Chatbot Engine)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-latest

# OpenWeatherMap (For live weather forecasts & agricultural rain warnings)
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key_here

# OpenAI GPT-4o (Optional Fallback)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o

# Ollama (Local AI fallback if API key is not set)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Neo4j Graph Database (Optional)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=agrikg2024
```

*(Note: The chatbot and fertilizer recommender automatically connect to Google Gemini for deep agronomic prescriptions, with graceful fallback to Montana state formulas and offline agronomy engines if offline).*

---

## 🛠 Optional Services

### 1. Neo4j Knowledge Graph
To run Neo4j in Docker:
```bash
cd "recommendation agent"
docker compose up -d neo4j
# Seed knowledge graph:
cd backend
python -m app.kg.seed_graph
```

### 2. Ollama Local LLM
```bash
# 1. Install Ollama from https://ollama.com
# 2. Pull Llama 3:
ollama pull llama3
# 3. Start server:
ollama serve
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description | Input Parameters |
|:---|:---|:---|:---|
| `POST` | `/soil` | Soil fertility prediction (XGBoost) | `nitrogen, phosphorus, potassium, ph, ec, organic_carbon, caco3, som, soil_depth` |
| `POST` | `/crop` | Crop recommendation (Random Forest) | `nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall` |
| `POST` | `/disease` | Plant disease detection (YOLOv11) | Leaf image file (`multipart/form-data`) |
| `POST` | `/deficiency` | Nutrient deficiency detection (YOLOv11) | Leaf image file (`multipart/form-data`) |
| `POST` | `/weather` | Weather forecast + Ag Impact analysis | `city` or `lat, lon` |
| `POST` | `/recommendation` | Full Montana Fertilizer Plan | Soil test + Climate + Crop + Previous legume |
| `POST` | `/chatbot` | AI Agronomist Chatbot | `message`, `context` (soil, crop, disease) |
| `GET` | `/knowledge-graph` | Neo4j nodes and relations | Query filters |

---

## 🌐 Frontend Pages Overview

| Page | URL Route | Description |
|:---|:---|:---|
| **Home** | `/` | System overview, modules, quick navigation |
| **Soil Analysis** | `/soil` | Enter soil test values $\rightarrow$ XGBoost fertility prediction |
| **Leaf Diagnosis** | `/leaf` | Upload leaf images $\rightarrow$ Disease & Deficiency detection |
| **Crop Recommendation**| `/crop` | Enter climate & soil $\rightarrow$ Ranked crop suitability list |
| **Fertilizer Plan** | `/fertilizer` | Unified fertilizer dosage calculator (Montana formulas) |
| **Weather Dashboard** | `/weather` | Live weather & farming advisories |
| **Knowledge Graph** | `/knowledge` | Interactive graph exploration of crops, nutrients & diseases |
| **AI Chatbot** | `/chatbot` | Conversational agronomic assistant with active context |
