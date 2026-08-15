import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, AlertTriangle, Leaf, RefreshCw, Eye, CheckCircle2 } from 'lucide-react'
import { detectDisease, detectDeficiency } from '../api/agriApi'
import useAgriStore from '../store/useAgriStore'
import { TRANSLATIONS } from '../i18n/translations'

const DISEASE_TREATMENTS = {
  'Healthy': 'Plant appears healthy. Continue regular field monitoring and maintenance.',
  'Early Blight': 'Apply Mancozeb (2g/L) or Chlorothalonil fungicide. Remove affected lower leaves.',
  'Late Blight': 'Apply Metalaxyl or Cymoxanil fungicide immediately. Avoid overhead irrigation.',
  'Leaf Spot': 'Apply Copper-based fungicide. Avoid working in wet fields to prevent spread.',
  'Bacterial Blight': 'Apply Copper Hydroxide. Prune and destroy infected plant foliage.',
  'Powdery Mildew': 'Apply Sulfur-based fungicide or 0.5% Neem oil spray in early morning.',
}

const DEFICIENCY_CORRECTIONS = {
  'Healthy': 'No nutrient deficiency observed. Continue standard fertilizer schedule.',
  'Nitrogen Deficiency': 'Apply Urea (46-0-0) at 50 kg/acre. Foliar spray: 2% urea solution for rapid uptake.',
  'Phosphorus Deficiency': 'Apply DAP (18-46-0) at 50 kg/acre or Single Super Phosphate (SSP) at root zone.',
  'Potassium Deficiency': 'Apply Muriate of Potash (MOP 0-0-60) at 25-30 kg/acre to restore leaf margin vigor.',
}

const MOCK_DISEASE = { disease_label: 'Early Blight', confidence: 0.89, disease_classes: [{ label: 'Early Blight', confidence: 0.89 }, { label: 'Late Blight', confidence: 0.07 }, { label: 'Healthy', confidence: 0.04 }] }
const MOCK_DEFICIENCY = { deficiency_type: 'Nitrogen Deficiency', confidence: 0.92, deficiency_classes: [{ label: 'Nitrogen Deficiency', confidence: 0.92 }, { label: 'Phosphorus Deficiency', confidence: 0.05 }, { label: 'Healthy', confidence: 0.03 }] }

function ConfidenceBar({ label, confidence, color = '#3F6B35' }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1F3D1A' }}>{label}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color }}>{(confidence * 100).toFixed(1)}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${confidence * 100}%`, background: color }} />
      </div>
    </div>
  )
}

export default function LeafUpload() {
  const [imageFile, setImageFile] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { diseaseResult, deficiencyResult, setDiseaseResult, setDeficiencyResult, language } = useAgriStore()
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  const onDrop = useCallback(accepted => {
    if (accepted.length > 0) {
      setImageFile(accepted[0])
      setImageUrl(URL.createObjectURL(accepted[0]))
      setDiseaseResult(null)
      setDeficiencyResult(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxFiles: 1
  })

  const handleAnalyze = async () => {
    if (!imageFile) return
    setLoading(true)
    setError(null)
    try {
      const [disease, deficiency] = await Promise.all([
        detectDisease(imageFile),
        detectDeficiency(imageFile),
      ])
      setDiseaseResult(disease)
      setDeficiencyResult(deficiency)
    } catch (err) {
      setError('Backend offline — showing demo vision predictions.')
      setDiseaseResult(MOCK_DISEASE)
      setDeficiencyResult(MOCK_DEFICIENCY)
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    setImageFile(null)
    setImageUrl(null)
    setDiseaseResult(null)
    setDeficiencyResult(null)
    setError(null)
  }

  const barColor = (label) => {
    if (label.includes('Healthy')) return '#3F6B35' // Crop
    if (label.includes('Nitrogen')) return '#B5502A' // Clay
    if (label.includes('Phosphorus')) return '#B98A4E' // Loam
    if (label.includes('Potassium')) return '#5C3A21' // Humus
    if (label.includes('Blight') || label.includes('Spot') || label.includes('Mildew')) return '#B5502A' // Clay
    return '#2F5E73' // Water
  }

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div className="badge badge-clay" style={{ display: 'inline-flex', marginBottom: 10 }}>
          <Camera size={12} /> {t.leaf}
        </div>
        <h1 className="page-title">{t.leafTitle}</h1>
        <div className="section-divider" />
        <p className="page-subtitle">{t.leafSubtitle}</p>
      </div>

      {/* Upload Zone */}
      <div className="animate-fade-in-up stagger-1">
        {!imageUrl ? (
          <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: 24 }}>
            <input {...getInputProps()} id="leaf-image-upload" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(63, 107, 53, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(63, 107, 53, 0.3)' }}>
                <Upload size={32} color="#3F6B35" strokeWidth={1.75} />
              </div>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1F3D1A', marginBottom: 4 }}>
                  {isDragActive ? 'Drop leaf photo here...' : t.uploadBoxTitle}
                </div>
                <div style={{ color: '#6E7F69', fontSize: '0.88rem' }}>Supports PNG, JPG, JPEG, WEBP files</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass" style={{ marginBottom: 24, padding: 22, display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src={imageUrl} alt="Uploaded leaf" style={{ width: 190, height: 190, objectFit: 'cover', borderRadius: 14, border: '2px solid rgba(31, 61, 26, 0.15)' }} />
              <div style={{ position: 'absolute', top: 8, right: 8, background: '#3F6B35', borderRadius: 100, padding: 4 }}>
                <Eye size={14} color="#FFFFFF" />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: '0.82rem', color: '#6E7F69', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Selected Leaf Image</div>
              <div style={{ fontWeight: 800, color: '#1F3D1A', fontSize: '1.05rem', marginBottom: 2 }}>{imageFile?.name}</div>
              <div style={{ fontSize: '0.82rem', color: '#485A43', marginBottom: 18 }}>{(imageFile?.size / 1024).toFixed(1)} KB</div>
              {error && <div style={{ background: 'rgba(181, 80, 42, 0.1)', border: '1px solid rgba(181, 80, 42, 0.3)', borderRadius: 8, padding: '10px 14px', color: '#B5502A', fontSize: '0.84rem', fontWeight: 600, marginBottom: 16 }}>⚠ {error}</div>}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={handleAnalyze} disabled={loading} className="btn-primary">
                  {loading ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t.analyzing || 'Processing...'}</> : <><Camera size={15} /> {t.analyzeLeafButton}</>}
                </button>
                <button onClick={resetAll} className="btn-secondary">
                  <RefreshCw size={15} /> {t.uploadAnother || 'Scan Another Leaf'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {(diseaseResult || deficiencyResult) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="animate-fade-in">
          {diseaseResult && (
            <div className="glass" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(181, 80, 42, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} color="#B5502A" />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase' }}>{t.diagnosisResult}</div>
                  <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#1F3D1A' }}>{t.diseaseDiagnosis || 'Leaf Disease Diagnosis'}</div>
                </div>
              </div>
              <div style={{ background: '#F4F7EE', border: '1px solid rgba(31, 61, 26, 0.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{t.diagnosisResult}</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: diseaseResult.disease_label === 'Healthy' ? '#3F6B35' : '#B5502A' }}>
                  {diseaseResult.disease_label}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#485A43', marginTop: 4 }}>
                  {t.suitability || 'Confidence'}: <strong style={{ color: '#1F3D1A' }}>{(diseaseResult.confidence * 100).toFixed(1)}%</strong>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                {(diseaseResult.disease_classes || []).map(({ label, confidence }) => (
                  <ConfidenceBar key={label} label={label} confidence={confidence} color={barColor(label)} />
                ))}
              </div>
              <div style={{ background: 'rgba(181, 80, 42, 0.08)', border: '1px solid rgba(181, 80, 42, 0.25)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: '0.75rem', color: '#B5502A', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{t.treatmentRemedy || t.treatmentPlan}</div>
                <div style={{ fontSize: '0.88rem', color: '#1F3D1A', lineHeight: 1.6, fontWeight: 500 }}>
                  {DISEASE_TREATMENTS[diseaseResult.disease_label] || 'Consult an agronomist for targeted fungicide.'}
                </div>
              </div>
            </div>
          )}

          {deficiencyResult && (
            <div className="glass" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(63, 107, 53, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Leaf size={18} color="#3F6B35" />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase' }}>{t.nutrientStatus || 'Nutrient Assessment'}</div>
                  <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#1F3D1A' }}>{t.deficiencyDiagnosis || 'Nutrient Deficiency Diagnosis'}</div>
                </div>
              </div>
              <div style={{ background: '#F4F7EE', border: '1px solid rgba(31, 61, 26, 0.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{t.nutrientStatus || 'Nutrient Condition'}</div>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: deficiencyResult.deficiency_type === 'Healthy' ? '#3F6B35' : '#B5502A' }}>
                  {deficiencyResult.deficiency_type}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#485A43', marginTop: 4 }}>
                  {t.suitability || 'Confidence'}: <strong style={{ color: '#1F3D1A' }}>{(deficiencyResult.confidence * 100).toFixed(1)}%</strong>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                {(deficiencyResult.deficiency_classes || []).map(({ label, confidence }) => (
                  <ConfidenceBar key={label} label={label} confidence={confidence} color={barColor(label)} />
                ))}
              </div>
              <div style={{ background: 'rgba(63, 107, 53, 0.08)', border: '1px solid rgba(63, 107, 53, 0.25)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: '0.75rem', color: '#3F6B35', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{t.quickCorrection || 'Nutrient Correction Plan'}</div>
                <div style={{ fontSize: '0.88rem', color: '#1F3D1A', lineHeight: 1.6, fontWeight: 500 }}>
                  {DEFICIENCY_CORRECTIONS[deficiencyResult.deficiency_type] || 'Apply targeted foliar micronutrient fertilizer.'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {diseaseResult && deficiencyResult && (
        <div className="glass animate-fade-in" style={{ padding: 20, marginTop: 20, borderColor: 'rgba(63, 107, 53, 0.3)', background: 'rgba(63, 107, 53, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={24} color="#3F6B35" />
            <div>
              <div style={{ fontWeight: 800, color: '#1F3D1A', marginBottom: 2 }}>Multimodal Leaf Analysis Synchronized</div>
              <div style={{ color: '#485A43', fontSize: '0.88rem' }}>
                Disease status (<strong>{diseaseResult.disease_label}</strong>) and Nutrient status (<strong>{deficiencyResult.deficiency_type}</strong>) are saved to your session and will automatically inform your fertilizer recommendation.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
