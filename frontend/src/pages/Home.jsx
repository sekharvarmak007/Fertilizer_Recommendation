import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FlaskConical, Camera, Leaf, Sprout, CloudSun, Network,
  MessageSquare, ChevronRight, Zap, Shield, BarChart3,
  ArrowRight, CheckCircle2, Star
} from 'lucide-react'
import useAgriStore from '../store/useAgriStore'
import { TRANSLATIONS } from '../i18n/translations'

function Counter({ end, suffix, duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const step = end / (duration / 16)
        let cur = 0
        const timer = setInterval(() => {
          cur = Math.min(cur + step, end)
          setCount(Math.floor(cur))
          if (cur >= end) clearInterval(timer)
        }, 16)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

export default function Home() {
  const { language } = useAgriStore()
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  const features = [
    {
      icon: FlaskConical, color: '#3F6B35', bg: 'rgba(63, 107, 53, 0.12)',
      title: t.soil || 'Soil Fertility Analysis',
      desc: t.soilSubtitle || 'XGBoost-powered prediction of soil health from N, P, K, pH, EC, and organic carbon values.',
      path: '/soil', label: t.analyzeSoil || 'Analyze Soil'
    },
    {
      icon: Camera, color: '#B5502A', bg: 'rgba(181, 80, 42, 0.12)',
      title: t.plantDiseaseDeficiency || t.leaf || 'Plant Disease & Deficiency',
      desc: t.plantDiseaseDeficiencyDesc || 'YOLOv11 vision models identify crop diseases and visual nutrient deficiencies in seconds.',
      path: '/leaf', label: t.uploadLeaf || 'Scan Leaf'
    },
    {
      icon: Leaf, color: '#3F6B35', bg: 'rgba(63, 107, 53, 0.12)',
      title: t.crops || 'Crop Recommendation',
      desc: t.cropRecommendationDesc || 'Discover the most suitable crop for your soil and climate using machine learning classifiers.',
      path: '/crop', label: t.cropSuitability || 'Find Crops'
    },
    {
      icon: Sprout, color: '#5C3A21', bg: 'rgba(92, 58, 33, 0.12)',
      title: t.fertilizerPlanning || t.fertilizer || 'Fertilizer Planning',
      desc: t.fertilizerPlanningDesc || 'Montana scientific formulas compute exact Urea, MAP, and MOP dosages with split schedules.',
      path: '/fertilizer', label: t.getRecommendation || 'Get Plan'
    },
    {
      icon: CloudSun, color: '#2F5E73', bg: 'rgba(47, 94, 115, 0.12)',
      title: t.weatherIntelligence || t.weather || 'Weather Intelligence',
      desc: t.weatherIntelligenceDesc || 'Live forecast integration with rainfall alerts to prevent fertilizer runoff and leaching.',
      path: '/weather', label: t.weather || 'Check Weather'
    },
    {
      icon: Network, color: '#2F5E73', bg: 'rgba(47, 94, 115, 0.12)',
      title: t.knowledge || 'Knowledge Graph',
      desc: t.knowledgeGraphDesc || 'Explore crop→nutrient→deficiency relationships in an interactive Neo4j ontology graph.',
      path: '/knowledge', label: t.knowledge || 'Explore Graph'
    },
    {
      icon: MessageSquare, color: '#1F3D1A', bg: 'rgba(31, 61, 26, 0.12)',
      title: t.aiFarmingAssistant || t.chatbot || 'AI Farming Assistant',
      desc: t.aiFarmingAssistantDesc || 'Ask anything to our agricultural copilot for real-time recommendations.',
      path: '/chatbot', label: t.aiAssistant || 'Ask AI'
    },
  ]

  const stats = [
    { label: t.cropsSupported || 'Crops Supported',    end: 24,   suffix: '+' },
    { label: t.diseaseClasses || 'Disease Classes',    end: 38,   suffix: '+' },
    { label: t.modelAccuracy || 'Model Accuracy',     end: 96,   suffix: '%' },
    { label: t.formulasApplied || 'Formulas Applied',   end: 7,    suffix: '' },
  ]

  const pipeline = [
    { step: '01', label: t.soil || 'Soil Input',         color: '#3F6B35', icon: FlaskConical },
    { step: '02', label: t.leaf || 'Leaf Scan',           color: '#B5502A', icon: Camera },
    { step: '03', label: t.weather || 'Weather Data',        color: '#2F5E73', icon: CloudSun },
    { step: '04', label: t.knowledge || 'Knowledge Graph',     color: '#5C3A21', icon: Network },
    { step: '05', label: t.montanaFormulas || 'Montana Formulas',    color: '#3F6B35', icon: Zap },
    { step: '06', label: t.aiAdvisory || 'AI Advisory',         color: '#1F3D1A', icon: Star },
  ]

  return (
    <div>
      {/* ── Hero Section ─────────────────────────── */}
      <section style={{
        minHeight: '85vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '110px 24px 60px',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Subtle Decorative orbs */}
        <div style={{ position: 'absolute', top: '12%', left: '8%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(63, 107, 53, 0.12) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(47, 94, 115, 0.1) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative' }}>
          <div className="animate-fade-in-up badge badge-crop" style={{ display: 'inline-flex', marginBottom: 18 }}>
            <Zap size={13} />
            {t.platformSubtitle || 'AI-Powered Smart Agriculture Platform'}
          </div>

          <h1 className="animate-fade-in-up stagger-1" style={{
            fontSize: 'clamp(2.3rem, 5.2vw, 3.8rem)', fontWeight: 900,
            fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.03em',
            lineHeight: 1.15, margin: '0 0 20px', color: '#1F3D1A'
          }}>
            {t.heroTitle || 'Multimodal AI Fertilizer & Crop Advisor'}
          </h1>

          <p className="animate-fade-in-up stagger-2" style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: '#485A43',
            lineHeight: 1.68, maxWidth: 690, margin: '0 auto 36px', fontWeight: 500
          }}>
            {t.heroDesc || 'Combines XGBoost ML, YOLOv11 Vision, Neo4j Knowledge Graph, and Montana State University fertilizer formulas to deliver science-backed agronomic plans.'}
          </p>

          <div className="animate-fade-in-up stagger-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <Link to="/soil" className="btn-primary" style={{ fontSize: '0.98rem', padding: '13px 28px' }}>
              {t.analyzeSoil} <ArrowRight size={16} />
            </Link>
            <Link to="/chatbot" className="btn-secondary" style={{ fontSize: '0.98rem', padding: '13px 28px' }}>
              <MessageSquare size={16} /> {t.aiAssistant}
            </Link>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-in-up stagger-4" style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Montana Guidelines', 'PlantVillage Dataset', 'Live OpenWeatherMap', '11 Languages Supported'].map(tag => (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#5A6C56', fontSize: '0.84rem', fontWeight: 600 }}>
                <CheckCircle2 size={15} color="#3F6B35" /> {tag}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Strip (Canopy Background) ───────── */}
      <section style={{ background: '#1F3D1A', borderTop: '1px solid rgba(238, 240, 228, 0.1)', borderBottom: '1px solid rgba(238, 240, 228, 0.1)', padding: '44px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24 }}>
          {stats.map(({ label, end, suffix }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(2rem, 4vw, 2.7rem)', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#E8C79B', lineHeight: 1 }}>
                <Counter end={end} suffix={suffix} />
              </div>
              <div style={{ color: '#D0DEC7', fontSize: '0.88rem', fontWeight: 600, marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ────────────────────────── */}
      <section style={{ padding: '76px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <div className="badge badge-water" style={{ display: 'inline-flex', marginBottom: 10 }}>
            <BarChart3 size={13} /> {t.intelligentModules || '7 Intelligent Modules'}
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.3rem)', fontWeight: 800, margin: '0 0 10px', color: '#1F3D1A' }}>
            {t.everythingForSmartAgri || 'Everything You Need for Smart Agriculture'}
          </h2>
          <div className="section-divider" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#485A43', fontSize: '1rem', maxWidth: 580, margin: '0 auto', lineHeight: 1.5 }}>
            {t.moduleDesc || 'Each module is powered by specialized machine learning models and validated agricultural science.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 22 }}>
          {features.map(({ icon: Icon, color, bg, title, desc, path, label }, i) => (
            <div key={title} className="glass card-hover animate-fade-in-up" style={{ padding: 26, animationDelay: `${i * 0.07}s` }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={23} color={color} strokeWidth={2} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700, color: '#1F3D1A' }}>{title}</h3>
              <p style={{ color: '#485A43', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 18px' }}>{desc}</p>
              <Link to={path} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                color, fontSize: '0.86rem', fontWeight: 700, textDecoration: 'none',
                transition: 'gap 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.gap = '9px'}
                onMouseLeave={e => e.currentTarget.style.gap = '5px'}
              >
                {label} <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline Steps ───────────────────────── */}
      <section style={{ background: '#E3E8D6', borderTop: '1px solid rgba(31, 61, 26, 0.1)', borderBottom: '1px solid rgba(31, 61, 26, 0.1)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, margin: '0 0 10px', color: '#1F3D1A' }}>
              {t.howItWorks || 'How It Works'}
            </h2>
            <div className="section-divider" style={{ margin: '0 auto 14px' }} />
            <p style={{ color: '#485A43', maxWidth: 500, margin: '0 auto' }}>
              {t.pipelineDesc || 'A complete advisory pipeline from soil chemistry and leaf diagnosis to exact fertilizer kilos.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            {pipeline.map(({ step, label, color, icon: Icon }, idx) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div className="glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 175 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={19} color={color} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{step}</div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1F3D1A' }}>{label}</div>
                  </div>
                </div>
                {idx < pipeline.length - 1 && (
                  <ArrowRight size={16} color="#8A9D84" style={{ flexShrink: 0, margin: '0 -3px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action ───────────────────────── */}
      <section style={{ padding: '76px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 68, height: 68, borderRadius: 18,
            background: 'rgba(63, 107, 53, 0.12)',
            border: '1.5px solid rgba(63, 107, 53, 0.25)', marginBottom: 20
          }}>
            <Shield size={32} color="#3F6B35" strokeWidth={1.75} />
          </div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.3rem)', fontWeight: 800, margin: '0 0 14px', color: '#1F3D1A' }}>
            {t.readyToOptimize || 'Ready to Optimize Your Farm Yield?'}
          </h2>
          <p style={{ color: '#485A43', fontSize: '1.02rem', lineHeight: 1.65, marginBottom: 30 }}>
            {t.ctaDesc || 'Input your soil test data or leaf scan and generate a comprehensive fertilizer plan right now.'}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/soil" className="btn-primary" style={{ fontSize: '0.98rem', padding: '13px 30px' }}>
              {t.analyzeSoil} <ArrowRight size={16} />
            </Link>
            <Link to="/leaf" className="btn-secondary" style={{ fontSize: '0.98rem', padding: '13px 30px' }}>
              <Camera size={16} /> {t.uploadLeaf}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(31, 61, 26, 0.12)', background: '#E3E8D7', padding: '30px 24px', textAlign: 'center', color: '#5A6C56', fontSize: '0.84rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginBottom: 6 }}>
          <Leaf size={15} color="#3F6B35" />
          <strong style={{ color: '#1F3D1A' }}>AgriSense AI</strong>
        </div>
        <p style={{ margin: 0 }}>
          Multimodal Agricultural Decision Support System · XGBoost · YOLOv11 · Montana Formulas · Neo4j
        </p>
      </footer>
    </div>
  )
}
