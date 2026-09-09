import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, Send, RefreshCw, Droplets, Thermometer, Wind, CloudRain, CheckCircle2 } from 'lucide-react'
import { getCropRecommendation } from '../api/agriApi'
import useAgriStore from '../store/useAgriStore'
import { TRANSLATIONS } from '../i18n/translations'

const CROP_ICONS = {
  'rice': '🌾', 'wheat': '🌾', 'maize': '🌽', 'cotton': '🌿', 'sugarcane': '🎋',
  'jute': '🌱', 'coffee': '☕', 'tea': '🍵', 'rubber': '🌳', 'coconut': '🥥',
  'papaya': '🍈', 'orange': '🍊', 'apple': '🍎', 'muskmelon': '🍈', 'watermelon': '🍉',
  'grapes': '🍇', 'mango': '🥭', 'banana': '🍌', 'pomegranate': '🍎', 'lentil': '🫘',
  'blackgram': '🫘', 'mungbean': '🫘', 'mothbeans': '🫘', 'pigeonpeas': '🫘', 'kidneybeans': '🫘',
  'chickpea': '🫘',
}

const defaults = { nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 25.5, humidity: 80.4, ph: 6.5, rainfall: 202.9 }

const fields = [
  { key: 'nitrogen',    label: 'Nitrogen (N)',   unit: 'ppm',    icon: Leaf,        min: 0,  max: 200, step: 1   },
  { key: 'phosphorus',  label: 'Phosphorus (P)', unit: 'ppm',    icon: Leaf,        min: 0,  max: 100, step: 1   },
  { key: 'potassium',   label: 'Potassium (K)',  unit: 'ppm',    icon: Leaf,        min: 0,  max: 200, step: 1   },
  { key: 'temperature', label: 'Temperature',   unit: '°C',     icon: Thermometer, min: 0,  max: 50,  step: 0.1 },
  { key: 'humidity',    label: 'Humidity',       unit: '%',      icon: Droplets,    min: 0,  max: 100, step: 0.1 },
  { key: 'ph',          label: 'pH',             unit: '',       icon: Wind,        min: 3,  max: 10,  step: 0.1 },
  { key: 'rainfall',    label: 'Rainfall',       unit: 'mm',     icon: CloudRain,   min: 0,  max: 500, step: 0.1 },
]

export default function CropRecommendation() {
  const [form, setForm] = useState(defaults)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { cropResult, setCropResult, setSelectedCrop, language } = useAgriStore()
  const navigate = useNavigate()
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: parseFloat(val) || 0 }))

  const handleSelectForFertilizer = (crop) => {
    setSelectedCrop(crop)
    navigate('/fertilizer')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await getCropRecommendation(form)
      setCropResult(result)
    } catch (err) {
      setError('Backend offline — showing demo results.')
      setCropResult({
        recommended_crops: [
          { crop: 'rice',    suitability: 0.94, fertilizer: 'Urea + DAP', season: 'Kharif' },
          { crop: 'maize',   suitability: 0.82, fertilizer: 'NPK 20-20-0', season: 'Kharif' },
          { crop: 'cotton',  suitability: 0.71, fertilizer: 'DAP + MOP', season: 'Kharif' },
          { crop: 'wheat',   suitability: 0.65, fertilizer: 'Urea', season: 'Rabi' },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div className="badge badge-crop" style={{ display: 'inline-flex', marginBottom: 10 }}>
          <Leaf size={12} /> {t.crops}
        </div>
        <h1 className="page-title">{t.cropTitle}</h1>
        <div className="section-divider" />
        <p className="page-subtitle">{t.cropSubtitle}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '370px 1fr', gap: 24 }}>
        {/* Form */}
        <div className="glass animate-fade-in-up stagger-1" style={{ padding: 26, height: 'fit-content' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#1F3D1A' }}>
            <Leaf size={18} color="#3F6B35" /> {t.inputSoilClimate || 'Input Soil & Climate'}
          </h2>
          <form onSubmit={handleSubmit}>
            {fields.map(({ key, label, unit, min, max, step }) => (
              <div key={key} style={{ marginBottom: 15 }}>
                <label className="form-label">{t[key] || label} {unit && <span style={{ color: '#6E7F69' }}>({unit})</span>}</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="range" min={min} max={max} step={step} value={form[key]}
                    onChange={e => handleChange(key, e.target.value)}
                    style={{ flex: 1, accentColor: '#3F6B35' }}
                  />
                  <input
                    type="number" min={min} max={max} step={step} value={form[key]}
                    onChange={e => handleChange(key, e.target.value)}
                    className="form-input" style={{ width: 84 }}
                  />
                </div>
              </div>
            ))}

            {error && (
              <div style={{ background: 'rgba(181, 80, 42, 0.1)', border: '1px solid rgba(181, 80, 42, 0.3)', borderRadius: 8, padding: '10px 14px', color: '#B5502A', fontSize: '0.82rem', fontWeight: 600, marginBottom: 14 }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> {t.analyzing || 'Predicting...'}</> : <><Send size={14} /> {t.recommendCropsButton}</>}
              </button>
              <button type="button" onClick={() => setForm(defaults)} className="btn-icon" title="Reset defaults">
                <RefreshCw size={15} />
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div>
          {!cropResult ? (
            <div className="glass" style={{ padding: 48, textAlign: 'center', height: '100%', minHeight: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ fontSize: 48 }}>🌾</div>
              <h3 style={{ margin: 0, color: '#1F3D1A' }}>{t.suitableCrops || 'Awaiting Soil & Climate Inputs'}</h3>
              <p style={{ color: '#485A43', fontSize: '0.92rem', maxWidth: 360, margin: 0 }}>
                {t.cropSubtitle}
              </p>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: '0.88rem', color: '#485A43', fontWeight: 700, marginBottom: 2 }}>
                {t.suitableCrops} ({cropResult.recommended_crops?.length})
              </div>
              {cropResult.recommended_crops?.map(({ crop, suitability, fertilizer, season }, idx) => {
                const isTop = idx === 0
                return (
                  <div
                    key={crop}
                    className="glass card-hover"
                    style={{
                      padding: '20px 24px', cursor: 'pointer',
                      borderColor: isTop ? '#3F6B35' : 'rgba(31, 61, 26, 0.12)',
                      background: isTop ? 'rgba(63, 107, 53, 0.05)' : '#FFFFFF'
                    }}
                    onClick={() => setSelectedCrop(crop)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                      <span style={{ fontSize: '2rem' }}>{CROP_ICONS[crop.toLowerCase()] || '🌱'}</span>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'capitalize', color: '#1F3D1A' }}>
                          {crop} {isTop && <span className="badge badge-crop" style={{ fontSize: '0.72rem', verticalAlign: 'middle', marginLeft: 8 }}>{t.optimal || 'Top Recommendation'}</span>}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#6E7F69' }}>
                          {t.season || 'Season'}: {season} · {t.fertilizer || 'Fertilizer'}: {fertilizer}
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#3F6B35' }}>
                          {(suitability * 100).toFixed(0)}%
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#6E7F69' }}>{t.suitability || 'Suitability'}</div>
                      </div>
                    </div>
                    <div className="progress-track" style={{ marginBottom: 12 }}>
                      <div className="progress-fill" style={{ width: `${suitability * 100}%`, background: '#3F6B35' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectForFertilizer(crop) }}
                        className="btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                      >
                        ✓ {t.selectForFertilizer || 'Select for Fertilizer Plan'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
