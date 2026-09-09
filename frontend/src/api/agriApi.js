import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 120s — Gemini Vision image analysis can take up to 60s
})

// Request interceptor
api.interceptors.request.use((config) => {
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error?.response?.data?.detail || error.message || 'Unknown error'
    return Promise.reject(new Error(msg))
  }
)

// ─── Soil ─────────────────────────────────────────────
export const analyzeSoil = (data) => api.post('/soil', data)

// ─── Crop ─────────────────────────────────────────────
export const getCropRecommendation = (data) => api.post('/crop', data)

// ─── Disease Detection ────────────────────────────────
export const detectDisease = (imageFile) => {
  const form = new FormData()
  form.append('file', imageFile)
  return api.post('/disease', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// ─── Deficiency Detection ─────────────────────────────
export const detectDeficiency = (imageFile) => {
  const form = new FormData()
  form.append('file', imageFile)
  return api.post('/deficiency', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// ─── Weather ──────────────────────────────────────────
export const getWeather = (city) => api.post('/weather', { city })

// ─── Full Recommendation ──────────────────────────────
export const getRecommendation = (data) => api.post('/recommendation', data)

// ─── AI Chatbot ───────────────────────────────────────
export const sendChatMessage = (message, context = {}) =>
  api.post('/chatbot', { message, context })

// ─── Knowledge Graph ──────────────────────────────────
export const getKnowledgeGraph = () => api.get('/knowledge-graph')
