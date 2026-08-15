import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Leaf, FlaskConical, CloudSun, Network, MessageSquare,
  Sprout, Camera, Menu, X, ChevronRight, Globe
} from 'lucide-react'
import useAgriStore from '../store/useAgriStore'
import { LANGUAGES, TRANSLATIONS } from '../i18n/translations'

const navKeys = [
  { path: '/',           key: 'home',       icon: Sprout },
  { path: '/soil',       key: 'soil',       icon: FlaskConical },
  { path: '/leaf',       key: 'leaf',       icon: Camera },
  { path: '/crop',       key: 'crops',      icon: Leaf },
  { path: '/fertilizer', key: 'fertilizer', icon: Sprout },
  { path: '/weather',    key: 'weather',    icon: CloudSun },
  { path: '/knowledge',  key: 'knowledge',  icon: Network },
  { path: '/chatbot',    key: 'chatbot',    icon: MessageSquare },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { language, setLanguage } = useAgriStore()

  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location])

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        transition: 'all 0.25s ease',
        background: scrolled ? 'rgba(31, 61, 26, 0.98)' : 'rgba(31, 61, 26, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(238, 240, 228, 0.12)',
        boxShadow: scrolled ? '0 8px 24px rgba(31, 61, 26, 0.25)' : 'none',
      }}>
        <div style={{
          width: '100%', maxWidth: 1400, margin: '0 auto', padding: '0 18px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12
        }}>

          {/* Logo Section */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #3F6B35 0%, #2F5E73 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}>
              <Leaf size={20} color="#EEF0E4" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em', color: '#EEF0E4', lineHeight: 1.1 }}>
                Agri<span style={{ color: '#E8C79B' }}>Sense</span>
              </div>
              <div style={{ fontSize: '0.62rem', color: '#B2C4A7', letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 700, lineHeight: 1, marginTop: 2 }}>
                {t.platformSubtitle || 'AI Agriculture'}
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'nowrap' }} className="desktop-nav">
            {navKeys.map(({ path, key, icon: Icon }) => {
              const active = location.pathname === path
              const label = t[key] || key
              return (
                <Link key={path} to={path} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 11px', borderRadius: 8, textDecoration: 'none',
                  fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  color: active ? '#EEF0E4' : '#D0DEC7',
                  background: active ? '#3F6B35' : 'transparent',
                  boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                }}>
                  <Icon size={14} strokeWidth={active ? 2.5 : 2} color={active ? '#EEF0E4' : '#B8CCAE'} style={{ flexShrink: 0 }} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

            {/* Language Selector Dropdown */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(238, 240, 228, 0.1)', border: '1px solid rgba(238, 240, 228, 0.2)',
              borderRadius: 8, padding: '4px 8px',
            }}>
              <Globe size={13} color="#E8C79B" style={{ flexShrink: 0 }} />
              <select
                id="header-language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EEF0E4',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  paddingRight: 2,
                  fontFamily: 'inherit',
                  maxWidth: 110,
                }}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} style={{ background: '#1F3D1A', color: '#EEF0E4' }}>
                    {lang.flag} {lang.native}
                  </option>
                ))}
              </select>
            </div>

            {/* CTA Button in Header */}
            <Link to="/fertilizer" className="btn-primary" style={{ padding: '7px 13px', fontSize: '0.78rem', borderRadius: 8, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span>{t.getRecommendation}</span> <ChevronRight size={13} style={{ flexShrink: 0 }} />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ display: 'none', background: 'rgba(238, 240, 228, 0.1)', border: '1px solid rgba(238, 240, 228, 0.2)', color: '#EEF0E4', cursor: 'pointer', padding: 6, borderRadius: 8 }}
              className="mobile-toggle"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileOpen && (
          <div style={{
            background: '#1F3D1A', borderTop: '1px solid rgba(238, 240, 228, 0.15)',
            padding: '14px 18px 22px', animation: 'fadeInUp 0.2s ease'
          }}>
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(238, 240, 228, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', color: '#D0DEC7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={14} color="#E8C79B" /> Language:
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ background: '#2B5224', border: '1px solid rgba(238, 240, 228, 0.3)', color: '#EEF0E4', fontSize: '0.82rem', fontWeight: 700, padding: '5px 10px', borderRadius: 8 }}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.native} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {navKeys.map(({ path, key, icon: Icon }) => {
                const active = location.pathname === path
                const label = t[key] || key
                return (
                  <Link key={path} to={path} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                    borderRadius: 8, textDecoration: 'none',
                    color: active ? '#EEF0E4' : '#D0DEC7',
                    background: active ? '#3F6B35' : 'rgba(238, 240, 228, 0.08)',
                    fontSize: '0.84rem', fontWeight: 700, whiteSpace: 'nowrap'
                  }}>
                    <Icon size={15} strokeWidth={2} color={active ? '#EEF0E4' : '#B8CCAE'} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 1140px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </>
  )
}
