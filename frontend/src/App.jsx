import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import SearchBar from './components/SearchBar'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import HybridSlider from './components/HybridSlider'
import MetricsPanel from './components/MetricsPanel'
import MovieCard from './components/MovieCard'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── 2026 Trending Now data (hardcoded for instant display) ─────────────────
const TRENDING_2026 = [
  { title: 'KGF Chapter 3 (2025)', genres: 'Action|Crime|Drama', year: '2025', imdb_rating: 9.2, votes: 125000, score: 0.92, explanation: '🔥 Biggest release of 2025', movieId: '6000041' },
  { title: 'Saiyaara (2025)', genres: 'Romance|Drama|Musical', year: '2025', imdb_rating: 8.8, votes: 98000, score: 0.88, explanation: '🎵 Most romantic film of 2025', movieId: '5000031' },
  { title: 'Pushpa 2: The Rule (2024)', genres: 'Action|Crime|Drama', year: '2024', imdb_rating: 8.9, votes: 210000, score: 0.89, explanation: '🌿 Record-breaking blockbuster', movieId: '6000001' },
  { title: 'Chhava (2025)', genres: 'Historical|Action|Drama', year: '2025', imdb_rating: 8.5, votes: 87000, score: 0.85, explanation: '⚔️ Epic historical drama', movieId: '5000036' },
  { title: 'Amaran (2024)', genres: 'War|Action|Biography|Drama', year: '2024', imdb_rating: 8.6, votes: 145000, score: 0.86, explanation: '🎖️ Emotional war biography', movieId: '6000011' },
  { title: 'L2 Empuraan (2025)', genres: 'Action|Drama|Thriller|Crime', year: '2025', imdb_rating: 8.6, votes: 113000, score: 0.86, explanation: '🔥 Massive Malayalam blockbuster', movieId: '6000048' },
  { title: 'Don 3 (2026)', genres: 'Crime|Action|Thriller', year: '2026', imdb_rating: 8.0, votes: 45000, score: 0.80, explanation: '🎯 Most anticipated 2026 film', movieId: '5000061' },
  { title: 'Kalki 2898 AD (2024)', genres: 'Sci-Fi|Action|Mythology|Fantasy', year: '2024', imdb_rating: 8.1, votes: 178000, score: 0.81, explanation: '🤖 Sci-Fi mythology epic', movieId: '6000002' },
  { title: 'Baahubali 3 (2026)', genres: 'Epic|Action|Historical|Fantasy', year: '2026', imdb_rating: 9.5, votes: 320000, score: 0.95, explanation: '👑 Most awaited sequel ever', movieId: '6000071' },
  { title: 'RRR 2 (2026)', genres: 'Action|Historical|Drama|Adventure', year: '2026', imdb_rating: 9.2, votes: 290000, score: 0.92, explanation: '🔥 S.S. Rajamouli masterpiece sequel', movieId: '6000072' },
  { title: 'Chhava (2025)', genres: 'Historical|Action|Drama', year: '2025', imdb_rating: 8.5, votes: 87000, score: 0.85, explanation: '⚔️ Vicky Kaushal as Sambhaji', movieId: '5000036b' },
  { title: 'Ground Zero (2025)', genres: 'Action|War|Thriller', year: '2025', imdb_rating: 7.9, votes: 56000, score: 0.79, explanation: '💥 Intense war thriller', movieId: '5000037' },
]

// ── Trending pill chip ──────────────────────────────────────────────────────
function TrendingChip({ movie, onClick }) {
  const isNew2026 = movie.year === '2026'
  const isHot = movie.imdb_rating >= 8.5
  return (
    <motion.button
      onClick={() => onClick(movie.title)}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.45rem 0.9rem', borderRadius: '999px', cursor: 'pointer',
        background: isNew2026 ? 'rgba(251,191,36,0.12)' : isHot ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
        border: isNew2026 ? '1px solid rgba(251,191,36,0.4)' : isHot ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(99,102,241,0.25)',
        color: isNew2026 ? '#fbbf24' : isHot ? '#fca5a5' : '#a5b4fc',
        fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s',
      }}
    >
      {isNew2026 ? '🆕' : isHot ? '🔥' : '⭐'}
      {movie.title.replace(/\s*\(\d{4}\)\s*$/, '')}
      <span style={{ opacity: 0.7, fontSize: '0.65rem', fontWeight: '700',
        background: isNew2026 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.08)',
        borderRadius: '999px', padding: '1px 5px' }}>{movie.year}</span>
    </motion.button>
  )
}

// ── Mini MovieCard for trending row ────────────────────────────────────────
function TrendingCard({ movie, index, onSearch }) {
  const rating = movie.imdb_rating
  const rColor = rating >= 8.5 ? '#f59e0b' : rating >= 7.5 ? '#22c55e' : '#6366f1'
  const isNew = movie.year >= '2025'

  return (
    <motion.div
      onClick={() => onSearch(movie.title)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6, scale: 1.02, boxShadow: '0 16px 40px rgba(99,102,241,0.3)' }}
      style={{
        background: 'linear-gradient(135deg, #1a2035 0%, #1e2540 100%)',
        border: `1px solid ${isNew ? 'rgba(251,191,36,0.25)' : 'rgba(45,58,94,0.8)'}`,
        borderRadius: '1rem', padding: '1rem', cursor: 'pointer',
        minWidth: '180px', flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}
    >
      {isNew && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: movie.year === '2026' ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : 'linear-gradient(135deg,#ef4444,#f97316)',
          color: '#0f1117', fontSize: '0.55rem', fontWeight: '900',
          padding: '0.2rem 0.6rem', borderBottomLeftRadius: '0.5rem',
        }}>{movie.year === '2026' ? '🆕 2026' : '🔥 2025'}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
        <span style={{ color: rColor, fontSize: '0.75rem' }}>⭐</span>
        <span style={{ color: rColor, fontWeight: '800', fontSize: '0.85rem', fontFamily: 'monospace' }}>{rating.toFixed(1)}</span>
      </div>
      <p style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '0.82rem', lineHeight: 1.3, marginBottom: '0.4rem' }}>
        {movie.title.replace(/\s*\(\d{4}\)\s*$/, '')}
      </p>
      <p style={{ color: '#64748b', fontSize: '0.65rem', lineHeight: 1.4 }}>
        {movie.genres.replace(/\|/g, ' · ').split(' · ').slice(0, 2).join(' · ')}
      </p>
      <p style={{ color: '#475569', fontSize: '0.6rem', marginTop: '0.4rem' }}>{movie.explanation}</p>
    </motion.div>
  )
}

// ── Main discover page ─────────────────────────────────────────────────────
function DiscoverPage() {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentQuery, setCurrentQuery] = useState('')
  const [apiStatus, setApiStatus] = useState('checking')
  const [activeRegion, setActiveRegion] = useState('All')
  const [regionMovies, setRegionMovies] = useState([])
  const [alpha, setAlpha] = useState(0.5)
  const [beta, setBeta] = useState(0.5)
  const [showMetrics, setShowMetrics] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const scrollRef = useRef(null)

  const activeUserId = user?.userId || null

  // Region fetch
  useEffect(() => {
    let cleared = false
    const fetchRegion = async () => {
      if (activeRegion === 'All') { if (!cleared) setRegionMovies([]); return }
      setLoading(true); setError(''); setRecommendations([]); setCurrentQuery('')
      try {
        const { data } = await axios.get(`${API}/region/${activeRegion}`)
        if (!cleared) setRegionMovies(data.movies || [])
      } catch { if (!cleared) setRegionMovies([]) }
      finally { if (!cleared) setLoading(false) }
    }
    fetchRegion()
    return () => { cleared = true }
  }, [activeRegion])

  // API health check
  useEffect(() => {
    let cleared = false
    const check = async () => {
      try {
        await axios.get(`${API}/health`, { timeout: 5000 })
        if (!cleared) setApiStatus('ok')
      } catch { if (!cleared) setApiStatus('error') }
    }
    check()
    const iv = setInterval(check, 10000)
    return () => { cleared = true; clearInterval(iv) }
  }, [])

  // Metrics fetch
  useEffect(() => {
    if (showMetrics && !metrics) {
      axios.get(`${API}/metrics`).then(({ data }) => setMetrics(data)).catch(() => {})
    }
  }, [showMetrics, metrics])

  const handleSearch = async (title) => {
    const qLower = title.toLowerCase().trim()
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

    setLoading(true); setError(''); setCurrentQuery(title); setActiveRegion('All')
    try {
      const { data } = await axios.post(`${API}/recommend`, {
        movie_title: title, n: 12, alpha, beta, user_id: activeUserId
      })
      setRecommendations(data.recommendations || [])
      // Scroll to results
      setTimeout(() => window.scrollTo({ top: 400, behavior: 'smooth' }), 100)
    } catch (err) {
      const errData = err.response?.data
      const msg = errData?.error || errData?.detail
      const msgStr = typeof msg === 'object' ? JSON.stringify(msg) : (msg || 'Backend not connected. Please start the server.')
      setError(msgStr)
      setRecommendations([])
    } finally { setLoading(false) }
  }

  // Filter trending: 2026 first, then 2025, sorted by rating
  const trending2026 = TRENDING_2026.filter(m => m.year === '2026').sort((a, b) => b.imdb_rating - a.imdb_rating)
  const trending2025 = TRENDING_2026.filter(m => m.year === '2025').sort((a, b) => b.imdb_rating - a.imdb_rating)
  const trendingOthers = TRENDING_2026.filter(m => m.year < '2025').sort((a, b) => b.imdb_rating - a.imdb_rating)

  return (
    <div className="min-h-screen">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 -left-24 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(139,92,246,0.08)' }} />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(6,182,212,0.06)' }} />
      </div>

      <Navbar />

      {/* API Status banner */}
      <AnimatePresence>
        {apiStatus === 'error' && (
          <motion.div key="err" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="text-center py-2 px-4 text-sm"
            style={{ background: 'rgba(244,63,94,0.15)', borderBottom: '1px solid rgba(244,63,94,0.3)', color: '#f87171' }}>
            ⚠️ Backend not connected — double-click <strong>start.bat</strong> to launch servers
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative max-w-7xl mx-auto px-4 pb-20">

        {/* ── Hero ── */}
        <motion.div className="text-center pt-10 pb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-5 border"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
            ✨ AI Discovery Engine · 10,000+ Movies · Bollywood · South Indian · Hollywood
          </div>
          <h1 className="text-5xl sm:text-6xl font-black font-display leading-tight mb-3">
            <span className="text-gradient-brand">Smart Movie</span>{' '}
            <span style={{ color: '#f1f5f9' }}>Recommendations</span>
          </h1>
          <p style={{ color: '#94a3b8' }} className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Discover films based on your taste — Bollywood, South Indian, Hollywood. Now with 2026 latest releases!
          </p>
        </motion.div>

        {/* ── Search + Controls ── */}
        <motion.div className="space-y-5 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} onMovieSelect={m => handleSearch(m.title)} />
            </div>
            {/* User status badge */}
            <div className="flex items-center gap-2 text-sm flex-shrink-0"
              style={{ background: '#1e2540', border: user ? '1px solid rgba(99,102,241,0.4)' : '1px solid #2d3a5e', borderRadius: '1rem', padding: '0.75rem 1rem' }}>
              {user ? (
                <>
                  <span>👤</span>
                  <div>
                    <p style={{ color: '#a5b4fc', fontWeight: '700', fontSize: '0.8rem' }}>{user.name}</p>
                    <p style={{ color: '#6366f1', fontSize: '0.62rem' }}>✨ Personalized Mode ON</p>
                  </div>
                </>
              ) : (
                <>
                  <span>👻</span>
                  <div>
                    <p style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.8rem' }}>Guest Mode</p>
                    <p style={{ color: '#64748b', fontSize: '0.62rem' }}>Login for personal picks</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setShowMetrics(v => !v)}
              className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 ${showMetrics ? 'bg-indigo-600' : 'bg-slate-800/50 border border-slate-700'}`}
            >
              📊 {showMetrics ? 'Hide' : 'Stats'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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

        {/* ── 🆕 NEW 2026 RELEASES ── */}
        {!loading && recommendations.length === 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-10">
            {/* 2026 Section */}
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  borderRadius: '0.625rem', padding: '0.4rem 0.75rem',
                  fontSize: '0.75rem', fontWeight: '800', color: '#0f1117'
                }}>🆕 NEW 2026</div>
                <h2 className="text-xl font-bold font-display" style={{ color: '#f1f5f9' }}>
                  Most Awaited <span style={{ color: '#fbbf24' }}>2026 Releases</span>
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                {trending2026.map((movie, i) => (
                  <TrendingCard key={movie.movieId} movie={movie} index={i} onSearch={handleSearch} />
                ))}
              </div>
            </div>

            {/* 2025 Section */}
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444, #f97316)',
                  borderRadius: '0.625rem', padding: '0.4rem 0.75rem',
                  fontSize: '0.75rem', fontWeight: '800', color: '#fff'
                }}>🔥 HOT 2025</div>
                <h2 className="text-xl font-bold font-display" style={{ color: '#f1f5f9' }}>
                  Blockbusters of <span style={{ color: '#f97316' }}>2025</span>
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                {trending2025.map((movie, i) => (
                  <TrendingCard key={movie.movieId} movie={movie} index={i} onSearch={handleSearch} />
                ))}
              </div>
            </div>

            {/* 2024 Section */}
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  borderRadius: '0.625rem', padding: '0.4rem 0.75rem',
                  fontSize: '0.75rem', fontWeight: '800', color: '#fff'
                }}>⭐ 2024 HITS</div>
                <h2 className="text-xl font-bold font-display" style={{ color: '#f1f5f9' }}>
                  Best of <span className="text-gradient-brand">2024</span>
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                {trendingOthers.map((movie, i) => (
                  <TrendingCard key={movie.movieId} movie={movie} index={i} onSearch={handleSearch} />
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* ── Region Tabs ── */}
        <motion.div className="mb-7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
            {[
              { id: 'All',          label: '🌍 All',          color: '#6366f1' },
              { id: 'Bollywood',    label: '🇮🇳 Bollywood',    color: '#f59e0b' },
              { id: 'South Indian', label: '🎬 South Indian',  color: '#10b981' },
              { id: 'Hollywood',    label: '🌟 Hollywood',     color: '#8b5cf6' },
            ].map(({ id, label, color }) => (
              <button
                key={id}
                id={`tab-${id.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveRegion(id)}
                style={{
                  padding: '0.45rem 1.1rem', borderRadius: '999px', fontSize: '0.83rem',
                  fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                  border: `2px solid ${activeRegion === id ? color : '#2d3a5e'}`,
                  background: activeRegion === id ? `${color}22` : '#1e2540',
                  color: activeRegion === id ? color : '#94a3b8',
                }}
              >{label}</button>
            ))}
          </div>

          {/* Quick-search chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {(activeRegion === 'All'
              ? ['Stree 2', 'Pushpa 2', 'KGF Chapter 3', 'Saiyaara', 'Baahubali 3', 'RRR 2', 'Chhava', 'Amaran']
              : activeRegion === 'Bollywood'
              ? ['Saiyaara', 'Chhava', 'Stree 2', 'War 2', 'Sikandar', 'Don 3', 'Dangal', 'Pathaan']
              : activeRegion === 'South Indian'
              ? ['Pushpa 2', 'KGF Chapter 3', 'Baahubali 3', 'RRR 2', 'Amaran', 'L2 Empuraan', 'Kalki 2898 AD', 'Kantara']
              : ['Avengers', 'Inception', 'Interstellar', 'Oppenheimer', 'Dune 2', 'The Batman', 'Deadpool', 'Avatar']
            ).map(title => (
              <button key={title}
                id={`quick-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                onClick={() => handleSearch(title)}
                style={{
                  padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem',
                  fontWeight: '500', cursor: 'pointer', background: '#161b2e',
                  border: '1px solid #2d3a5e', color: '#94a3b8', transition: 'all 0.2s',
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
                <p className="text-sm" style={{ color: '#64748b' }}>Analyzing genre similarity + ratings</p>
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
              <p className="text-sm" style={{ color: '#64748b' }}>Try one of the quick-search chips above, or type the full movie name.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Recommendations ── */}
        {!loading && recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold font-display" style={{ color: '#f1f5f9' }}>
                  Top picks for{' '}
                  <span className="text-gradient-brand">"{currentQuery}"</span>
                </h2>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                  AI Hybrid Engine: genre similarity + community ratings
                  {activeUserId ? ' · ✨ Personalized for you' : ''}
                </p>
              </div>
              <button onClick={() => { setRecommendations([]); setCurrentQuery('') }}
                style={{ fontSize: '0.8rem', color: '#64748b', background: '#1e2540', border: '1px solid #2d3a5e', borderRadius: '0.75rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                ✕ Clear
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {recommendations.map((movie, i) => (
                <MovieCard key={`${movie.movieId}-${i}`} movie={movie} rank={i + 1} index={i} />
              ))}
            </div>

            {/* "Also search for" older classic suggestions */}
            <div className="mt-8 p-5 rounded-2xl" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#818cf8' }}>📽️ Also explore classic movies:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {['3 Idiots', 'Dangal', 'Sholay', 'Dilwale Dulhania Le Jayenge', 'Kabhi Khushi Kabhie Gham', 'Baahubali', 'RRR', 'Vikram', 'Inception', 'The Dark Knight', 'Interstellar'].map(t => (
                  <button key={t} onClick={() => handleSearch(t)}
                    style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '500', cursor: 'pointer', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                  >{t}</button>
                ))}
              </div>
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
              <p className="text-sm mt-1" style={{ color: '#64748b' }}>Top-rated {activeRegion} movies from our catalog</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {regionMovies.map((movie, i) => (
                <MovieCard key={`${movie.movieId}-${i}`} movie={movie} rank={i + 1} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <footer className="py-8 text-center text-xs" style={{ borderTop: '1px solid #2d3a5e', color: '#64748b' }}>
        <p><span className="text-gradient-brand font-semibold">CineHybrid</span> · Smart Movie Discovery · Bhupendra Sinh Rajgopal Kushwaha · 2026</p>
        <p className="mt-1 opacity-60">10,000+ Movies · Bollywood · South Indian · Hollywood · TF-IDF Hybrid Engine</p>
      </footer>
    </div>
  )
}

// ── Root App ───────────────────────────────────────────────────────────────
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
