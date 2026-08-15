import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, RefreshCw, User, Bot, Sparkles, CheckCircle2, Sprout, FlaskConical, Cloud, Bug } from 'lucide-react'
import { sendChatMessage } from '../api/agriApi'
import useAgriStore from '../store/useAgriStore'
import { TRANSLATIONS } from '../i18n/translations'

const SUGGESTED = [
  'What fertilizer schedule is best for rice with low soil nitrogen?',
  'How do I correct acidic soil with pH 5.2?',
  'My tomato leaves are turning yellow with brown spots — what is the remedy?',
  'How much urea should I apply per acre for wheat crop?',
  'How does upcoming rainfall affect my top-dressing fertilizer plan?',
]

// Simple markdown formatter for Gemini AI responses
function MarkdownView({ content }) {
  if (!content) return null
  const lines = content.split('\n')

  return (
    <div style={{ fontSize: '0.92rem', lineHeight: 1.65, color: '#1F3D1A' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={idx} style={{ height: 6 }} />

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} style={{ margin: '10px 0 4px', fontSize: '1.02rem', fontWeight: 800, color: '#1F3D1A' }}>
              {trimmed.replace('### ', '')}
            </h4>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} style={{ margin: '14px 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#1F3D1A', borderBottom: '1px solid rgba(31, 61, 26, 0.1)', paddingBottom: 3 }}>
              {trimmed.replace('## ', '')}
            </h3>
          )
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} style={{ margin: '16px 0 8px', fontSize: '1.2rem', fontWeight: 900, color: '#1F3D1A' }}>
              {trimmed.replace('# ', '')}
            </h2>
          )
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.substring(2)
          return (
            <div key={idx} style={{ display: 'flex', gap: 7, margin: '3px 0', alignItems: 'flex-start' }}>
              <span style={{ color: '#3F6B35', fontWeight: 900, fontSize: '1rem', lineHeight: 1.2 }}>•</span>
              <div>{renderFormattedText(itemText)}</div>
            </div>
          )
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const number = trimmed.match(/^(\d+\.)\s/)[1]
          const itemText = trimmed.replace(/^\d+\.\s/, '')
          return (
            <div key={idx} style={{ display: 'flex', gap: 7, margin: '4px 0', alignItems: 'flex-start' }}>
              <span style={{ color: '#2F5E73', fontWeight: 800, minWidth: 18 }}>{number}</span>
              <div>{renderFormattedText(itemText)}</div>
            </div>
          )
        }

        return (
          <p key={idx} style={{ margin: '4px 0' }}>
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
        <code key={i} style={{ background: '#EEF0E4', color: '#B5502A', padding: '2px 5px', borderRadius: 4, fontSize: '0.85em', fontWeight: 700 }}>
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

export default function Chatbot() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const {
    chatMessages, addChatMessage, clearChat,
    soilData, soilResult,
    cropResult, selectedCrop,
    weatherData, diseaseResult, deficiencyResult,
    language
  } = useAgriStore()
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, loading])

  const buildContext = () => {
    const ctx = { language }
    if (soilData || soilResult) {
      ctx.soil = soilData || soilResult?.input || soilResult
    }
    if (selectedCrop || cropResult?.recommended_crops?.[0]) {
      ctx.crop = selectedCrop || cropResult.recommended_crops[0].crop
    }
    if (weatherData) {
      ctx.weather = {
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        rainfall: weatherData.rainfall,
        city: weatherData.city
      }
    }
    if (diseaseResult)    ctx.disease    = diseaseResult.disease || diseaseResult.disease_label
    if (deficiencyResult) ctx.deficiency = deficiencyResult.deficiency || deficiencyResult.deficiency_type
    return ctx
  }

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    addChatMessage({ role: 'user', content: msg, id: Date.now() })
    setLoading(true)
    try {
      const res = await sendChatMessage(msg, buildContext())
      addChatMessage({
        role: 'ai',
        content: res.response || res.message || '',
        source: res.source || 'gemini',
        model: res.model || 'gemini-flash-lite-latest',
        id: Date.now() + 1
      })
    } catch (err) {
      addChatMessage({
        role: 'ai',
        content: 'I am currently operating in offline mode. Please refer to your Montana fertilizer plan or consult a local agronomist.',
        source: 'rule_based',
        id: Date.now() + 1
      })
    } finally {
      setLoading(false)
    }
  }

  const activeCrop = selectedCrop || cropResult?.recommended_crops?.[0]?.crop
  const hasSoil = Boolean(soilData || soilResult)
  const hasDisease = Boolean(diseaseResult)

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)' }}>
      {/* Header */}
      <div className="page-header animate-fade-in-up" style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div className="badge badge-crop" style={{ display: 'inline-flex' }}>
            <Sparkles size={12} /> Powered by Google Gemini AI
          </div>
          {/* Active Context Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {hasSoil && (
              <span className="badge badge-sand" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FlaskConical size={11} /> Soil Loaded
              </span>
            )}
            {activeCrop && (
              <span className="badge badge-crop" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sprout size={11} /> Crop: {activeCrop}
              </span>
            )}
            {hasDisease && (
              <span className="badge badge-clay" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Bug size={11} /> Leaf: {diseaseResult.disease}
              </span>
            )}
            {weatherData && (
              <span className="badge badge-water" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Cloud size={11} /> {weatherData.temperature}°C
              </span>
            )}
          </div>
        </div>
        <h1 className="page-title" style={{ fontSize: '1.55rem', marginTop: 4 }}>{t.chatTitle}</h1>
        <p className="page-subtitle" style={{ fontSize: '0.86rem' }}>{t.chatSubtitle}</p>
      </div>

      {/* Main Chat Panel */}
      <div className="glass animate-fade-in-up stagger-1" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, borderRadius: 16, border: '1px solid rgba(31, 61, 26, 0.15)' }}>
        
        {/* Chat Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 16, background: '#F8FAF3' }}>
          {chatMessages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', maxWidth: 540, padding: '20px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(63, 107, 53, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(63, 107, 53, 0.25)' }}>
                <Sparkles size={30} color="#3F6B35" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1F3D1A', marginBottom: 8 }}>Google Gemini Agricultural Assistant</h2>
              <p style={{ color: '#485A43', fontSize: '0.9rem', marginBottom: 22, lineHeight: 1.5 }}>
                Ask questions about fertilizer dosages, Montana calculations, nutrient deficiency remedies, spray timing, or plant disease management.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {SUGGESTED.map((q, i) => (
                  <button key={i} onClick={() => send(q)} style={{ background: '#FFFFFF', border: '1px solid rgba(31, 61, 26, 0.15)', color: '#1F3D1A', borderRadius: 20, padding: '7px 14px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(31, 61, 26, 0.04)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3F6B35'; e.currentTarget.style.color = '#3F6B35' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(31, 61, 26, 0.15)'; e.currentTarget.style.color = '#1F3D1A' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatMessages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 12, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'ai' && (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1F3D1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={19} color="#EEF0E4" />
                  </div>
                )}
                <div style={{
                  maxWidth: '82%', padding: '14px 18px', borderRadius: 14,
                  background: msg.role === 'user' ? '#3F6B35' : '#FFFFFF',
                  color: msg.role === 'user' ? '#FFFFFF' : '#1F3D1A',
                  fontWeight: msg.role === 'user' ? 600 : 500, fontSize: '0.92rem', lineHeight: 1.6,
                  border: msg.role === 'ai' ? '1px solid rgba(31, 61, 26, 0.12)' : 'none',
                  boxShadow: '0 2px 8px rgba(31, 61, 26, 0.06)'
                }}>
                  {msg.role === 'ai' && msg.source && (
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#3F6B35', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <Sparkles size={11} /> {msg.source === 'gemini' ? `Google Gemini (${msg.model || 'Flash'})` : 'AgriSense Knowledge Engine'}
                    </div>
                  )}
                  {msg.role === 'ai' ? (
                    <MarkdownView content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(63, 107, 53, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={19} color="#3F6B35" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1F3D1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={19} color="#EEF0E4" />
              </div>
              <div style={{ background: '#FFFFFF', padding: '10px 16px', borderRadius: 14, color: '#485A43', fontSize: '0.86rem', border: '1px solid rgba(31, 61, 26, 0.1)' }}>
                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', display: 'inline', marginRight: 6 }} /> Gemini AI is analyzing your question & farm context...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: 14, background: '#E3E8D7', borderTop: '1px solid rgba(31, 61, 26, 0.12)', display: 'flex', gap: 10 }}>
          <input
            ref={inputRef}
            type="text"
            className="form-input"
            placeholder={t.typeMessage}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            style={{ flex: 1 }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-primary">
            <Send size={15} /> {t.send}
          </button>
          <button onClick={clearChat} className="btn-secondary" title="Clear Chat">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
