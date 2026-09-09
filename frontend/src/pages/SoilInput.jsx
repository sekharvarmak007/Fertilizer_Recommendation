import { useState } from 'react'
import {
  FlaskConical, Send, RefreshCw, Info, TrendingUp, TrendingDown, CheckCircle2
} from 'lucide-react'
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import { analyzeSoil } from '../api/agriApi'
import useAgriStore from '../store/useAgriStore'
import { TRANSLATIONS } from '../i18n/translations'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const fields = [
  { key: 'nitrogen',      label: 'Nitrogen (N)',        unit: 'ppm', min: 0, max: 200, info: 'Major macronutrient for vegetative growth', step: 1 },
  { key: 'phosphorus',    label: 'Phosphorus (P)',       unit: 'ppm', min: 0, max: 100, info: 'Essential for root and flower development', step: 1 },
  { key: 'potassium',     label: 'Potassium (K)',        unit: 'ppm', min: 0, max: 200, info: 'Important for water regulation and disease resistance', step: 1 },
  { key: 'ph',            label: 'pH',                  unit: '',    min: 3, max: 10,  info: 'Soil acidity. Optimal range: 6.0–7.5', step: 0.1 },
  { key: 'ec',            label: 'EC (Electrical Cond.)',unit: 'dS/m',min: 0, max: 8,  info: 'Salinity indicator. Above 4 dS/m is high salinity', step: 0.01 },
  { key: 'organic_carbon',label: 'Organic Carbon (OC)', unit: '%',   min: 0, max: 5,  info: 'Soil organic carbon — higher is better', step: 0.01 },
  { key: 'caco3',         label: 'CaCO₃',               unit: '%',   min: 0, max: 30, info: 'Calcium carbonate percentage', step: 0.1 },
  { key: 'som',           label: 'SOM',                 unit: '%',   min: 0, max: 10, info: 'Soil Organic Matter — used in Montana formula', step: 0.1 },
  { key: 'soil_depth',    label: 'Soil Depth',          unit: 'in',  min: 0, max: 60, info: 'Sampling depth in inches', step: 1 },
]

const defaults = { nitrogen: 90, phosphorus: 42, potassium: 43, ph: 6.5, ec: 1.2, organic_carbon: 0.91, caco3: 4.5, som: 1.8, soil_depth: 12 }

// Nutrient Badges using Requested Gradient: Sand (#E8C79B) -> Loam (#B98A4E) -> Humus (#5C3A21)
const nutrientBadgeStyles = {
  'Low':           { bg: '#E8C79B', text: '#5A391D', border: '#D5B385' }, // Sand
  'Medium':        { bg: '#B98A4E', text: '#FFFFFF', border: '#9D7339' }, // Loam
  'Optimal':       { bg: '#3F6B35', text: '#FFFFFF', border: '#32572a' }, // Crop
  'Adequate':      { bg: '#3F6B35', text: '#FFFFFF', border: '#32572a' }, // Crop
  'Normal':        { bg: '#3F6B35', text: '#FFFFFF', border: '#32572a' }, // Crop
  'High':          { bg: '#5C3A21', text: '#EEF0E4', border: '#432814' }, // Humus
  'Acidic':        { bg: '#B5502A', text: '#FFFFFF', border: '#943F1E' }, // Clay
  'Alkaline':      { bg: '#B5502A', text: '#FFFFFF', border: '#943F1E' }, // Clay
  'High Salinity': { bg: '#B5502A', text: '#FFFFFF', border: '#943F1E' }, // Clay
  'Critical':      { bg: '#B5502A', text: '#FFFFFF', border: '#943F1E' }, // Clay
}

export default function SoilInput() {
  const [form, setForm] = useState(defaults)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { soilResult, setSoilResult, setSoilData, language } = useAgriStore()
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  const handleChange = (key, val) => {
    setForm(f => ({ ...f, [key]: val === '' ? '' : (parseFloat(val) || 0) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Normalize form numbers
    const cleanForm = {}
    Object.keys(form).forEach(k => {
      cleanForm[k] = parseFloat(form[k]) || 0
    })

    setSoilData(cleanForm)
    try {
      const result = await analyzeSoil(cleanForm)
      setSoilResult(result)
    } catch (err) {
      setError(err.message)
      setSoilResult({
        fertility_class: 'Medium',
        confidence: 0.87,
        nutrient_status: {
          nitrogen: form.nitrogen < 60 ? 'Low' : form.nitrogen > 120 ? 'High' : 'Optimal',
          phosphorus: form.phosphorus < 20 ? 'Low' : form.phosphorus > 60 ? 'High' : 'Optimal',
          potassium: form.potassium < 50 ? 'Low' : form.potassium > 150 ? 'High' : 'Optimal',
          ph: form.ph < 5.5 ? 'Acidic' : form.ph > 7.5 ? 'Alkaline' : 'Optimal',
          ec: form.ec > 4 ? 'High Salinity' : 'Normal',
          organic_carbon: form.organic_carbon < 0.5 ? 'Low' : 'Adequate',
        },
        montana_n_available: (form.nitrogen * 2 * form.soil_depth / 6).toFixed(1),
        recommendations: ['Apply NPK 20-20-0 @ 50 kg/acre', 'Consider agricultural lime if pH < 6.0', 'Add organic compost @ 2-3 t/acre to improve OC'],
      })
    } finally {
      setLoading(false)
    }
  }

  const radarData = {
    labels: [t.nitrogen || 'Nitrogen', t.phosphorus || 'Phosphorus', t.potassium || 'Potassium', t.ph || 'pH', t.ec || 'EC', t.organic_carbon || 'OC'],
    datasets: [{
      label: t.soilParams || 'Soil Nutrients',
      data: [
        (form.nitrogen / 200) * 100,
        (form.phosphorus / 100) * 100,
        (form.potassium / 200) * 100,
        ((form.ph - 3) / 7) * 100,
        Math.min((form.ec / 8) * 100, 100),
        (form.organic_carbon / 5) * 100,
      ],
      backgroundColor: 'rgba(63, 107, 53, 0.16)',
      borderColor: '#3F6B35',
      borderWidth: 2.5,
      pointBackgroundColor: '#3F6B35',
      pointBorderColor: '#EEF0E4',
      pointBorderWidth: 2,
      pointRadius: 5,
    }]
  }

  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        min: 0, max: 100,
        grid: { color: 'rgba(31, 61, 26, 0.15)' },
        angleLines: { color: 'rgba(31, 61, 26, 0.15)' },
        pointLabels: { color: '#1F3D1A', font: { size: 12, weight: '700' } },
        ticks: { display: false },
      }
    },
    plugins: { legend: { display: false } },
  }

  const getBadge = (status) => {
    const style = nutrientBadgeStyles[status] || { bg: '#B98A4E', text: '#FFFFFF', border: '#9D7339' }
    const translatedText = t[status.toLowerCase().replace(' ', '')] || t[status.toLowerCase()] || status
    return (
      <span style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        padding: '3px 10px',
        borderRadius: 100,
        fontSize: '0.76rem',
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4
      }}>
        {translatedText}
      </span>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div className="badge badge-crop" style={{ display: 'inline-flex', marginBottom: 10 }}>
          <FlaskConical size={12} /> {t.soil}
        </div>
        <h1 className="page-title">{t.soilTitle}</h1>
        <div className="section-divider" />
        <p className="page-subtitle">{t.soilSubtitle}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Form */}
        <div className="glass animate-fade-in-up stagger-1" style={{ padding: 28 }}>
          <h2 style={{ margin: '0 0 22px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FlaskConical size={18} color="#3F6B35" /> {t.soilParams}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
              {fields.map(({ key, label, unit, min, max, info, step }) => (
                <div key={key} className="tooltip" data-tooltip={info}>
                  <label className="form-label">{t[key] || label} {unit && <span style={{ color: '#6E7F69' }}>({unit})</span>}</label>
                  <input
                    type="number" min={min} max={max} step={step}
                    value={form[key]} onChange={e => handleChange(key, e.target.value)}
                    className="form-input"
                  />
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background: 'rgba(181, 80, 42, 0.1)', border: '1px solid rgba(181, 80, 42, 0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#B5502A', fontSize: '0.84rem', fontWeight: 600 }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t.analyzing || 'Processing...'}</> : <><Send size={15} /> {t.analyzeButton}</>}
              </button>
              <button type="button" onClick={() => setForm(defaults)} className="btn-icon" title="Reset defaults">
                <RefreshCw size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Radar & Summary */}
        <div className="glass animate-fade-in-up stagger-2" style={{ padding: 28 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Info size={18} color="#2F5E73" /> {t.nutrientRadar}
          </h2>
          <div style={{ height: 280 }}>
            <Radar data={radarData} options={radarOptions} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
            {[['N', form.nitrogen, 'ppm'], ['P', form.phosphorus, 'ppm'], ['K', form.potassium, 'ppm'], ['pH', form.ph, ''], ['EC', form.ec, 'dS/m'], ['OC', form.organic_carbon, '%']].map(([label, val, unit]) => (
              <div key={label} style={{ background: '#F2F5EB', border: '1px solid rgba(31, 61, 26, 0.1)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#6E7F69', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '1.08rem', fontWeight: 800, color: '#1F3D1A' }}>{val}<span style={{ fontSize: '0.7rem', color: '#6E7F69' }}> {unit}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {soilResult && (
        <div className="animate-fade-in" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="glass" style={{ padding: 28 }}>
            <h3 style={{ margin: '0 0 18px', fontSize: '1.02rem', fontWeight: 700 }}>{t.fertilityAssessment}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: nutrientBadgeStyles[soilResult.fertility_class]?.bg || '#B98A4E',
                color: nutrientBadgeStyles[soilResult.fertility_class]?.text || '#FFFFFF',
                border: `3px solid ${nutrientBadgeStyles[soilResult.fertility_class]?.border || '#9D7339'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(31, 61, 26, 0.12)'
              }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 }}>{t.fertility || 'Fertility'}</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900 }}>{soilResult.fertility_class}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#485A43', marginBottom: 6, fontWeight: 600 }}>{t.confidenceScore || 'Confidence Score (XGBoost)'}</div>
                <div className="progress-track" style={{ width: 170 }}>
                  <div className="progress-fill" style={{ width: `${(soilResult.confidence || 0) * 100}%`, background: 'linear-gradient(90deg, #3F6B35, #2F5E73)' }} />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1F3D1A', marginTop: 4 }}>
                  {((soilResult.confidence || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="glass" style={{ padding: 28 }}>
            <h3 style={{ margin: '0 0 18px', fontSize: '1.02rem', fontWeight: 700 }}>{t.nutrientStatus}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {soilResult.nutrient_status && Object.entries(soilResult.nutrient_status).map(([nutrient, status]) => (
                <div key={nutrient} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: '#F4F7EE', border: '1px solid rgba(31, 61, 26, 0.08)', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.88rem', textTransform: 'capitalize', color: '#1F3D1A', fontWeight: 600 }}>{nutrient.replace('_', ' ')}</span>
                  {getBadge(status)}
                </div>
              ))}
            </div>
          </div>

          {soilResult.recommendations && (
            <div className="glass" style={{ padding: 28, gridColumn: '1 / -1' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.02rem', fontWeight: 700 }}>{t.recommendations}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {soilResult.recommendations.map((r, i) => (
                  <div key={i} style={{ background: 'rgba(63, 107, 53, 0.1)', border: '1px solid rgba(63, 107, 53, 0.25)', borderRadius: 10, padding: '10px 16px', fontSize: '0.88rem', color: '#1F3D1A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color="#3F6B35" style={{ flexShrink: 0 }} />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
