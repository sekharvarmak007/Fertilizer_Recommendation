import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Camera, Upload, AlertTriangle, Leaf, RefreshCw, Eye,
  CheckCircle2, Zap, Shield, Info, FlaskConical, AlertCircle
} from 'lucide-react'
import { detectDisease, detectDeficiency } from '../api/agriApi'
import useAgriStore from '../store/useAgriStore'
import { TRANSLATIONS } from '../i18n/translations'

/* ── Helpers ───────────────────────────────────────────────────── */
function severityColor(severity) {
  const s = (severity || '').toLowerCase()
  if (s === 'severe')   return { bg: 'rgba(181,50,42,0.12)', border: 'rgba(181,50,42,0.35)', text: '#B5302A' }
  if (s === 'moderate') return { bg: 'rgba(181,120,42,0.12)', border: 'rgba(181,120,42,0.35)', text: '#B5782A' }
  if (s === 'mild')     return { bg: 'rgba(180,160,20,0.12)', border: 'rgba(180,160,20,0.35)', text: '#8B7B00' }
  if (s === 'none')     return { bg: 'rgba(63,107,53,0.12)',  border: 'rgba(63,107,53,0.35)',  text: '#3F6B35' }
  return                       { bg: 'rgba(100,100,100,0.1)', border: 'rgba(100,100,100,0.3)', text: '#555' }
}

function diseaseTypeIcon(dtype) {
  const d = (dtype || '').toLowerCase()
  if (d.includes('fungal'))    return '🍄'
  if (d.includes('bacterial')) return '🦠'
  if (d.includes('viral'))     return '🧬'
  if (d.includes('nutrient'))  return '🌿'
  if (d.includes('healthy'))   return '✅'
  return '🔬'
}

function ConfidenceBar({ label, confidence, color = '#3F6B35' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.83rem', fontWeight: 600, color: '#1F3D1A' }}>{label}</span>
        <span style={{ fontSize: '0.83rem', fontWeight: 800, color }}>{(confidence * 100).toFixed(1)}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.min(confidence * 100, 100)}%`, background: color }} />
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6E7F69', textTransform: 'uppercase', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: valueColor || '#1F3D1A', lineHeight: 1.5 }}>{value || '—'}</div>
      </div>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function LeafUpload() {
  const [imageFile, setImageFile]   = useState(null)
  const [imageUrl, setImageUrl]     = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const { diseaseResult, deficiencyResult, setDiseaseResult, setDeficiencyResult, language } = useAgriStore()
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  const onDrop = useCallback(accepted => {
    if (accepted.length > 0) {
      setImageFile(accepted[0])
      setImageUrl(URL.createObjectURL(accepted[0]))
      setDiseaseResult(null)
      setDeficiencyResult(null)
      setError(null)
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
      const errMsg = err?.message || err?.response?.data?.detail || 'Error connecting to backend or processing image. Please try again.'
      setError(errMsg)
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

  /* ── Derived display values from Gemini result ── */
  const isHealthy     = diseaseResult?.is_healthy || false
  const hasApiError   = diseaseResult?.error === true
  const hasDeficiencyError = deficiencyResult?.error === true
  const analysisComplete = diseaseResult && deficiencyResult && !hasApiError && !hasDeficiencyError
  const severityStyle = severityColor(diseaseResult?.severity)
  const mainColor     = isHealthy ? '#3F6B35' : '#B5502A'

  return (
    <div className="page-container">
      {/* Header */}
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
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(63,107,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(63,107,53,0.3)' }}>
                <Upload size={32} color="#3F6B35" strokeWidth={1.75} />
              </div>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1F3D1A', marginBottom: 4 }}>
                  {isDragActive ? 'Drop leaf photo here...' : t.uploadBoxTitle}
                </div>
                <div style={{ color: '#6E7F69', fontSize: '0.88rem' }}>Supports PNG, JPG, JPEG, WEBP — any plant species</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass" style={{ marginBottom: 24, padding: 22, display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src={imageUrl} alt="Uploaded leaf" style={{ width: 190, height: 190, objectFit: 'cover', borderRadius: 14, border: '2px solid rgba(31,61,26,0.15)' }} />
              <div style={{ position: 'absolute', top: 8, right: 8, background: '#3F6B35', borderRadius: 100, padding: 4 }}>
                <Eye size={14} color="#FFFFFF" />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: '0.82rem', color: '#6E7F69', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Selected Leaf Image</div>
              <div style={{ fontWeight: 800, color: '#1F3D1A', fontSize: '1.05rem', marginBottom: 2 }}>{imageFile?.name}</div>
              <div style={{ fontSize: '0.82rem', color: '#485A43', marginBottom: 18 }}>{(imageFile?.size / 1024).toFixed(1)} KB</div>

              {/* Gemini badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.25)', borderRadius: 8, padding: '5px 10px', marginBottom: 16 }}>
                <Zap size={12} color="#4285F4" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4285F4' }}>Powered by Gemini Vision AI</span>
              </div>

              {error && (
                <div style={{ background: 'rgba(181,80,42,0.1)', border: '1px solid rgba(181,80,42,0.3)', borderRadius: 8, padding: '10px 14px', color: '#B5502A', fontSize: '0.84rem', fontWeight: 600, marginBottom: 16 }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={handleAnalyze} disabled={loading} className="btn-primary">
                  {loading
                    ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing with AI...</>
                    : <><Camera size={15} /> {t.analyzeLeafButton}</>}
                </button>
                <button onClick={resetAll} className="btn-secondary">
                  <RefreshCw size={15} /> Scan Another Leaf
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Disease Result Card ── */}
      {diseaseResult && (
        <div className="glass animate-fade-in" style={{ padding: 28, marginBottom: 20 }}>

          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: isHealthy ? 'rgba(63,107,53,0.12)' : 'rgba(181,80,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isHealthy ? <CheckCircle2 size={20} color="#3F6B35" /> : <AlertTriangle size={20} color="#B5502A" />}
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase' }}>AI Plant Disease Diagnosis</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1F3D1A' }}>Gemini Vision Analysis</div>
              </div>
            </div>
            {diseaseResult.model && !hasApiError && (
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6E7F69', background: 'rgba(100,100,100,0.07)', borderRadius: 6, padding: '4px 8px' }}>
                Model: {diseaseResult.model}
              </div>
            )}
          </div>

          {/* API Key Error */}
          {hasApiError ? (
            <div style={{ background: 'rgba(181,80,42,0.08)', border: '1px solid rgba(181,80,42,0.3)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertCircle size={18} color="#B5502A" />
                <span style={{ fontWeight: 800, color: '#B5502A', fontSize: '0.95rem' }}>Configuration Required</span>
              </div>
              <div style={{ fontSize: '0.88rem', color: '#1F3D1A', lineHeight: 1.7 }}>
                {diseaseResult.error_message}
              </div>
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,0,0,0.04)', borderRadius: 8, fontFamily: 'monospace', fontSize: '0.82rem', color: '#333' }}>
                1. Open: <strong>backend/.env</strong><br />
                2. Replace: <code>GEMINI_API_KEY=your_gemini_api_key_here</code><br />
                3. Get your free key at: <strong>aistudio.google.com</strong><br />
                4. Restart the backend server
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Left Column — Main Diagnosis */}
              <div>
                {/* Disease Name Banner */}
                <div style={{ background: isHealthy ? 'rgba(63,107,53,0.08)' : 'rgba(181,80,42,0.07)', border: `1px solid ${isHealthy ? 'rgba(63,107,53,0.2)' : 'rgba(181,80,42,0.2)'}`, borderRadius: 12, padding: '18px 20px', marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 4 }}>{diseaseTypeIcon(diseaseResult.disease_type)}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Detected Condition</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: mainColor, lineHeight: 1.2, marginBottom: 6 }}>
                    {diseaseResult.disease_name || diseaseResult.disease_label}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#485A43', marginBottom: 8 }}>
                    Confidence: <strong style={{ color: '#1F3D1A' }}>{((diseaseResult.confidence || 0) * 100).toFixed(1)}%</strong>
                  </div>
                  {/* Severity Badge */}
                  {diseaseResult.severity && diseaseResult.severity !== 'Unknown' && (
                    <div style={{ display: 'inline-block', background: severityStyle.bg, border: `1px solid ${severityStyle.border}`, borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 800, color: severityStyle.text }}>
                      {diseaseResult.severity} Severity
                    </div>
                  )}
                </div>

                {/* Key Details */}
                <InfoRow icon="🌱" label="Plant Species" value={diseaseResult.plant_type} />
                <InfoRow icon="🔬" label="Disease Type" value={diseaseResult.disease_type} />
                <InfoRow icon="👁" label="Visible Symptoms" value={diseaseResult.symptoms} />
              </div>

              {/* Right Column — Treatment & Alternatives */}
              <div>
                {/* Treatment */}
                <div style={{ background: 'rgba(181,80,42,0.07)', border: '1px solid rgba(181,80,42,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <FlaskConical size={14} color="#B5502A" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B5502A', textTransform: 'uppercase' }}>Treatment Plan</span>
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#1F3D1A', lineHeight: 1.65, fontWeight: 500 }}>
                    {diseaseResult.treatment || 'Consult an agronomist.'}
                  </div>
                </div>

                {/* Prevention */}
                {diseaseResult.prevention && (
                  <div style={{ background: 'rgba(63,107,53,0.07)', border: '1px solid rgba(63,107,53,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Shield size={14} color="#3F6B35" />
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3F6B35', textTransform: 'uppercase' }}>Prevention</span>
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#1F3D1A', lineHeight: 1.65, fontWeight: 500 }}>
                      {diseaseResult.prevention}
                    </div>
                  </div>
                )}

                {/* Top Alternatives */}
                {diseaseResult.disease_classes && diseaseResult.disease_classes.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6E7F69', textTransform: 'uppercase', marginBottom: 10 }}>
                      <Info size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Other Possibilities
                    </div>
                    {diseaseResult.disease_classes.slice(0, 4).map(({ label, confidence }, i) => (
                      <ConfidenceBar
                        key={i}
                        label={label}
                        confidence={confidence}
                        color={label.toLowerCase().includes('healthy') ? '#3F6B35' : '#B5502A'}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Nutrient Deficiency Card (existing model) ── */}
      {deficiencyResult && (
        <div className="glass animate-fade-in" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(63,107,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={18} color="#3F6B35" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase' }}>Nutrient Assessment</div>
              <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#1F3D1A' }}>Nutrient Deficiency Diagnosis</div>
            </div>
          </div>

          {hasDeficiencyError ? (
            <div style={{ background: 'rgba(181,80,42,0.08)', border: '1px solid rgba(181,80,42,0.3)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertCircle size={18} color="#B5502A" />
                <span style={{ fontWeight: 800, color: '#B5502A', fontSize: '0.95rem' }}>Nutrient Diagnosis Unavailable</span>
              </div>
              <div style={{ fontSize: '0.88rem', color: '#1F3D1A', lineHeight: 1.7 }}>
                {deficiencyResult.error_message || 'The image could not be classified. No nutrient result was generated.'}
              </div>
            </div>
          ) : (
            <>
          <div style={{ background: '#F4F7EE', border: '1px solid rgba(31,61,26,0.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Nutrient Condition</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: (deficiencyResult.deficiency_type || '').toLowerCase().includes('healthy') ? '#3F6B35' : '#B5502A' }}>
              {deficiencyResult.deficiency_type}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#485A43', marginTop: 4 }}>
              Confidence: <strong style={{ color: '#1F3D1A' }}>{((deficiencyResult.confidence || 0) * 100).toFixed(1)}%</strong>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            {(deficiencyResult.deficiency_classes || []).map(({ label, confidence }) => (
              <ConfidenceBar
                key={label}
                label={label}
                confidence={confidence}
                color={label.toLowerCase().includes('healthy') ? '#3F6B35' : '#B5502A'}
              />
            ))}
          </div>

          {deficiencyResult.advice && (
            <div style={{ background: 'rgba(63,107,53,0.08)', border: '1px solid rgba(63,107,53,0.25)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.75rem', color: '#3F6B35', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Correction Plan</div>
              <div style={{ fontSize: '0.88rem', color: '#1F3D1A', lineHeight: 1.6, fontWeight: 500 }}>{deficiencyResult.advice}</div>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* Sync banner */}
      {analysisComplete && (
        <div className="glass animate-fade-in" style={{ padding: 20, marginTop: 4, borderColor: 'rgba(63,107,53,0.3)', background: 'rgba(63,107,53,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={24} color="#3F6B35" />
            <div>
              <div style={{ fontWeight: 800, color: '#1F3D1A', marginBottom: 2 }}>Multimodal Leaf Analysis Complete</div>
              <div style={{ color: '#485A43', fontSize: '0.88rem' }}>
                Disease: <strong>{diseaseResult.disease_name || diseaseResult.disease_label}</strong> &nbsp;|&nbsp;
                Nutrient: <strong>{deficiencyResult.deficiency_type}</strong> — saved to session for fertilizer planning.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
