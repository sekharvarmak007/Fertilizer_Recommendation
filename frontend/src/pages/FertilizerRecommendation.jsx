import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Sprout, RefreshCw, Calculator, Clock, Droplets, Sun, Beaker, CheckCircle2,
  AlertTriangle, Sparkles, Bot, ArrowRight, ShieldAlert, FileText, Check, ChevronDown
} from 'lucide-react'
import { getRecommendation } from '../api/agriApi'
import useAgriStore from '../store/useAgriStore'
import { TRANSLATIONS } from '../i18n/translations'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

// Comprehensive Crop Nutrient Profiles (Montana Agronomic Benchmarks)
export const CROP_DATABASE = {
  rice: {
    name: 'Rice', icon: '🌾', season: 'Kharif',
    n_req: 125, p_req: 60, k_req: 40,
    fertilizer: 'Urea (46-0-0) + DAP (18-46-0) + MOP (0-0-60)',
    method: 'Broadcast and incorporate into puddled soil; split top-dress at active tillering and panicle initiation',
    schedule: [
      { timing: 'Basal (Transplanting)', action: 'Apply 50% Urea + 100% DAP + 50% MOP' },
      { timing: 'Tillering (30 DAT)', action: 'Apply 30% Urea top-dressing into moist soil' },
      { timing: 'Panicle Init. (60 DAT)', action: 'Apply remaining 20% Urea + 50% MOP' },
    ]
  },
  wheat: {
    name: 'Wheat', icon: '🌿', season: 'Rabi',
    n_req: 120, p_req: 60, k_req: 40,
    fertilizer: 'Urea (46-0-0) + DAP (18-46-0) + MOP (0-0-60)',
    method: 'Broadcast and incorporate at sowing; top-dress with first and second crown-root irrigations',
    schedule: [
      { timing: 'At Sowing (Basal)', action: 'Apply 50% Urea + 100% DAP + 100% MOP' },
      { timing: 'Crown Root (40 DAS)', action: 'Apply 30% Urea top-dressing after irrigation' },
      { timing: 'Boot Stage (75 DAS)', action: 'Apply remaining 20% Urea' },
    ]
  },
  maize: {
    name: 'Maize', icon: '🌽', season: 'Kharif / Rabi',
    n_req: 150, p_req: 75, k_req: 50,
    fertilizer: 'Urea + DAP + MOP + Zinc Sulfate',
    method: 'Band placement 5 cm to the side and 5 cm below seed depth; side-dress at knee-high and tasseling',
    schedule: [
      { timing: 'At Sowing (Basal)', action: 'Apply 33% Urea + 100% DAP + 100% MOP in bands' },
      { timing: 'Knee-High Stage (30 DAS)', action: 'Side-dress 33% Urea 10 cm from plant rows' },
      { timing: 'Tasseling Stage (55 DAS)', action: 'Apply final 34% Urea top-dressing' },
    ]
  },
  cotton: {
    name: 'Cotton', icon: '🌱', season: 'Kharif',
    n_req: 100, p_req: 50, k_req: 50,
    fertilizer: 'DAP (18-46-0) + MOP (0-0-60) + Urea (Split)',
    method: 'Apply in furrow at planting; split top-dress at square formation and peak boll development',
    schedule: [
      { timing: 'At Planting (Basal)', action: 'Apply 30% Urea + 100% DAP + 50% MOP' },
      { timing: 'Square Stage (45 DAS)', action: 'Apply 40% Urea + 50% MOP top-dressing' },
      { timing: 'Boll Development (75 DAS)', action: 'Apply remaining 30% Urea' },
    ]
  },
  sugarcane: {
    name: 'Sugarcane', icon: '🎋', season: 'Annual',
    n_req: 200, p_req: 80, k_req: 100,
    fertilizer: 'Urea (Heavy Split) + SSP + MOP',
    method: 'Furrow application at planting followed by 3 split doses along irrigation rows',
    schedule: [
      { timing: 'Planting (Basal)', action: 'Apply 25% Urea + 100% SSP + 50% MOP in furrows' },
      { timing: 'Tillering (45 DAP)', action: 'Apply 35% Urea top-dressing' },
      { timing: 'Grand Growth (90 DAP)', action: 'Apply 40% Urea + 50% MOP followed by earthing up' },
    ]
  },
  groundnut: {
    name: 'Groundnut', icon: '🥜', season: 'Kharif',
    n_req: 35, p_req: 60, k_req: 40,
    fertilizer: 'Single Superphosphate (SSP) + Gypsum + MOP',
    method: 'Basal placement of P & K; apply Gypsum at 45 days at flowering/pegging zone',
    schedule: [
      { timing: 'At Sowing (Basal)', action: 'Apply 100% SSP + 100% MOP + Starter Urea (35 kg/acre)' },
      { timing: 'Pegging Stage (45 DAS)', action: 'Apply Agricultural Gypsum @ 200 kg/acre in root zone' },
    ]
  },
  banana: {
    name: 'Banana', icon: '🍌', season: 'Perennial',
    n_req: 180, p_req: 90, k_req: 150,
    fertilizer: 'Urea + MOP + DAP (High Potassium Feeder)',
    method: 'Ring application 30 cm away from pseudo-stem or fertigation in 4 split cycles',
    schedule: [
      { timing: 'Vegetative (2nd Month)', action: 'Apply 25% Urea + 50% DAP + 25% MOP' },
      { timing: 'Shooting (5th Month)', action: 'Apply 35% Urea + 50% DAP + 35% MOP' },
      { timing: 'Bunch Dev. (8th Month)', action: 'Apply 40% Urea + 40% MOP' },
    ]
  },
  potato: {
    name: 'Potato', icon: '🥔', season: 'Rabi',
    n_req: 160, p_req: 80, k_req: 120,
    fertilizer: 'Urea + DAP + MOP (High Nutrient Feeder)',
    method: 'Apply basal fertilizer in furrows before planting; top-dress at earthing-up (30 DAS)',
    schedule: [
      { timing: 'At Planting (Basal)', action: 'Apply 50% Urea + 100% DAP + 100% MOP' },
      { timing: 'Earthing Up (30 DAS)', action: 'Apply remaining 50% Urea top-dressing' },
    ]
  },
  tomato: {
    name: 'Tomato', icon: '🍅', season: 'Rabi / Kharif',
    n_req: 140, p_req: 70, k_req: 90,
    fertilizer: 'NPK 19-19-19 + Calcium Nitrate + Micronutrients',
    method: 'Basal application at bed preparation; fertigate soluble NPK in weekly splits',
    schedule: [
      { timing: 'Basal Bed Prep', action: 'Apply 40% Urea + 100% DAP + 50% MOP' },
      { timing: 'Flowering Stage (30 DAT)', action: 'Apply 30% Urea + 50% MOP + Foliar Boron' },
      { timing: 'Fruit Set (60 DAT)', action: 'Apply remaining 30% Urea + Calcium Nitrate spray' },
    ]
  },
  coffee: {
    name: 'Coffee', icon: '☕', season: 'Perennial',
    n_req: 140, p_req: 60, k_req: 120,
    fertilizer: 'NPK Complex (17-17-17) + MOP',
    method: 'Circular basin application under foliage canopy post-blossom and post-monsoon',
    schedule: [
      { timing: 'Pre-Monsoon (May)', action: 'Apply 50% Urea + 100% DAP + 50% MOP in drip circle' },
      { timing: 'Post-Monsoon (Oct)', action: 'Apply remaining 50% Urea + 50% MOP' },
    ]
  },
  jute: {
    name: 'Jute', icon: '🌾', season: 'Kharif',
    n_req: 110, p_req: 50, k_req: 60,
    fertilizer: 'Urea + SSP + MOP',
    method: 'Broadcast basal dose; top-dress urea in 2 splits after weeding and thinning',
    schedule: [
      { timing: 'At Sowing (Basal)', action: 'Apply 30% Urea + 100% SSP + 100% MOP' },
      { timing: 'After 1st Weeding (3 weeks)', action: 'Apply 35% Urea top-dressing' },
      { timing: 'Active Growth (6 weeks)', action: 'Apply remaining 35% Urea' },
    ]
  },
  soybean: {
    name: 'Soybean', icon: '🌱', season: 'Kharif',
    n_req: 20, p_req: 40, k_req: 40,
    fertilizer: 'DAP (18-46-0) + Rhizobium Inoculant',
    method: 'Drill placement below seed level at sowing; N is fixed biologically by root nodules',
    schedule: [
      { timing: 'At Sowing (Basal)', action: 'Apply 100% DAP + 100% MOP (Fixes atmospheric Nitrogen)' },
    ]
  },
}

// Simple markdown formatter for Gemini response
function MarkdownView({ content }) {
  if (!content) return null
  const lines = content.split('\n')

  return (
    <div style={{ fontSize: '0.92rem', lineHeight: 1.7, color: '#1F3D1A' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={idx} style={{ height: 8 }} />

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} style={{ margin: '14px 0 6px', fontSize: '1.05rem', fontWeight: 800, color: '#1F3D1A', display: 'flex', alignItems: 'center', gap: 6 }}>
              {trimmed.replace('### ', '')}
            </h4>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} style={{ margin: '18px 0 8px', fontSize: '1.15rem', fontWeight: 800, color: '#1F3D1A', borderBottom: '1px solid rgba(31, 61, 26, 0.12)', paddingBottom: 4 }}>
              {trimmed.replace('## ', '')}
            </h3>
          )
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} style={{ margin: '20px 0 10px', fontSize: '1.25rem', fontWeight: 900, color: '#1F3D1A' }}>
              {trimmed.replace('# ', '')}
            </h2>
          )
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.substring(2)
          return (
            <div key={idx} style={{ display: 'flex', gap: 8, margin: '4px 0', alignItems: 'flex-start' }}>
              <span style={{ color: '#3F6B35', fontWeight: 900, fontSize: '1rem', lineHeight: 1.3 }}>•</span>
              <div>{renderFormattedText(itemText)}</div>
            </div>
          )
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const number = trimmed.match(/^(\d+\.)\s/)[1]
          const itemText = trimmed.replace(/^\d+\.\s/, '')
          return (
            <div key={idx} style={{ display: 'flex', gap: 8, margin: '6px 0', alignItems: 'flex-start' }}>
              <span style={{ color: '#2F5E73', fontWeight: 800, minWidth: 20 }}>{number}</span>
              <div>{renderFormattedText(itemText)}</div>
            </div>
          )
        }

        return (
          <p key={idx} style={{ margin: '6px 0' }}>
            {renderFormattedText(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

function renderFormattedText(text) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#1F3D1A', fontWeight: 800 }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{ background: '#EEF0E4', color: '#B5502A', padding: '2px 6px', borderRadius: 4, fontSize: '0.85em', fontWeight: 700 }}>
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

export default function FertilizerRecommendation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [graphMode, setGraphMode] = useState('balance') // 'balance' | 'dosage' | 'soil_ppm'

  const {
    recommendation, setRecommendation,
    soilData, soilResult,
    diseaseResult, deficiencyResult,
    cropResult, selectedCrop, setSelectedCrop,
    weatherData, language
  } = useAgriStore()
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  // Target crop can be dynamically switched by the user right here
  const initialCrop = (selectedCrop || cropResult?.recommended_crops?.[0]?.crop || 'rice').toLowerCase()
  const [activeCropKey, setActiveCropKey] = useState(initialCrop)

  // User input soil values (live from session or defaults)
  const userN = soilData?.nitrogen !== undefined ? Number(soilData.nitrogen) : 90
  const userP = soilData?.phosphorus !== undefined ? Number(soilData.phosphorus) : 42
  const userK = soilData?.potassium !== undefined ? Number(soilData.potassium) : 43
  const userPH = soilData?.ph !== undefined ? Number(soilData.ph) : 6.5
  const userSOM = soilData?.som !== undefined ? Number(soilData.som) : 1.8
  const userDepth = soilData?.soil_depth !== undefined ? Number(soilData.soil_depth) : 12

  // Get active crop profile
  const cropProfile = CROP_DATABASE[activeCropKey] || CROP_DATABASE.rice

  // Dynamic Montana calculation directly based on user's field inputs and selected crop
  const dynamicCalc = useMemo(() => {
    // 1. Available Soil Nutrients (lb/acre)
    const availN = Math.round((userN * 2 * userDepth / 6) * 10) / 10
    const availP = Math.round((userP / 3.5) * 10) / 10
    const availK = Math.round((userK / 3.0) * 10) / 10

    // 2. SOM Adjustment
    const somAdj = userSOM < 1.0 ? 20 : (userSOM > 3.0 ? -20 : 0)

    // 3. Net Fertilizer Deficit Needed (lb/acre) - strictly clamped to 0 if soil has excess
    const deficitN = Math.max(0, Math.round((cropProfile.n_req + somAdj - availN) * 10) / 10)
    const deficitP = Math.max(0, Math.round((cropProfile.p_req - availP) * 10) / 10)
    const deficitK = Math.max(0, Math.round((cropProfile.k_req - availK) * 10) / 10)

    // 4. Commercial Fertilizer Dosages (kg/acre)
    const ureaKg = Math.round((deficitN / 0.46) * 0.4536 * 10) / 10
    const mapKg = Math.round((cropProfile.p_req / 0.52) * 0.4536 * 10) / 10
    const mopKg = Math.round((cropProfile.k_req / 0.61) * 0.4536 * 10) / 10

    return {
      availN, availP, availK, somAdj,
      deficitN, deficitP, deficitK,
      ureaKg, mapKg, mopKg,
      totalNReq: cropProfile.n_req,
      p2o5Req: cropProfile.p_req,
      k2oReq: cropProfile.k_req,
    }
  }, [userN, userP, userK, userSOM, userDepth, cropProfile])

  // Handle crop change
  const handleCropChange = (cropKey) => {
    const key = cropKey.toLowerCase()
    setActiveCropKey(key)
    setSelectedCrop(CROP_DATABASE[key]?.name || cropKey)
  }

  // Generate Gemini AI recommendation for the currently selected crop
  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    const payload = {
      crop: cropProfile.name,
      crop_suitability: cropResult?.recommended_crops?.find(c => c.crop.toLowerCase() === activeCropKey)?.suitability || 0.92,
      soil_data: {
        nitrogen: userN,
        phosphorus: userP,
        potassium: userK,
        ph: userPH,
        som: userSOM,
        soil_depth: userDepth,
        fertility_class: soilResult?.fertility_class || 'Medium',
      },
      leaf_data: {
        disease_label: diseaseResult?.disease || 'Healthy',
        disease_confidence: diseaseResult?.confidence || 0,
        deficiency_type: deficiencyResult?.deficiency || 'Healthy',
        deficiency_confidence: deficiencyResult?.confidence || 0,
      },
      crop_data: {
        selected_crop: cropProfile.name,
        recommended_crops: cropResult?.recommended_crops || [],
      },
      weather_data: weatherData || {
        temperature: 26.5,
        humidity: 78.0,
        rainfall: 0.0,
      },
      language: language || 'en',
    }

    try {
      const result = await getRecommendation(payload)
      setRecommendation(result)
    } catch (err) {
      setError(err.message || 'Failed to generate recommendation.')
    } finally {
      setLoading(false)
    }
  }

  const rec = recommendation

  // Dynamic Chart Data strictly computed for the user-selected crop and inputs
  const barData = useMemo(() => {
    if (graphMode === 'dosage') {
      return {
        labels: ['Urea (46% N)', 'MAP (52% P₂O₅)', 'MOP (60% K₂O)'],
        datasets: [
          {
            label: `Prescribed Dosage for ${cropProfile.name} (kg/acre)`,
            data: [dynamicCalc.ureaKg, dynamicCalc.mapKg, dynamicCalc.mopKg],
            backgroundColor: ['#3F6B35', '#2F5E73', '#5C3A21'],
            borderColor: ['#32572a', '#244858', '#432814'],
            borderWidth: 1.5,
            borderRadius: 8,
          },
        ],
      }
    }

    if (graphMode === 'soil_ppm') {
      return {
        labels: ['Nitrogen (ppm)', 'Phosphorus (ppm)', 'Potassium (ppm)'],
        datasets: [
          {
            label: 'Your Tested Soil Value (ppm)',
            data: [userN, userP, userK],
            backgroundColor: '#E8C79B',
            borderColor: '#B98A4E',
            borderWidth: 1.5,
            borderRadius: 8,
          },
          {
            label: `Optimal Target for ${cropProfile.name} (ppm)`,
            data: [Math.round(cropProfile.n_req * 0.8), Math.round(cropProfile.p_req * 0.75), Math.round(cropProfile.k_req * 1.5)],
            backgroundColor: '#3F6B35',
            borderColor: '#32572a',
            borderWidth: 1.5,
            borderRadius: 8,
          },
        ],
      }
    }

    // Default: Nutrient Balance View (lb/acre)
    return {
      labels: ['Nitrogen (N)', 'Phosphorus (P₂O₅)', 'Potassium (K₂O)'],
      datasets: [
        {
          label: `Crop Demand (${cropProfile.name})`,
          data: [dynamicCalc.totalNReq, dynamicCalc.p2o5Req, dynamicCalc.k2oReq],
          backgroundColor: '#3F6B35',
          borderColor: '#32572a',
          borderWidth: 1.5,
          borderRadius: 8,
        },
        {
          label: 'Available in Soil (Your Test)',
          data: [dynamicCalc.availN, dynamicCalc.availP, dynamicCalc.availK],
          backgroundColor: '#E8C79B',
          borderColor: '#B98A4E',
          borderWidth: 1.5,
          borderRadius: 8,
        },
        {
          label: 'Net Fertilizer Deficit Needed',
          data: [dynamicCalc.deficitN, dynamicCalc.deficitP, dynamicCalc.deficitK],
          backgroundColor: '#2F5E73',
          borderColor: '#244858',
          borderWidth: 1.5,
          borderRadius: 8,
        },
      ],
    }
  }, [graphMode, dynamicCalc, cropProfile, userN, userP, userK])

  const barOptions = {
    responsive: true,
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#1F3D1A',
          font: { size: 11, weight: '700' },
          boxWidth: 14,
          boxHeight: 14,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1F3D1A',
        titleColor: '#EEF0E4',
        bodyColor: '#E8C79B',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const unit = graphMode === 'dosage' ? 'kg/acre' : (graphMode === 'soil_ppm' ? 'ppm' : 'lb/acre')
            return ` ${context.dataset.label}: ${context.raw} ${unit}`
          }
        }
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(31, 61, 26, 0.08)' },
        ticks: { color: '#1F3D1A', font: { weight: '700', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(31, 61, 26, 0.08)' },
        ticks: { color: '#485A43', font: { weight: '600' } },
      },
    },
  }

  const hasSoil = Boolean(soilData || soilResult)
  const hasLeaf = Boolean(diseaseResult || deficiencyResult)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <div className="badge badge-crop" style={{ display: 'inline-flex', marginBottom: 10 }}>
          <Sprout size={12} /> Module 4 · Precision Fertilizer & AI Agronomist
        </div>
        <h1 className="page-title">{t.fertilizerTitle}</h1>
        <div className="section-divider" />
        <p className="page-subtitle">
          Dynamically computes Montana State University nutrient equations and invokes Google Gemini AI for your selected crop based on live soil chemometrics.
        </p>
      </div>

      {/* Multimodal Connected State Banner with Crop Selector */}
      <div className="glass animate-fade-in-up" style={{ padding: '16px 20px', marginBottom: 22, border: '1.5px solid rgba(31, 61, 26, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: '0.76rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Connected Multimodal Session Inputs:
          </div>

          {/* Quick Crop Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1F3D1A' }}>Switch Target Crop:</span>
            <select
              value={activeCropKey}
              onChange={(e) => handleCropChange(e.target.value)}
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #3F6B35',
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#1F3D1A',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {Object.entries(CROP_DATABASE).map(([k, c]) => (
                <option key={k} value={k}>
                  {c.icon} {c.name} ({c.n_req}N / {c.p_req}P / {c.k_req}K)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Connected Context Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {/* Soil Input Status */}
          <Link to="/soil" style={{ textDecoration: 'none' }}>
            <div style={{ background: hasSoil ? 'rgba(63, 107, 53, 0.08)' : '#F4F7EE', border: `1px solid ${hasSoil ? '#3F6B35' : 'rgba(31, 61, 26, 0.1)'}`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasSoil ? '#3F6B35' : '#B98A4E' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1F3D1A' }}>1. Soil Analyzer</div>
                <div style={{ fontSize: '0.68rem', color: '#485A43' }}>
                  N:{userN} · P:{userP} · K:{userK} · pH:{userPH}
                </div>
              </div>
            </div>
          </Link>

          {/* Leaf Vision Status */}
          <Link to="/leaf" style={{ textDecoration: 'none' }}>
            <div style={{ background: hasLeaf ? 'rgba(181, 80, 42, 0.08)' : '#F4F7EE', border: `1px solid ${hasLeaf ? '#B5502A' : 'rgba(31, 61, 26, 0.1)'}`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasLeaf ? '#B5502A' : '#B98A4E' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1F3D1A' }}>2. Leaf Scanner</div>
                <div style={{ fontSize: '0.68rem', color: '#485A43' }}>
                  {diseaseResult ? `${diseaseResult.disease}` : (deficiencyResult ? `${deficiencyResult.deficiency}` : 'Healthy / Clean')}
                </div>
              </div>
            </div>
          </Link>

          {/* Target Crop Active Card */}
          <div style={{ background: 'rgba(63, 107, 53, 0.08)', border: '1.5px solid #3F6B35', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3F6B35' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1F3D1A' }}>3. Target Crop (Active)</div>
              <div style={{ fontSize: '0.72rem', color: '#3F6B35', fontWeight: 800 }}>
                {cropProfile.icon} {cropProfile.name} ({cropProfile.season})
              </div>
            </div>
          </div>

          {/* Weather Status */}
          <Link to="/weather" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'rgba(47, 94, 115, 0.08)', border: '1px solid #2F5E73', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2F5E73' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1F3D1A' }}>4. Live Weather</div>
                <div style={{ fontSize: '0.68rem', color: '#2F5E73', fontWeight: 700 }}>
                  {weatherData ? `${weatherData.city || 'Loaded'} (${weatherData.temperature}°C)` : 'Default Weather'}
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Crop Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(31, 61, 26, 0.08)' }}>
          <span style={{ fontSize: '0.72rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase' }}>Quick Switch Crop:</span>
          {Object.entries(CROP_DATABASE).map(([k, c]) => (
            <button
              key={k}
              onClick={() => handleCropChange(k)}
              style={{
                border: `1px solid ${activeCropKey === k ? '#3F6B35' : 'rgba(31, 61, 26, 0.15)'}`,
                background: activeCropKey === k ? '#3F6B35' : '#FFFFFF',
                color: activeCropKey === k ? '#FFFFFF' : '#1F3D1A',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 100,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Primary Dynamic Prescription Card */}
        <div className="glass" style={{ padding: 28, borderColor: '#3F6B35', background: 'rgba(63, 107, 53, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div className="badge badge-crop" style={{ marginBottom: 10 }}>
                {cropProfile.icon} Precision Nutrient Prescription for {cropProfile.name}
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#1F3D1A', marginBottom: 4 }}>
                {cropProfile.fertilizer}
              </div>
              <div style={{ color: '#485A43', fontSize: '0.92rem' }}>
                Montana Guidelines for <strong style={{ color: '#1F3D1A' }}>{cropProfile.name}</strong> ({cropProfile.season} Season)
              </div>
            </div>

            {[
              { label: 'Urea (46-0-0)', value: `${dynamicCalc.ureaKg} kg/acre`, sub: `Deficit: ${dynamicCalc.deficitN} lb N`, icon: Beaker, color: '#3F6B35' },
              { label: 'MAP (11-52-0)', value: `${dynamicCalc.mapKg} kg/acre`, sub: `Crop Req: ${cropProfile.p_req} lb P₂O₅`, icon: Droplets, color: '#2F5E73' },
              { label: 'MOP (0-0-60)', value: `${dynamicCalc.mopKg} kg/acre`, sub: `Crop Req: ${cropProfile.k_req} lb K₂O`, icon: Clock, color: '#5C3A21' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} style={{ background: '#FFFFFF', border: '1px solid rgba(31, 61, 26, 0.12)', borderRadius: 12, padding: '16px 20px', minWidth: 160, textAlign: 'center', boxShadow: '0 2px 8px rgba(31, 61, 26, 0.04)' }}>
                <Icon size={20} color={color} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: '0.72rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 900, color: '#1F3D1A', fontSize: '1.08rem' }}>{value}</div>
                <div style={{ fontSize: '0.68rem', color: '#6E7F69', marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown & Dynamic Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Montana Calculations Table for Active Crop */}
          <div className="glass" style={{ padding: 28 }}>
            <h3 style={{ margin: '0 0 18px', fontSize: '1.02rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: '#1F3D1A' }}>
              <Calculator size={18} color="#3F6B35" /> Montana Equations ({cropProfile.name})
            </h3>
            <table className="data-table">
              <tbody>
                {[
                  [`Total N Required (${cropProfile.name} Demand)`, `${dynamicCalc.totalNReq} lb/acre`],
                  ['Soil Available N (from User Lab Test)', `${dynamicCalc.availN} lb/acre`],
                  ['Organic Matter (SOM) Adjustment', `${dynamicCalc.somAdj > 0 ? '+' : ''}${dynamicCalc.somAdj} lb/acre`],
                  ['Net Fertilizer N Required (Deficit)', `${dynamicCalc.deficitN} lb/acre`],
                  ['Urea Application Dose (46% N)', `${dynamicCalc.ureaKg} kg/acre`],
                  [`MAP Application Dose (${cropProfile.name} P₂O₅)`, `${dynamicCalc.mapKg} kg/acre`],
                  [`MOP Application Dose (${cropProfile.name} K₂O)`, `${dynamicCalc.mopKg} kg/acre`],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: '#485A43', fontWeight: 600 }}>{k}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#1F3D1A' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Real-time Dynamic Analysis Graph */}
          <div className="glass" style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: '#1F3D1A' }}>
                <Sun size={18} color="#2F5E73" /> {t.fieldAnalytics || 'Field Analytics & Nutrient Graph'}
              </h3>

              {/* Graph Mode Switcher */}
              <div style={{ display: 'flex', background: '#F4F7EE', borderRadius: 8, padding: 3, gap: 4, border: '1px solid rgba(31, 61, 26, 0.1)' }}>
                <button
                  onClick={() => setGraphMode('balance')}
                  style={{
                    border: 'none',
                    background: graphMode === 'balance' ? '#3F6B35' : 'transparent',
                    color: graphMode === 'balance' ? '#FFFFFF' : '#485A43',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.nutrientBalance || 'Nutrient Balance'}
                </button>
                <button
                  onClick={() => setGraphMode('dosage')}
                  style={{
                    border: 'none',
                    background: graphMode === 'dosage' ? '#3F6B35' : 'transparent',
                    color: graphMode === 'dosage' ? '#FFFFFF' : '#485A43',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.fertilizerDosages || 'Fertilizer Dosages'}
                </button>
                <button
                  onClick={() => setGraphMode('soil_ppm')}
                  style={{
                    border: 'none',
                    background: graphMode === 'soil_ppm' ? '#3F6B35' : 'transparent',
                    color: graphMode === 'soil_ppm' ? '#FFFFFF' : '#485A43',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.userSoilPpm || 'User Soil (ppm)'}
                </button>
              </div>
            </div>

            {/* Dynamic Status Header over Graph */}
            <div style={{ background: '#F7F9F1', border: '1px solid rgba(31, 61, 26, 0.1)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: '0.75rem', color: '#485A43', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <div>
                <strong style={{ color: '#1F3D1A' }}>{t.soilParams || 'User Tested Fields'}:</strong> N: <strong>{userN} ppm</strong> · P: <strong>{userP} ppm</strong> · K: <strong>{userK} ppm</strong> · pH: <strong>{userPH}</strong>
              </div>
              <div style={{ color: '#3F6B35', fontWeight: 800 }}>
                {cropProfile.icon} {cropProfile.name}
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 240 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        {/* Gemini AI Agronomist Action Button & Prescription */}
        <div className="glass" style={{ padding: 28, background: '#FFFFFF', border: '1.5px solid rgba(63, 107, 53, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: rec ? 18 : 0 }}>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1F3D1A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={22} color="#3F6B35" /> {t.generateGeminiAI || 'Deep Gemini AI Agronomist Synthesis'} ({cropProfile.name})
              </div>
              <div style={{ fontSize: '0.8rem', color: '#485A43', marginTop: 2 }}>
                {t.fertilizerSubtitle}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary"
              style={{ fontSize: '0.92rem', padding: '10px 24px', gap: 8 }}
            >
              {loading ? (
                <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t.analyzing || 'Analyzing with Gemini AI...'}</>
              ) : (
                <><Sparkles size={16} /> {t.generateGeminiAI || 'Generate Gemini AI Plan'} ({cropProfile.name})</>
              )}
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(181, 80, 42, 0.1)', border: '1px solid rgba(181, 80, 42, 0.3)', borderRadius: 8, padding: '10px 14px', color: '#B5502A', fontSize: '0.85rem', fontWeight: 600, marginTop: 14 }}>
              ⚠ {error}
            </div>
          )}

          {rec?.ai_prescription && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(31, 61, 26, 0.1)' }}>
              <div className="badge badge-crop" style={{ marginBottom: 12, fontSize: '0.74rem' }}>
                <Sparkles size={12} /> Powered by Google Gemini ({rec.ai_model || 'gemini-flash-latest'})
              </div>
              <MarkdownView content={rec.ai_prescription} />
            </div>
          )}
        </div>

        {/* Application Schedule for Active Crop */}
        <div className="glass" style={{ padding: 26 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.02rem', fontWeight: 800, color: '#1F3D1A' }}>
            📅 {t.dosagePlan || 'Recommended Application Timeline'} ({cropProfile.name})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {cropProfile.schedule.map((s, idx) => (
              <div key={idx} style={{ background: '#F4F7EE', border: '1px solid rgba(31, 61, 26, 0.1)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: '0.78rem', color: '#3F6B35', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                  {t.season || 'Stage'} {idx + 1}: {s.timing}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#1F3D1A', fontWeight: 600 }}>
                  {s.action}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Chat Link */}
        <div className="glass" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, background: 'rgba(47, 94, 115, 0.05)', borderColor: '#2F5E73' }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1F3D1A' }}>{t.chatWithAgronomist || 'Have questions about fertilizer dosing?'}</div>
            <div style={{ fontSize: '0.8rem', color: '#485A43' }}>{t.chatSubtitle}</div>
          </div>
          <Link to="/chatbot" className="btn-primary" style={{ fontSize: '0.85rem', padding: '8px 18px', gap: 6, background: '#2F5E73' }}>
            <Bot size={15} /> {t.chatWithAgronomist || 'Chat with AI Agronomist'} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
