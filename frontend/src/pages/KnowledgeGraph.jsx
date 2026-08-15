import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import ForceGraph2D from 'react-force-graph-2d'
import {
  Network, Search, ZoomIn, ZoomOut, RefreshCw, Filter, Info,
  Leaf, Droplets, FlaskConical, Bug, AlertCircle, Pill, Cloud,
  ExternalLink, ChevronRight, ChevronDown, BarChart3, Layers,
  Eye, Check, X, ArrowRight, Sparkles, CheckCircle2, Sprout
} from 'lucide-react'
import useAgriStore from '../store/useAgriStore'
import { TRANSLATIONS } from '../i18n/translations'

// ─── Static KG Data ───────────────────────────────────────────────
export const KG_DATA = {
  nodes: [
    // Crops
    {
      id: 'rice', label: 'Rice', type: 'crop', color: '#3F6B35', size: 16,
      icon: '🌾', details: { scientific: 'Oryza sativa', season: 'Kharif (Rainy)', duration: '90–150 days', water_req: 'High (1200–2000 mm)', soil_type: 'Clayey / Loamy', n_req: 'High', p_req: 'Medium', k_req: 'Medium', diseases: 'Leaf Spot, Bacterial Blight', description: 'Staple cereal crop grown in flooded paddy fields. Heavy nitrogen feeder particularly at tillering.' }
    },
    {
      id: 'wheat', label: 'Wheat', type: 'crop', color: '#3F6B35', size: 16,
      icon: '🌿', details: { scientific: 'Triticum aestivum', season: 'Rabi (Winter)', duration: '100–130 days', water_req: 'Moderate (450–650 mm)', soil_type: 'Loamy / Sandy Loam', n_req: 'High', p_req: 'High', k_req: 'Low', diseases: 'Powdery Mildew, Rust', description: 'Winter cereal crop. Responds strongly to basal phosphorus and split nitrogen at crown root initiation.' }
    },
    {
      id: 'maize', label: 'Maize', type: 'crop', color: '#3F6B35', size: 16,
      icon: '🌽', details: { scientific: 'Zea mays', season: 'Kharif / Rabi', duration: '85–110 days', water_req: 'Moderate (500–800 mm)', soil_type: 'Well-drained Loam', n_req: 'High', p_req: 'Medium', k_req: 'Medium', diseases: 'Early Blight, Stalk Rot', description: 'High-yield C4 cereal. Demands heavy nitrogen at knee-high and tasseling stages.' }
    },
    {
      id: 'cotton', label: 'Cotton', type: 'crop', color: '#3F6B35', size: 16,
      icon: '🌱', details: { scientific: 'Gossypium hirsutum', season: 'Kharif', duration: '150–180 days', water_req: 'Moderate (700–1300 mm)', soil_type: 'Black Cotton Soil', n_req: 'High', p_req: 'Medium', k_req: 'High', diseases: 'Bacterial Blight, Leaf Curl', description: 'Commercial cash crop. Potassium is critical for fiber strength and boll weight.' }
    },
    {
      id: 'sugarcane', label: 'Sugarcane', type: 'crop', color: '#3F6B35', size: 15,
      icon: '🎋', details: { scientific: 'Saccharum officinarum', season: 'Year-round', duration: '10–18 months', water_req: 'Very High (1500–2500 mm)', soil_type: 'Deep Loamy', n_req: 'Very High', p_req: 'Medium', k_req: 'High', diseases: 'Red Rot, Smut', description: 'Long duration crop. High nitrogen and potassium feeder for maximum sucrose yield.' }
    },
    {
      id: 'groundnut', label: 'Groundnut', type: 'crop', color: '#3F6B35', size: 14,
      icon: '🥜', details: { scientific: 'Arachis hypogaea', season: 'Kharif', duration: '90–130 days', water_req: 'Low–Moderate (500–700 mm)', soil_type: 'Sandy Loam', n_req: 'Low (fixes N₂)', p_req: 'High', k_req: 'Medium', diseases: 'Tikka Leaf Spot, Rust', description: 'Legume fixing atmospheric N. Phosphorus and calcium/gypsum at pegging are critical for pod filling.' }
    },

    // Nutrients
    {
      id: 'nitrogen', label: 'Nitrogen (N)', type: 'nutrient', color: '#2F5E73', size: 14,
      icon: '🧪', details: { symbol: 'N', optimal: '280–560 kg/ha', mobility: 'Mobile in plant', function: 'Chlorophyll synthesis, amino acids, rapid vegetative growth', deficiency: 'Yellowing (chlorosis) of older leaves, stunted growth', soil_forms: 'Nitrate (NO₃⁻), Ammonium (NH₄⁺)', description: 'Primary macronutrient controlling leaf canopy, photosynthesis, and overall biomass.' }
    },
    {
      id: 'phosphorus', label: 'Phosphorus (P)', type: 'nutrient', color: '#2F5E73', size: 14,
      icon: '🧪', details: { symbol: 'P', optimal: '22–55 kg/ha P₂O₅', mobility: 'Immobile in soil', function: 'Root proliferation, energy transfer (ATP), early seed development', deficiency: 'Purple/reddish leaf discoloration, delayed flowering', soil_forms: 'H₂PO₄⁻, HPO₄²⁻', description: 'Essential for root structure. Must be placed near root zone as a basal dose.' }
    },
    {
      id: 'potassium', label: 'Potassium (K)', type: 'nutrient', color: '#2F5E73', size: 14,
      icon: '🧪', details: { symbol: 'K', optimal: '120–280 kg/ha K₂O', mobility: 'Mobile in plant', function: 'Stomatal regulation, drought tolerance, enzyme activation', deficiency: 'Leaf tip scorch and margin browning, weak stems', soil_forms: 'Exchangeable K⁺', description: 'Regulates water use, boosts disease tolerance, and improves crop harvest quality.' }
    },

    // Fertilizers
    {
      id: 'urea', label: 'Urea (46-0-0)', type: 'fertilizer', color: '#5C3A21', size: 13,
      icon: '💊', details: { formula: 'CO(NH₂)₂', npk: '46-0-0', n_content: '46% N', form: 'Granular/Prilled', application: 'Top-dressing in 2–3 splits', caution: 'Apply only in moist soil. Avoid surface application before heavy rain.', cost: '₹270–310/bag (50 kg)', description: 'Most widely used nitrogen fertilizer. Rapidly converts to plant-available ammonium.' }
    },
    {
      id: 'dap', label: 'DAP (18-46-0)', type: 'fertilizer', color: '#5C3A21', size: 13,
      icon: '💊', details: { formula: '(NH₄)₂HPO₄', npk: '18-46-0', n_content: '18% N', p_content: '46% P₂O₅', application: 'Basal placement at sowing', caution: 'Apply at root zone depth for maximum phosphate uptake.', cost: '₹1,350–1,500/bag', description: 'Standard basal phosphate source supplying starter nitrogen and phosphorus.' }
    },
    {
      id: 'mop', label: 'MOP (0-0-60)', type: 'fertilizer', color: '#5C3A21', size: 13,
      icon: '💊', details: { formula: 'KCl (Muriate of Potash)', npk: '0-0-60', k_content: '60% K₂O', application: 'Basal or split application', caution: 'Avoid in chloride-sensitive crops (tobacco, potato) or high EC soils.', cost: '₹1,200–1,400/bag', description: 'Concentrated potassium source improving crop disease resistance and drought tolerance.' }
    },
    {
      id: 'ssp', label: 'SSP (0-16-0)', type: 'fertilizer', color: '#5C3A21', size: 12,
      icon: '💊', details: { formula: 'Single Superphosphate', npk: '0-16-0 + 11% S', p_content: '16% P₂O₅', application: 'Basal dose before sowing', caution: 'Provides bonus sulfur, highly recommended for oilseed crops.', cost: '₹350–450/bag', description: 'Phosphate fertilizer containing sulfur and calcium as secondary nutrients.' }
    },
    {
      id: 'npk_complex', label: 'NPK Complex', type: 'fertilizer', color: '#5C3A21', size: 12,
      icon: '💊', details: { formula: '19-19-19 / 20-20-0', npk: 'Balanced', application: 'Basal or fertigation', caution: 'Ensure grade matches specific soil test deficit.', cost: '₹1,100–1,800/bag', description: 'Balanced multinutrient fertilizer for simultaneous N, P, and K corrections.' }
    },

    // Diseases
    {
      id: 'early_blight', label: 'Early Blight', type: 'disease', color: '#B5502A', size: 11,
      icon: '🦠', details: { pathogen: 'Alternaria solani', crops: 'Maize, Tomato, Potato', symptoms: 'Concentric rings (target board lesions) on older leaves', favorable: 'High humidity (>85%), warm temp (24–29°C)', treatment: 'Mancozeb 2g/L or Chlorothalonil', description: 'Common foliar fungal disease causing ringed leaf lesions and premature defoliation.' }
    },
    {
      id: 'late_blight', label: 'Late Blight', type: 'disease', color: '#B5502A', size: 11,
      icon: '🦠', details: { pathogen: 'Phytophthora infestans', crops: 'Potato, Tomato', symptoms: 'Water-soaked black lesions with white sporulation underneath', favorable: 'Cool wet weather (12–22°C, >90% RH)', treatment: 'Metalaxyl + Mancozeb (2g/L)', description: 'Destructive oomycete pathogen capable of causing rapid crop failure in wet weather.' }
    },
    {
      id: 'leaf_spot', label: 'Leaf Spot', type: 'disease', color: '#B5502A', size: 11,
      icon: '🦠', details: { pathogen: 'Cercospora spp.', crops: 'Rice, Groundnut, Maize', symptoms: 'Brown circular spots with yellow chlorotic halos', favorable: 'High humidity + low soil nitrogen', treatment: 'Copper Hydroxide or Mancozeb', description: 'Foliar fungal spots aggravated by nitrogen deficiency and poor air circulation.' }
    },
    {
      id: 'powdery_mildew', label: 'Powdery Mildew', type: 'disease', color: '#B5502A', size: 10,
      icon: '🦠', details: { pathogen: 'Erysiphe spp.', crops: 'Wheat, Cucurbits, Grapes', symptoms: 'White talcum-like powdery coating on leaf surface', favorable: 'Warm dry days with humid nights (15–26°C)', treatment: 'Wettable Sulfur (2–3g/L)', description: 'Fungal disease thriving in warm dry weather without needing liquid rain.' }
    },
    {
      id: 'bacterial_blight', label: 'Bacterial Blight', type: 'disease', color: '#B5502A', size: 10,
      icon: '🦠', details: { pathogen: 'Xanthomonas oryzae', crops: 'Rice, Cotton', symptoms: 'Water-soaked wavy leaf margins turning yellowish-white', favorable: 'Warm temperatures (25–35°C) with waterlogging', treatment: 'Copper Hydroxide (2.5g/L) + Streptocycline', description: 'Severe bacterial disease causing leaf blighting and seedling kresek in rice fields.' }
    },

    // Deficiencies
    {
      id: 'n_def', label: 'N-Deficiency', type: 'deficiency', color: '#E8C79B', size: 11,
      icon: '⚠️', details: { symptom: 'Uniform pale yellowing on older lower leaves first', cause: 'Low soil organic matter or insufficient nitrogen application', quick_remedy: 'Foliar 2% Urea spray (20g/L)', soil_remedy: 'Apply Urea @ 50 kg/acre in splits', description: 'Nitrogen is mobile in plants, so deficiency manifests first on the oldest lower foliage.' }
    },
    {
      id: 'p_def', label: 'P-Deficiency', type: 'deficiency', color: '#E8C79B', size: 11,
      icon: '⚠️', details: { symptom: 'Dark green or purplish discoloration, stunted root volume', cause: 'Acidic or alkaline soil fixation (pH < 5.5 or > 7.5)', quick_remedy: 'Foliar 0.5% DAP spray', soil_remedy: 'Apply DAP @ 50 kg/acre at root depth', description: 'Restricts root branching and ATP energy flow, delaying maturity.' }
    },
    {
      id: 'k_def', label: 'K-Deficiency', type: 'deficiency', color: '#E8C79B', size: 11,
      icon: '⚠️', details: { symptom: 'Marginal leaf scorch, brown edges, weak stalks prone to lodging', cause: 'Sandy soil leaching or high magnesium antagonism', quick_remedy: 'Foliar 1% KNO₃ spray', soil_remedy: 'Apply MOP @ 25–40 kg/acre', description: 'Weakens stem cell walls and reduces drought tolerance.' }
    },

    // Medicines
    {
      id: 'mancozeb', label: 'Mancozeb', type: 'medicine', color: '#3F6B35', size: 10,
      icon: '💊', details: { type: 'Fungicide (Contact)', dose: '2.0–2.5 g/L water', frequency: 'Every 7–10 days', spectrum: 'Early Blight, Downy Mildew, Rust', description: 'Multi-site protective fungicide effective across diverse fungal leaf spots.' }
    },
    {
      id: 'metalaxyl', label: 'Metalaxyl', type: 'medicine', color: '#3F6B35', size: 10,
      icon: '💊', details: { type: 'Systemic Fungicide', dose: '2.0 g/L (Ridomil MZ)', frequency: 'Every 14 days', spectrum: 'Late Blight, Downy Mildew', description: 'Systemic curative fungicide targeted specifically against oomycetes.' }
    },
    {
      id: 'copper_hyd', label: 'Copper Hydroxide', type: 'medicine', color: '#3F6B35', size: 10,
      icon: '💊', details: { type: 'Bactericide + Fungicide', dose: '2.5–3.0 g/L water', frequency: 'Every 7–10 days', spectrum: 'Bacterial Blight, Leaf Spot', description: 'Broad-spectrum inorganic protectant with dual antibacterial and antifungal action.' }
    },
    {
      id: 'sulfur_fun', label: 'Sulfur Fungicide', type: 'medicine', color: '#3F6B35', size: 10,
      icon: '💊', details: { type: 'Inorganic Fungicide', dose: '2.0–3.0 g/L (wettable)', frequency: 'Every 10–14 days', spectrum: 'Powdery Mildew, Rust, Mites', description: 'Standard powdery mildew control. Avoid applying above 35°C.' }
    },

    // Weather
    {
      id: 'rainy', label: 'Rainy Season', type: 'weather', color: '#2F5E73', size: 10,
      icon: '🌧', details: { season: 'Kharif (June–October)', rainfall: '600–2000 mm', humidity: '70–95%', precautions: 'Avoid urea before heavy rain to prevent leaching. Use systemic fungicides.' }
    },
    {
      id: 'dry', label: 'Dry Season', type: 'weather', color: '#2F5E73', size: 10,
      icon: '☀', details: { season: 'Rabi (November–March)', rainfall: '100–300 mm', humidity: '30–65%', precautions: 'Irrigate after fertilizer top-dressing. Excellent spray conditions with wind < 8 km/h.' }
    },
  ],

  links: [
    // Crop → Nutrient
    { source: 'rice', target: 'nitrogen', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.4)' },
    { source: 'rice', target: 'phosphorus', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.3)' },
    { source: 'rice', target: 'potassium', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.3)' },
    { source: 'wheat', target: 'nitrogen', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.4)' },
    { source: 'wheat', target: 'phosphorus', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.4)' },
    { source: 'maize', target: 'nitrogen', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.4)' },
    { source: 'maize', target: 'potassium', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.3)' },
    { source: 'cotton', target: 'nitrogen', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.4)' },
    { source: 'cotton', target: 'potassium', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.4)' },
    { source: 'sugarcane', target: 'nitrogen', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.5)' },
    { source: 'sugarcane', target: 'potassium', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.4)' },
    { source: 'groundnut', target: 'phosphorus', label: 'NEEDS', color: 'rgba(63, 107, 53, 0.4)' },

    // Nutrient → Fertilizer
    { source: 'nitrogen', target: 'urea', label: 'FERTILIZER', color: 'rgba(47, 94, 115, 0.4)' },
    { source: 'nitrogen', target: 'dap', label: 'FERTILIZER', color: 'rgba(47, 94, 115, 0.3)' },
    { source: 'nitrogen', target: 'npk_complex', label: 'FERTILIZER', color: 'rgba(47, 94, 115, 0.3)' },
    { source: 'phosphorus', target: 'dap', label: 'FERTILIZER', color: 'rgba(47, 94, 115, 0.4)' },
    { source: 'phosphorus', target: 'ssp', label: 'FERTILIZER', color: 'rgba(47, 94, 115, 0.3)' },
    { source: 'phosphorus', target: 'npk_complex', label: 'FERTILIZER', color: 'rgba(47, 94, 115, 0.3)' },
    { source: 'potassium', target: 'mop', label: 'FERTILIZER', color: 'rgba(47, 94, 115, 0.4)' },
    { source: 'potassium', target: 'npk_complex', label: 'FERTILIZER', color: 'rgba(47, 94, 115, 0.3)' },

    // Disease → Medicine
    { source: 'early_blight', target: 'mancozeb', label: 'TREATED_BY', color: 'rgba(181, 80, 42, 0.4)' },
    { source: 'late_blight', target: 'metalaxyl', label: 'TREATED_BY', color: 'rgba(181, 80, 42, 0.4)' },
    { source: 'leaf_spot', target: 'copper_hyd', label: 'TREATED_BY', color: 'rgba(181, 80, 42, 0.4)' },
    { source: 'leaf_spot', target: 'mancozeb', label: 'TREATED_BY', color: 'rgba(181, 80, 42, 0.3)' },
    { source: 'powdery_mildew', target: 'sulfur_fun', label: 'TREATED_BY', color: 'rgba(181, 80, 42, 0.4)' },
    { source: 'bacterial_blight', target: 'copper_hyd', label: 'TREATED_BY', color: 'rgba(181, 80, 42, 0.4)' },

    // Deficiency → Fertilizer
    { source: 'n_def', target: 'urea', label: 'CORRECTED_BY', color: 'rgba(232, 199, 155, 0.6)' },
    { source: 'n_def', target: 'dap', label: 'CORRECTED_BY', color: 'rgba(232, 199, 155, 0.5)' },
    { source: 'p_def', target: 'dap', label: 'CORRECTED_BY', color: 'rgba(232, 199, 155, 0.6)' },
    { source: 'p_def', target: 'ssp', label: 'CORRECTED_BY', color: 'rgba(232, 199, 155, 0.5)' },
    { source: 'k_def', target: 'mop', label: 'CORRECTED_BY', color: 'rgba(232, 199, 155, 0.6)' },

    // Weather → Crop
    { source: 'rainy', target: 'rice', label: 'SUITS', color: 'rgba(47, 94, 115, 0.35)' },
    { source: 'rainy', target: 'maize', label: 'SUITS', color: 'rgba(47, 94, 115, 0.35)' },
    { source: 'rainy', target: 'cotton', label: 'SUITS', color: 'rgba(47, 94, 115, 0.3)' },
    { source: 'rainy', target: 'sugarcane', label: 'SUITS', color: 'rgba(47, 94, 115, 0.3)' },
    { source: 'rainy', target: 'groundnut', label: 'SUITS', color: 'rgba(47, 94, 115, 0.3)' },
    { source: 'dry', target: 'wheat', label: 'SUITS', color: 'rgba(47, 94, 115, 0.35)' },
    { source: 'dry', target: 'cotton', label: 'SUITS', color: 'rgba(47, 94, 115, 0.3)' },

    // Crop → Disease
    { source: 'rice', target: 'leaf_spot', label: 'SUSCEPTIBLE', color: 'rgba(181, 80, 42, 0.25)' },
    { source: 'rice', target: 'bacterial_blight', label: 'SUSCEPTIBLE', color: 'rgba(181, 80, 42, 0.25)' },
    { source: 'maize', target: 'early_blight', label: 'SUSCEPTIBLE', color: 'rgba(181, 80, 42, 0.25)' },
    { source: 'wheat', target: 'powdery_mildew', label: 'SUSCEPTIBLE', color: 'rgba(181, 80, 42, 0.25)' },
    { source: 'cotton', target: 'bacterial_blight', label: 'SUSCEPTIBLE', color: 'rgba(181, 80, 42, 0.25)' },

    // Nutrient → Deficiency
    { source: 'nitrogen', target: 'n_def', label: 'DEFICIENCY_OF', color: 'rgba(47, 94, 115, 0.3)' },
    { source: 'phosphorus', target: 'p_def', label: 'DEFICIENCY_OF', color: 'rgba(47, 94, 115, 0.3)' },
    { source: 'potassium', target: 'k_def', label: 'DEFICIENCY_OF', color: 'rgba(47, 94, 115, 0.3)' },
  ]
}

const TYPE_INFO = {
  crop: { label: 'Crop', color: '#3F6B35', icon: Leaf },
  nutrient: { label: 'Nutrient', color: '#2F5E73', icon: Droplets },
  fertilizer: { label: 'Fertilizer', color: '#5C3A21', icon: FlaskConical },
  disease: { label: 'Disease', color: '#B5502A', icon: Bug },
  deficiency: { label: 'Deficiency', color: '#E8C79B', icon: AlertCircle },
  medicine: { label: 'Medicine', color: '#3F6B35', icon: Pill },
  weather: { label: 'Weather', color: '#2F5E73', icon: Cloud },
}

const RELATION_COLORS = {
  NEEDS: '#3F6B35',
  FERTILIZER: '#5C3A21',
  TREATED_BY: '#B5502A',
  CORRECTED_BY: '#3F6B35',
  SUITS: '#2F5E73',
  SUSCEPTIBLE: '#B5502A',
  DEFICIENCY_OF: '#B98A4E',
}

// ─── Node Info Panel ─────────────────────────────────────────────
function NodeInfoPanel({ node, onClose, allNodes, allLinks, isActiveSession }) {
  const [showAllConnections, setShowAllConnections] = useState(false)
  if (!node) return null

  const typeInfo = TYPE_INFO[node.type]
  const TypeIcon = typeInfo?.icon || Info

  const connections = allLinks.filter(l => {
    const src = typeof l.source === 'object' ? l.source.id : l.source
    const tgt = typeof l.target === 'object' ? l.target.id : l.target
    return src === node.id || tgt === node.id
  }).map(l => {
    const src = typeof l.source === 'object' ? l.source.id : l.source
    const tgt = typeof l.target === 'object' ? l.target.id : l.target
    const otherId = src === node.id ? tgt : src
    const other = allNodes.find(n => n.id === otherId)
    return { link: l, other, direction: src === node.id ? 'out' : 'in' }
  })

  const displayedConnections = showAllConnections ? connections : connections.slice(0, 6)
  const d = node.details || {}

  return (
    <div style={{
      background: '#FFFFFF',
      border: `1.5px solid ${node.color}55`,
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(31, 61, 26, 0.08)',
      maxHeight: '82vh',
      overflowY: 'auto',
    }}>
      {/* Active Session Indicator */}
      {isActiveSession && (
        <div style={{ background: '#3F6B35', color: '#FFFFFF', padding: '6px 14px', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.04em' }}>
          <Sparkles size={13} /> ACTIVE IN YOUR CURRENT FARM DIAGNOSIS
        </div>
      )}

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${node.color}15, transparent)`,
        borderBottom: `1px solid ${node.color}33`,
        padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: node.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', flexShrink: 0, color: '#FFFFFF'
        }}>
          {node.icon || <TypeIcon size={22} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
              color: node.color, background: `${node.color}15`,
              padding: '2px 7px', borderRadius: 4
            }}>
              {node.type}
            </span>
          </div>
          <h3 style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#1F3D1A' }}>
            {node.label}
          </h3>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#6E7F69',
          cursor: 'pointer', padding: 4, borderRadius: 6
        }}>
          <X size={16} />
        </button>
      </div>

      {/* Body Details */}
      <div style={{ padding: '16px 18px' }}>
        {d.description && (
          <p style={{ fontSize: '0.84rem', color: '#485A43', lineHeight: 1.5, margin: '0 0 14px' }}>
            {d.description}
          </p>
        )}

        {/* Key Attributes */}
        <div style={{ background: '#F8FAF3', borderRadius: 8, padding: '10px 12px', marginBottom: 14, border: '1px solid rgba(31, 61, 26, 0.08)' }}>
          {Object.entries(d).filter(([k]) => k !== 'description').map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, margin: '4px 0', fontSize: '0.78rem' }}>
              <span style={{ color: '#6E7F69', fontWeight: 700, textTransform: 'capitalize' }}>{k.replace('_', ' ')}:</span>
              <span style={{ color: '#1F3D1A', fontWeight: 800, textAlign: 'right' }}>{String(v)}</span>
            </div>
          ))}
        </div>

        {/* Connected Reasoning Relationships */}
        <div style={{ fontSize: '0.74rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
          Connected Reasoning Links ({connections.length}):
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {displayedConnections.map(({ link, other, direction }, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', background: '#FFFFFF',
              border: '1px solid rgba(31, 61, 26, 0.1)', borderRadius: 6,
              fontSize: '0.78rem'
            }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: 800,
                color: RELATION_COLORS[link.label] || '#3F6B35',
                background: `${RELATION_COLORS[link.label] || '#3F6B35'}15`,
                padding: '2px 6px', borderRadius: 4
              }}>
                {link.label}
              </span>
              <span style={{ color: '#1F3D1A', fontWeight: 700 }}>
                {other?.label || other?.id}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#6E7F69' }}>
                {direction === 'out' ? '→ outgoing' : '← incoming'}
              </span>
            </div>
          ))}
        </div>

        {connections.length > 6 && (
          <button
            onClick={() => setShowAllConnections(!showAllConnections)}
            style={{
              background: 'transparent', border: 'none', color: '#3F6B35',
              fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
              marginTop: 8, padding: 0
            }}
          >
            {showAllConnections ? 'Show Less' : `+ Show ${connections.length - 6} more links`}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Knowledge Graph Component ───────────────────────────────
export default function KnowledgeGraph() {
  const fgRef = useRef()
  const containerRef = useRef()
  const [selectedNode, setSelectedNode] = useState(null)
  const [activeTypes, setActiveTypes] = useState(new Set(Object.keys(TYPE_INFO)))
  const [viewMode, setViewMode] = useState('active_pathway') // 'active_pathway' | 'full_graph'
  const [dimensions, setDimensions] = useState({ w: 800, h: 580 })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [highlightNodes, setHighlightNodes] = useState(new Set())

  const {
    soilData, soilResult,
    cropResult, selectedCrop,
    diseaseResult, deficiencyResult,
    recommendation, weatherData,
    language
  } = useAgriStore()
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  // 1. Identify Active Field Diagnostic Nodes based on the user's live results
  const activeSessionNodes = useMemo(() => {
    const active = new Set()

    // Crop
    const targetCrop = (selectedCrop || cropResult?.recommended_crops?.[0]?.crop || 'rice').toLowerCase()
    const matchingCrop = KG_DATA.nodes.find(n => n.type === 'crop' && n.id.includes(targetCrop))
    if (matchingCrop) active.add(matchingCrop.id)
    else active.add('rice')

    // Nutrients
    const nVal = Number(soilData?.nitrogen ?? 90)
    const pVal = Number(soilData?.phosphorus ?? 42)
    const kVal = Number(soilData?.potassium ?? 43)

    if (nVal < 120) {
      active.add('nitrogen')
      active.add('n_def')
      active.add('urea')
    }
    if (pVal < 45) {
      active.add('phosphorus')
      active.add('p_def')
      active.add('dap')
    }
    if (kVal < 55) {
      active.add('potassium')
      active.add('k_def')
      active.add('mop')
    }

    // Leaf Diseases
    if (diseaseResult?.disease) {
      const dLower = diseaseResult.disease.toLowerCase()
      if (dLower.includes('early blight')) { active.add('early_blight'); active.add('mancozeb') }
      else if (dLower.includes('late blight')) { active.add('late_blight'); active.add('metalaxyl') }
      else if (dLower.includes('leaf spot')) { active.add('leaf_spot'); active.add('copper_hyd') }
      else if (dLower.includes('powdery mildew')) { active.add('powdery_mildew'); active.add('sulfur_fun') }
      else if (dLower.includes('bacterial blight')) { active.add('bacterial_blight'); active.add('copper_hyd') }
    }

    // Leaf Deficiencies
    if (deficiencyResult?.deficiency) {
      const defLower = deficiencyResult.deficiency.toLowerCase()
      if (defLower.includes('nitrogen')) { active.add('n_def'); active.add('urea') }
      if (defLower.includes('phosphorus')) { active.add('p_def'); active.add('dap') }
      if (defLower.includes('potassium')) { active.add('k_def'); active.add('mop') }
    }

    // Weather
    const rain = Number(weatherData?.rainfall || 0)
    if (rain > 0) active.add('rainy')
    else active.add('dry')

    return active
  }, [soilData, selectedCrop, cropResult, diseaseResult, deficiencyResult, weatherData])

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({ w: containerRef.current.offsetWidth, h: 580 })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Auto-focus on active pathway when viewMode is active_pathway
  useEffect(() => {
    if (viewMode === 'active_pathway' && fgRef.current) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(600, 40)
      }, 300)
    }
  }, [viewMode, activeSessionNodes])

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setHighlightNodes(new Set())
      return
    }
    const q = searchQuery.toLowerCase()
    const results = KG_DATA.nodes.filter(n =>
      n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)
    )
    setSearchResults(results)
    setHighlightNodes(new Set(results.map(r => r.id)))
  }, [searchQuery])

  // Filtered dataset based on active view mode and type filters
  const filteredData = useMemo(() => {
    let nodes = KG_DATA.nodes.filter(n => activeTypes.has(n.type))

    if (viewMode === 'active_pathway') {
      nodes = nodes.filter(n => activeSessionNodes.has(n.id))
    }

    const nodeIds = new Set(nodes.map(n => n.id))

    const links = KG_DATA.links.filter(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target
      return nodeIds.has(srcId) && nodeIds.has(tgtId)
    })

    return { nodes, links }
  }, [activeTypes, viewMode, activeSessionNodes])

  const toggleType = (type) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node)
    setSearchQuery('')
    setSearchResults([])
    fgRef.current?.centerAt(node.x, node.y, 500)
    fgRef.current?.zoom(2.5, 500)
  }, [])

  const handleNodeHover = useCallback((node) => {
    if (!node) return
    const related = new Set([node.id])
    KG_DATA.links.forEach(l => {
      const src = typeof l.source === 'object' ? l.source.id : l.source
      const tgt = typeof l.target === 'object' ? l.target.id : l.target
      if (src === node.id) related.add(tgt)
      if (tgt === node.id) related.add(src)
    })
    setHighlightNodes(related)
  }, [])

  // Focus specific entity from breadcrumb banner
  const focusEntity = (nodeId) => {
    const n = KG_DATA.nodes.find(node => node.id === nodeId)
    if (n) {
      handleNodeClick(n)
    }
  }

  const activeCropName = selectedCrop || cropResult?.recommended_crops?.[0]?.crop || 'Rice'
  const activeDiseaseName = diseaseResult?.disease || 'Healthy / None'

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <div className="badge badge-crop" style={{ display: 'inline-flex', marginBottom: 12 }}>
          <Network size={12} /> Module 6 · Knowledge Graph & Farm Reasoning Engine
        </div>
        <h1 className="page-title">{t.kgTitle || 'Agricultural Knowledge Graph'}</h1>
        <div className="section-divider" />
        <p className="page-subtitle">
          {t.kgSubtitle}
        </p>
      </div>

      {/* Interactive Result Breadcrumb Flow */}
      <div className="glass animate-fade-in-up stagger-1" style={{ padding: '16px 20px', marginBottom: 16, border: '1.5px solid rgba(63, 107, 53, 0.25)', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
          <div style={{ fontSize: '0.78rem', color: '#1F3D1A', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Sparkles size={14} color="#3F6B35" /> {t.activeFieldChain || 'Active Field Reasoning Chain'}:
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', background: '#F4F7EE', borderRadius: 8, padding: 3, gap: 4, border: '1px solid rgba(31, 61, 26, 0.1)' }}>
            <button
              onClick={() => setViewMode('active_pathway')}
              style={{
                border: 'none',
                background: viewMode === 'active_pathway' ? '#3F6B35' : 'transparent',
                color: viewMode === 'active_pathway' ? '#FFFFFF' : '#485A43',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 5
              }}
            >
              <Sparkles size={12} /> {t.myFieldPathway || 'My Field Pathway'} ({activeSessionNodes.size})
            </button>
            <button
              onClick={() => setViewMode('full_graph')}
              style={{
                border: 'none',
                background: viewMode === 'full_graph' ? '#3F6B35' : 'transparent',
                color: viewMode === 'full_graph' ? '#FFFFFF' : '#485A43',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.fullKnowledgeGraph || 'Full Knowledge Graph'} (25)
            </button>
          </div>
        </div>

        {/* Clickable Sequence Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => focusEntity(activeCropName.toLowerCase())}
            style={{ border: '1px solid #3F6B35', background: 'rgba(63, 107, 53, 0.08)', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800, color: '#1F3D1A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🌾 Crop: {activeCropName}
          </button>
          <ArrowRight size={14} color="#6E7F69" />

          <button
            onClick={() => focusEntity('nitrogen')}
            style={{ border: '1px solid #2F5E73', background: 'rgba(47, 94, 115, 0.08)', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800, color: '#1F3D1A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🧪 Nutrient: N ({soilData?.nitrogen || 90} ppm)
          </button>
          <ArrowRight size={14} color="#6E7F69" />

          <button
            onClick={() => focusEntity('urea')}
            style={{ border: '1px solid #5C3A21', background: 'rgba(92, 58, 33, 0.08)', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800, color: '#1F3D1A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            💊 Fertilizer: Urea
          </button>

          {diseaseResult?.disease && (
            <>
              <ArrowRight size={14} color="#6E7F69" />
              <button
                onClick={() => focusEntity(diseaseResult.disease.toLowerCase().replace(' ', '_'))}
                style={{ border: '1px solid #B5502A', background: 'rgba(181, 80, 42, 0.08)', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800, color: '#1F3D1A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🦠 Leaf Disease: {diseaseResult.disease}
              </button>
            </>
          )}

          <ArrowRight size={14} color="#6E7F69" />
          <button
            onClick={() => focusEntity(weatherData?.rainfall > 0 ? 'rainy' : 'dry')}
            style={{ border: '1px solid #2F5E73', background: 'rgba(47, 94, 115, 0.08)', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', fontWeight: 800, color: '#1F3D1A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            🌦️ Climate: {weatherData?.rainfall > 0 ? 'Rainy' : 'Dry Season'}
          </button>
        </div>
      </div>

      {/* Action and Filter Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Node Type Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(TYPE_INFO).map(([type, { label, color, icon: TypeIcon }]) => (
            <button key={type} onClick={() => toggleType(type)} style={{
              padding: '4px 10px', borderRadius: 100, fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${activeTypes.has(type) ? color : 'rgba(31, 61, 26, 0.15)'}`,
              background: activeTypes.has(type) ? `${color}18` : 'transparent',
              color: activeTypes.has(type) ? color : '#6E7F69',
              transition: 'all 0.15s',
              display: 'inline-flex', alignItems: 'center', gap: 4
            }}>
              <TypeIcon size={11} /> {label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => { fgRef.current?.zoomToFit(400); setSelectedNode(null) }}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', gap: 6 }}
          >
            <RefreshCw size={13} /> Reset View
          </button>
          <button onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 200)} className="btn-icon" style={{ width: 32, height: 32 }}><ZoomIn size={14} /></button>
          <button onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 0.7, 200)} className="btn-icon" style={{ width: 32, height: 32 }}><ZoomOut size={14} /></button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedNode ? '1fr 340px' : '1fr', gap: 16 }}>
        {/* Graph Canvas */}
        <div ref={containerRef} className="glass animate-fade-in-up stagger-2" style={{ padding: 0, overflow: 'hidden', borderRadius: 14, position: 'relative', border: '1.5px solid rgba(31, 61, 26, 0.15)' }}>
          {/* Top Info Overlay */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            background: 'rgba(255, 255, 255, 0.94)', border: '1px solid rgba(31, 61, 26, 0.15)',
            borderRadius: 8, padding: '5px 12px',
            fontSize: '0.72rem', color: '#1F3D1A', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700,
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
          }}>
            <Info size={13} color="#3F6B35" />
            {viewMode === 'active_pathway' ? 'Showing active field diagnostic chain' : 'Showing complete agricultural ontology'}
          </div>

          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            background: 'rgba(255, 255, 255, 0.94)', border: '1px solid rgba(31, 61, 26, 0.15)',
            borderRadius: 8, padding: '5px 12px',
            fontSize: '0.72rem', color: '#1F3D1A', fontWeight: 800,
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
          }}>
            {filteredData.nodes.length} nodes · {filteredData.links.length} edges
          </div>

          <ForceGraph2D
            ref={fgRef}
            graphData={filteredData}
            width={dimensions.w}
            height={dimensions.h}
            backgroundColor="#F7F9F1"
            nodeLabel="label"
            nodeColor={n => n.color}
            nodeVal={n => n.size}
            linkColor={l => l.color || 'rgba(31, 61, 26, 0.2)'}
            linkWidth={l => activeSessionNodes.has(l.source.id || l.source) ? 2.4 : 1.0}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            linkDirectionalParticles={l => activeSessionNodes.has(l.source.id || l.source) ? 2 : 0}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleColor={l => RELATION_COLORS[l.label] || '#3F6B35'}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            nodeCanvasObjectMode={() => 'replace'}
            nodeCanvasObject={(node, ctx, globalScale) => {
              try {
                if (!node || !isFinite(node.x) || !isFinite(node.y)) return

                const kScale = Math.max(0.1, Number(globalScale) || 1)
                const isSelected = selectedNode?.id === node.id
                const isActive = activeSessionNodes.has(node.id)
                const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id)

                const baseSize = node.size || 12
                const r = Math.min(15, Math.max(3.5, baseSize / Math.max(0.6, kScale)))

                ctx.save()
                ctx.globalAlpha = isHighlighted ? 1.0 : 0.2

                // Outer halo for active nodes
                if (isActive) {
                  ctx.beginPath()
                  ctx.arc(node.x, node.y, r * 1.3, 0, 2 * Math.PI)
                  ctx.strokeStyle = '#22C55E'
                  ctx.lineWidth = Math.max(0.8, 1.5 / kScale)
                  ctx.setLineDash([2.5 / kScale, 1.5 / kScale])
                  ctx.stroke()
                  ctx.setLineDash([])
                }

                // Selection ring
                if (isSelected) {
                  ctx.beginPath()
                  ctx.arc(node.x, node.y, r * 1.4, 0, 2 * Math.PI)
                  ctx.strokeStyle = '#EF4444'
                  ctx.lineWidth = Math.max(1, 1.8 / kScale)
                  ctx.stroke()
                }

                // Main node circle
                ctx.beginPath()
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
                ctx.fillStyle = node.color || '#3F6B35'
                ctx.fill()

                ctx.strokeStyle = isSelected ? '#0F172A' : '#FFFFFF'
                ctx.lineWidth = Math.max(0.7, (isSelected ? 1.5 : 0.9) / kScale)
                ctx.stroke()

                // Compact Node Label Badge (micro font wrapped in clean white pill)
                if (kScale > 0.35) {
                  const fontSize = Math.max(5, Math.min(8.5, 6.5 / Math.max(0.4, kScale)))
                  ctx.font = `${isActive ? '700 ' : '600 '}${fontSize}px Inter, -apple-system, sans-serif`
                  ctx.textAlign = 'center'
                  ctx.textBaseline = 'middle'

                  const labelText = isActive ? `★ ${node.label}` : node.label
                  const tw = ctx.measureText(labelText).width
                  const padX = 4 / kScale
                  const padY = 2 / kScale
                  const labelY = node.y + r + (fontSize / 2) + 3 / kScale

                  const rectX = node.x - tw / 2 - padX
                  const rectY = labelY - fontSize / 2 - padY
                  const rectW = tw + padX * 2
                  const rectH = fontSize + padY * 2
                  const cornerR = Math.max(1, 2.5 / kScale)

                  ctx.fillStyle = isActive ? '#F0FDF4' : 'rgba(255, 255, 255, 0.95)'
                  ctx.strokeStyle = isActive ? '#22C55E' : 'rgba(203, 213, 225, 0.8)'
                  ctx.lineWidth = 0.6 / kScale

                  ctx.beginPath()
                  if (ctx.roundRect && isFinite(cornerR)) {
                    try { ctx.roundRect(rectX, rectY, rectW, rectH, cornerR) } catch(e) { ctx.rect(rectX, rectY, rectW, rectH) }
                  } else {
                    ctx.rect(rectX, rectY, rectW, rectH)
                  }
                  ctx.fill()
                  ctx.stroke()

                  ctx.fillStyle = isActive ? '#14532D' : '#334155'
                  ctx.fillText(labelText, node.x, labelY)
                }

                ctx.restore()
              } catch (e) {
                // skip bad frames
              }
            }}
            linkCanvasObjectMode={() => 'after'}
            linkCanvasObject={(link, ctx, globalScale) => {
              try {
                const kScale = Math.max(0.1, Number(globalScale) || 1)
                if (kScale < 0.65) return
                const start = link.source
                const end = link.target
                if (!start?.x || !end?.x || !isFinite(start.x) || !isFinite(end.x)) return

                const mx = (start.x + end.x) / 2
                const my = (start.y + end.y) / 2
                const fontSize = Math.max(4, Math.min(6.5, 4.5 / Math.max(0.4, kScale)))

                ctx.save()
                ctx.font = `600 ${fontSize}px Inter, -apple-system, sans-serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'

                const rawText = link.label || ''
                const labelText = rawText
                  .toLowerCase()
                  .split('_')
                  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')

                const tw = ctx.measureText(labelText).width
                const padX = 2.5 / kScale
                const padY = 1.2 / kScale

                const rectX = mx - tw / 2 - padX
                const rectY = my - fontSize / 2 - padY
                const rectW = tw + padX * 2
                const rectH = fontSize + padY * 2
                const cornerR = Math.max(1, 2 / kScale)

                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
                ctx.strokeStyle = (RELATION_COLORS[rawText] || '#64748B') + '66'
                ctx.lineWidth = 0.6 / kScale

                ctx.beginPath()
                if (ctx.roundRect && isFinite(cornerR)) {
                  try { ctx.roundRect(rectX, rectY, rectW, rectH, cornerR) } catch(e) { ctx.rect(rectX, rectY, rectW, rectH) }
                } else {
                  ctx.rect(rectX, rectY, rectW, rectH)
                }
                ctx.fill()
                ctx.stroke()

                ctx.fillStyle = RELATION_COLORS[rawText] || '#475569'
                ctx.fillText(labelText, mx, my)
                ctx.restore()
              } catch (e) {
                // skip
              }
            }}
          />
        </div>

        {/* Node Info Panel */}
        {selectedNode && (
          <div className="animate-fade-in">
            <NodeInfoPanel
              node={selectedNode}
              onClose={() => { setSelectedNode(null); fgRef.current?.zoomToFit(400) }}
              allNodes={KG_DATA.nodes}
              allLinks={KG_DATA.links}
              isActiveSession={activeSessionNodes.has(selectedNode.id)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
