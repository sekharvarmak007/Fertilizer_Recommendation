import { useState } from 'react'
import { CloudSun, Search, RefreshCw, Thermometer, Droplets, Wind, CloudRain, Eye, Gauge, CheckCircle2, AlertTriangle } from 'lucide-react'
import { getWeather } from '../api/agriApi'
import useAgriStore from '../store/useAgriStore'
import { TRANSLATIONS } from '../i18n/translations'

const MOCK_WEATHER = {
  city: 'Hyderabad',
  country: 'IN',
  temperature: 32.4,
  feels_like: 36.1,
  humidity: 72,
  rainfall: 8.2,
  wind_speed: 14.3,
  wind_direction: 'SW',
  description: 'Partly Cloudy',
  visibility: 8.0,
  pressure: 1008,
  icon: '04d',
  uv_index: 6,
  impact: [
    { factor: 'Fertilizer Timing', status: 'warning', message: 'Rainfall expected soon. Delay urea top-dressing by 2–3 days to avoid nutrient leaching.' },
    { factor: 'Application Method', status: 'good', message: 'Humidity is optimal for foliar spray. Best applied during early morning hours.' },
    { factor: 'Disease Risk', status: 'warning', message: 'High humidity (72%) increases fungal spore germination. Monitor for early blight.' },
    { factor: 'Irrigation Scheduling', status: 'good', message: 'Recent showers satisfy moisture demand. Pause standard irrigation cycle.' },
  ]
}

const weatherCards = [
  { key: 'temperature',  label: 'Temperature', unit: '°C',   icon: Thermometer, color: '#B5502A', bg: 'rgba(181, 80, 42, 0.12)' },
  { key: 'humidity',     label: 'Humidity',    unit: '%',    icon: Droplets,    color: '#2F5E73', bg: 'rgba(47, 94, 115, 0.12)' },
  { key: 'rainfall',     label: 'Rainfall',    unit: 'mm',   icon: CloudRain,   color: '#2F5E73', bg: 'rgba(47, 94, 115, 0.12)' },
  { key: 'wind_speed',   label: 'Wind Speed',  unit: 'km/h', icon: Wind,        color: '#3F6B35', bg: 'rgba(63, 107, 53, 0.12)' },
  { key: 'pressure',     label: 'Pressure',    unit: 'hPa',  icon: Gauge,       color: '#B98A4E', bg: 'rgba(185, 138, 78, 0.12)' },
  { key: 'visibility',   label: 'Visibility',  unit: 'km',   icon: Eye,         color: '#3F6B35', bg: 'rgba(63, 107, 53, 0.12)' },
]

const POPULAR_CITIES = ['Hyderabad', 'Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Kolkata', 'Pune', 'Jaipur']

export default function WeatherDashboard() {
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { weatherData, setWeatherData, language } = useAgriStore()
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  const fetchWeather = async (cityName) => {
    const q = cityName || city
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await getWeather(q)
      setWeatherData(data)
    } catch (err) {
      setError('Using demo weather forecast data.')
      setWeatherData({ ...MOCK_WEATHER, city: q || MOCK_WEATHER.city })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div className="badge badge-water" style={{ display: 'inline-flex', marginBottom: 10 }}>
          <CloudSun size={12} /> {t.weather}
        </div>
        <h1 className="page-title">{t.weatherTitle}</h1>
        <div className="section-divider" />
        <p className="page-subtitle">{t.weatherSubtitle}</p>
      </div>

      {/* Search Bar */}
      <div className="glass animate-fade-in-up stagger-1" style={{ padding: 24, marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} color="#6E7F69" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              id="weather-city-input"
              className="form-input"
              placeholder="Enter agricultural region or city (e.g. Hyderabad, Delhi)..."
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchWeather()}
              style={{ paddingLeft: 42 }}
            />
          </div>
          <button onClick={() => fetchWeather()} disabled={loading} className="btn-primary">
            {loading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={15} />}
            {loading ? 'Fetching...' : t.fetchWeather}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase' }}>Quick Select:</span>
          {POPULAR_CITIES.map(c => (
            <button key={c} onClick={() => { setCity(c); fetchWeather(c) }}
              style={{ padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(31, 61, 26, 0.15)', background: '#FFFFFF', color: '#1F3D1A', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#3F6B35'; e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#1F3D1A' }}
            >{c}</button>
          ))}
        </div>

        {error && <div style={{ marginTop: 10, color: '#B5502A', fontSize: '0.82rem', fontWeight: 600 }}>⚠ {error}</div>}
      </div>

      {weatherData && (
        <div className="animate-fade-in">
          {/* Main Temp Banner */}
          <div className="glass" style={{ padding: 26, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, borderLeft: '5px solid #2F5E73' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk', color: '#1F3D1A' }}>
                {weatherData.city}, <span style={{ color: '#6E7F69', fontSize: '1.3rem' }}>{weatherData.country}</span>
              </div>
              <div style={{ color: '#485A43', fontSize: '1rem', marginTop: 3, fontWeight: 600, textTransform: 'capitalize' }}>
                ⛅ {weatherData.description}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '3.4rem', fontWeight: 900, lineHeight: 1, color: '#1F3D1A' }}>
                {weatherData.temperature}°<span style={{ fontSize: '1.8rem', color: '#2F5E73' }}>C</span>
              </div>
              <div style={{ color: '#6E7F69', fontSize: '0.86rem', fontWeight: 600 }}>Feels like {weatherData.feels_like}°C</div>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {weatherCards.map(({ key, label, unit, icon: Icon, color, bg }) => (
              <div key={key} className="glass card-hover" style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color={color} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#6E7F69', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1F3D1A' }}>
                    {weatherData[key]}<span style={{ fontSize: '0.8rem', color: '#6E7F69', fontWeight: 600 }}> {unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ag Impact Advisories */}
          <div className="glass" style={{ padding: 26 }}>
            <h3 style={{ margin: '0 0 18px', fontSize: '1.02rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#1F3D1A' }}>
              <CloudSun size={18} color="#2F5E73" /> {t.advisoryRules}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {(weatherData.impact || MOCK_WEATHER.impact).map(({ factor, status, message }) => {
                const isGood = status === 'good'
                return (
                  <div key={factor} style={{
                    padding: '16px 18px',
                    borderRadius: 12,
                    background: isGood ? 'rgba(63, 107, 53, 0.08)' : 'rgba(181, 80, 42, 0.08)',
                    border: `1.5px solid ${isGood ? 'rgba(63, 107, 53, 0.25)' : 'rgba(181, 80, 42, 0.25)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {isGood ? <CheckCircle2 size={16} color="#3F6B35" /> : <AlertTriangle size={16} color="#B5502A" />}
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: isGood ? '#3F6B35' : '#B5502A' }}>{factor}</div>
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#1F3D1A', lineHeight: 1.55, fontWeight: 500 }}>{message}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
