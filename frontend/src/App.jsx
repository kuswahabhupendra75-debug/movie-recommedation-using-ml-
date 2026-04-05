import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import SearchBar from './components/SearchBar'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import HybridSlider from './components/HybridSlider'
import MetricsPanel from './components/MetricsPanel'
import MovieCard from './components/MovieCard'
const API = import.meta.env.VITE_API_URL || "https://movie-recommedation-using-ml.onrender.com"

// ── Main discover page ────────────────────────────────────────────────────
function DiscoverPage() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentQuery, setCurrentQuery] = useState('')
  const [apiStatus, setApiStatus] = useState('checking')
  const [activeRegion, setActiveRegion] = useState('All')
  const [regionMovies, setRegionMovies] = useState([])
  
  // Pro Mode States
  const [alpha, setAlpha] = useState(0.5)
  const [beta, setBeta] = useState(0.5)
  const [userId, setUserId] = useState('')
  const [showMetrics, setShowMetrics] = useState(false)
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    let cleared = false
    const fetchRegion = async () => {
      if (activeRegion === 'All') {
        if (!cleared) setRegionMovies([])
        return
      }
      setLoading(true); setError(''); setRecommendations([]); setCurrentQuery('');
      try {
        const { data } = await axios.get(`${API}/region/${activeRegion}`, { params: { limit: 12 } })
        if (!cleared) setRegionMovies(data.movies || [])
      } catch {
        if (!cleared) setRegionMovies([])
      } finally {
        if (!cleared) setLoading(false)
      }
    }
    fetchRegion()
    return () => { cleared = true }
  }, [activeRegion])

  useEffect(() => {
    let cleared = false
    const check = async () => {
      try {
        await axios.get(`${API}/`, { timeout: 5000 })
        if (!cleared) setApiStatus('ok')
      } catch {
        if (!cleared) setApiStatus('error')
      }
    }
    check()
    const iv = setInterval(check, 4000)
    return () => { cleared = true; clearInterval(iv) }
  }, [])

  useEffect(() => {
    if (showMetrics && !metrics) {
      axios.get(`${API}/metrics`).then(({ data }) => setMetrics(data)).catch(() => {})
    }
  }, [showMetrics, metrics])

  const handleSearch = async (title) => {
    const qLower = title.toLowerCase().trim()
    
    // Intercept purely language/region queries
    const cleanQ = qLower.replace(/hindi|bollywood|south|indian|tamil|telugu|tollywood|english|hollywood|movie|movies|film|films/g, '').trim()
    
    if (cleanQ === '') {
      if (['hindi', 'bollywood'].some(w => qLower.includes(w))) {
        setActiveRegion('Bollywood'); setRecommendations([]); setCurrentQuery(''); setError(''); return
      }
      if (['south', 'tamil', 'telugu', 'tollywood'].some(w => qLower.includes(w))) {
        setActiveRegion('South Indian'); setRecommendations([]); setCurrentQuery(''); setError(''); return
      }
      if (['english', 'hollywood'].some(w => qLower.includes(w))) {
        setActiveRegion('Hollywood'); setRecommendations([]); setCurrentQuery(''); setError(''); return
      }
    }

    setLoading(true); setError(''); setCurrentQuery(title)
    try {
      const { data } = await axios.post(`${API}/recommend`, {
        movie_title: title,
        n: 10,
        alpha,
        beta,
        user_id: userId ? parseInt(userId) : null
      })
      setRecommendations(data.recommendations || [])
    } catch (err) {
      const msg = err.response?.data?.detail
      setError(typeof msg === 'object' ? msg.message : (msg || 'Failed to connect. Is the backend running?'))
      setRecommendations([])
    } finally { setLoading(false) }
  }


  return (
    <div className="min-h-screen">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 -left-24 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(139,92,246,0.08)' }} />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(6,182,212,0.06)' }} />
      </div>

      <Navbar />

      {/* API Status */}
      <AnimatePresence>
        {apiStatus === 'error' && (
          <motion.div key="err" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="text-center py-2 px-4 text-sm"
            style={{ background: 'rgba(244,63,94,0.15)', borderBottom: '1px solid rgba(244,63,94,0.3)', color: '#f87171' }}>
            ⚠️ Backend not connected — run: <code className="font-mono">py backend/main.py</code>
          </motion.div>
        )}
        {apiStatus === 'checking' && (
          <motion.div key="load" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="text-center py-2 px-4 text-sm"
            style={{ background: '#161b2e', borderBottom: '1px solid #2d3a5e', color: '#64748b' }}>
            ⟳ Connecting to recommendation engine…
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative max-w-7xl mx-auto px-4 pb-20">

        {/* ── Hero ── */}
        <motion.div className="text-center pt-12 pb-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 border"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
            ✨ AI Discovery Engine · Powered by TF-IDF genre intelligence
          </div>
          <h1 className="text-5xl sm:text-6xl font-black font-display leading-tight mb-4">
            <span className="text-gradient-brand">Smart Movie</span>{' '}
            <span style={{ color: '#f1f5f9' }}>Recommendations</span>
          </h1>
          <p style={{ color: '#94a3b8' }} className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Discover films based on your favorite movies with our AI-powered discovery engine.
          </p>
        </motion.div>

        <motion.div className="space-y-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 w-full">
               <SearchBar onSearch={handleSearch} onMovieSelect={m => handleSearch(m.title)} />
            </div>
            
            <div className="w-full md:w-64">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">👤</div>
                <input 
                  type="number" 
                  placeholder="User ID (1-610)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-[#1e2540] border border-[#2d3a5e] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>
            
            <button 
              onClick={() => setShowMetrics(!showMetrics)}
              className={`px-6 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${showMetrics ? 'bg-indigo-600 shadow-indigo-500/25' : 'bg-slate-800/50 border border-slate-700'}`}
            >
              {showMetrics ? '📊 Hide Metrics' : '📊 Show Metrics'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <HybridSlider alpha={alpha} beta={beta} onChange={(a, b) => { setAlpha(a); setBeta(b) }} />
            </div>
            <AnimatePresence>
              {showMetrics && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                   <MetricsPanel metrics={metrics} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Region Tabs ── */}
        <motion.div className="mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[
              { id: 'All',          label: '🌍 All Movies',       color: '#6366f1' },
              { id: 'Bollywood',    label: '🇮🇳 Bollywood',        color: '#f59e0b' },
              { id: 'South Indian', label: '🎬 South Indian',     color: '#10b981' },
              { id: 'Hollywood',   label: '🌟 Hollywood',        color: '#8b5cf6' },
            ].map(({ id, label, color }) => (
              <button
                key={id}
                id={`tab-${id.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveRegion(id)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: `2px solid ${activeRegion === id ? color : '#2d3a5e'}`,
                  background: activeRegion === id ? `${color}22` : '#1e2540',
                  color: activeRegion === id ? color : '#94a3b8',
                }}
              >{label}</button>
            ))}
          </div>

          {/* Quick-start chips per region */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(activeRegion === 'All' ?
              ['Toy Story', 'The Matrix', 'Inception', '3 Idiots', 'Baahubali', 'RRR', 'Dangal', 'KGF'] :
              activeRegion === 'Bollywood' ?
              ['3 Idiots', 'Dangal', 'PK', 'Lagaan', 'Andhadhun', 'Gangs of Wasseypur', 'Pathaan', 'Animal'] :
              activeRegion === 'South Indian' ?
              ['Baahubali', 'RRR', 'KGF', 'Vikram', 'Pushpa', 'Kantara', 'Leo', 'Kalki 2898 AD'] :
              ['Avengers', 'Inception', 'Interstellar', 'Oppenheimer', 'Dune', 'The Batman', 'Barbie', 'Deadpool']
            ).map(title => (
              <button key={title}
                id={`quick-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                onClick={() => handleSearch(title)}
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: '#161b2e',
                  border: '1px solid #2d3a5e',
                  color: '#94a3b8',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#818cf8' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d3a5e'; e.currentTarget.style.color = '#94a3b8' }}
              >{title}</button>
            ))}
          </div>
        </motion.div>


        {/* ── Loading ── */}
        <AnimatePresence>
          {loading && (
            <motion.div id="loading-indicator" className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="inline-flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-float"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
                  🎬
                </div>
                <p className="font-semibold text-base" style={{ color: '#818cf8' }}>Finding perfect matches…</p>
                <p className="text-sm" style={{ color: '#64748b' }}>Running TF-IDF genre similarity analysis</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && !loading && (
            <motion.div id="error-message" className="max-w-2xl mx-auto mb-8 text-center rounded-2xl p-8"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <p className="text-5xl mb-4">🎭</p>
              <p className="font-semibold mb-2" style={{ color: '#fca5a5' }}>{error}</p>
              <p className="text-sm" style={{ color: '#64748b' }}>Try searching for a movie using the search bar above.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        {!loading && recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold font-display" style={{ color: '#f1f5f9' }}>
                  Top picks for{' '}
                  <span className="text-gradient-brand">"{currentQuery}"</span>
                </h2>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                  AI-powered genre similarity matching (Content-Based Engine)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendations.map((movie, i) => (
                <MovieCard key={`${movie.movieId}-${i}`} movie={movie} rank={i + 1} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Regional Movies ── */}
        {!loading && recommendations.length === 0 && regionMovies.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold font-display" style={{ color: '#f1f5f9' }}>
                Trending in <span className="text-gradient-brand">{activeRegion}</span>
              </h2>
              <p className="text-sm mt-1" style={{ color: '#64748b' }}>Curated list of highly-rated {activeRegion} movies.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {regionMovies.map((movie, i) => (
                <MovieCard key={`${movie.movieId}-${i}`} movie={movie} rank={i + 1} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && recommendations.length === 0 && regionMovies.length === 0 && (
          <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center text-4xl animate-float"
              style={{ background: 'linear-gradient(135deg, #1e2540, #252d4a)', border: '1px solid #2d3a5e', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              🎭
            </div>
            <h2 className="text-xl font-bold font-display mb-2" style={{ color: '#f1f5f9' }}>Search above to get AI recommendations</h2>
            <p className="text-sm mb-2" style={{ color: '#64748b' }}>Bollywood · South Indian · Hollywood — all supported</p>
          </motion.div>
        )}
      </main>

      <footer className="py-8 text-center text-xs" style={{ borderTop: '1px solid #2d3a5e', color: '#64748b' }}>
        <p><span className="text-gradient-brand font-semibold">CineHybrid</span> · Smart Movie Discovery · Bhupendra Sinh Rajgopal Kushwaha · March 2026</p>
        <p className="mt-1 opacity-60">Curated Movies Dataset · TF-IDF Content-Based Engine</p>
      </footer>
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DiscoverPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

