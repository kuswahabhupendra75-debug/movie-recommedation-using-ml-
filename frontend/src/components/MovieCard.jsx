import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Genre colour palette ────────────────────────────────────────────────────
const GENRE_COLORS = {
  Action:      { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5', border: 'rgba(239,68,68,0.3)' },
  Adventure:   { bg: 'rgba(249,115,22,0.15)',  text: '#fdba74', border: 'rgba(249,115,22,0.3)' },
  Animation:   { bg: 'rgba(236,72,153,0.15)',  text: '#f9a8d4', border: 'rgba(236,72,153,0.3)' },
  Comedy:      { bg: 'rgba(234,179,8,0.15)',   text: '#fde047', border: 'rgba(234,179,8,0.3)' },
  Crime:       { bg: 'rgba(168,85,247,0.15)',  text: '#d8b4fe', border: 'rgba(168,85,247,0.3)' },
  Drama:       { bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
  Fantasy:     { bg: 'rgba(139,92,246,0.15)',  text: '#c4b5fd', border: 'rgba(139,92,246,0.3)' },
  Horror:      { bg: 'rgba(127,29,29,0.3)',    text: '#fca5a5', border: 'rgba(239,68,68,0.2)' },
  Mystery:     { bg: 'rgba(99,102,241,0.15)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
  Romance:     { bg: 'rgba(244,63,94,0.15)',   text: '#fda4af', border: 'rgba(244,63,94,0.3)' },
  'Sci-Fi':    { bg: 'rgba(6,182,212,0.15)',   text: '#67e8f9', border: 'rgba(6,182,212,0.3)' },
  Thriller:    { bg: 'rgba(100,116,139,0.2)',  text: '#cbd5e1', border: 'rgba(100,116,139,0.3)' },
  War:         { bg: 'rgba(120,53,15,0.2)',    text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  Biography:   { bg: 'rgba(5,150,105,0.15)',   text: '#6ee7b7', border: 'rgba(5,150,105,0.3)' },
  Historical:  { bg: 'rgba(161,98,7,0.2)',     text: '#fde68a', border: 'rgba(202,138,4,0.3)' },
  Mythology:   { bg: 'rgba(124,58,237,0.15)',  text: '#c4b5fd', border: 'rgba(124,58,237,0.3)' },
  Musical:     { bg: 'rgba(217,70,239,0.15)',  text: '#f0abfc', border: 'rgba(217,70,239,0.3)' },
  Documentary: { bg: 'rgba(20,184,166,0.15)',  text: '#5eead4', border: 'rgba(20,184,166,0.3)' },
  Sports:      { bg: 'rgba(37,99,235,0.15)',   text: '#93c5fd', border: 'rgba(37,99,235,0.3)' },
  default:     { bg: 'rgba(45,58,94,0.5)',     text: '#94a3b8', border: '#2d3a5e' },
}

const HIDDEN_GENRE_TAGS = new Set([
  'hindi','south-indian','hollywood','bollywood',
  'tamil','telugu','kannada','malayalam','english'
])

function ratingMeta(r) {
  if (r >= 8.5) return { color: '#F5C518', label: 'Masterpiece' }
  if (r >= 7.5) return { color: '#22c55e', label: 'Great' }
  if (r >= 6.5) return { color: '#6366f1', label: 'Good' }
  if (r >= 5.5) return { color: '#94a3b8', label: 'Average' }
  return            { color: '#f43f5e', label: 'Below avg' }
}

function matchColor(pct) {
  if (pct >= 85) return '#22c55e'
  if (pct >= 70) return '#6366f1'
  if (pct >= 58) return '#f59e0b'
  return '#94a3b8'
}

function fmtVotes(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`
  return String(v)
}

// ── Star Rating Component (IMDB-style) ─────────────────────────────────────
function StarRating({ movieId, movieTitle, existingRating, onRated }) {
  const [hovered, setHovered]     = useState(0)
  const [selected, setSelected]   = useState(existingRating || 0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!existingRating)
  const [open, setOpen]           = useState(false)

  const LABELS = ['', 'Awful', 'Bad', 'Poor', 'Below Avg', 'Average', 'Decent', 'Good', 'Great', 'Excellent', 'Masterpiece']
  const active = hovered || selected

  const submitRating = useCallback(async (stars) => {
    setSubmitting(true)
    try {
      await axios.post(`${API}/rate`, {
        movie_id: String(movieId),
        movie_title: movieTitle,
        rating: stars,
        user_id: localStorage.getItem('cinehybrid_user_id') || 'guest'
      })
      setSelected(stars)
      setSubmitted(true)
      setOpen(false)
      onRated && onRated(stars)
    } catch {
      // Still update UI even if backend fails
      setSelected(stars)
      setSubmitted(true)
      setOpen(false)
    }
    setSubmitting(false)
  }, [movieId, movieTitle, onRated])

  const starColor = (i) => {
    if (i <= (hovered || selected)) return '#F5C518'
    return 'rgba(255,255,255,0.12)'
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Rate button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          background: submitted ? 'rgba(245,197,24,0.12)' : 'rgba(255,255,255,0.06)',
          border: submitted ? '1px solid rgba(245,197,24,0.4)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.5rem', padding: '0.35rem 0.65rem',
          cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700',
          color: submitted ? '#F5C518' : '#94a3b8',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#F5C518'; e.currentTarget.style.color = '#F5C518' }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = submitted ? 'rgba(245,197,24,0.4)' : 'rgba(255,255,255,0.1)'
          e.currentTarget.style.color = submitted ? '#F5C518' : '#94a3b8'
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>⭐</span>
        {submitted ? `${selected}/10` : 'Rate'}
      </button>

      {/* Star dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(145deg, #1a2035, #12172a)',
              border: '1px solid rgba(245,197,24,0.3)',
              borderRadius: '1rem', padding: '1rem 1.1rem',
              zIndex: 9999, minWidth: '220px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,197,24,0.1)',
            }}
          >
            {/* IMDb logo style header */}
            <div style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#F5C518', letterSpacing: '0.1em' }}>IMDb RATING</span>
              <p style={{ color: '#f1f5f9', fontSize: '0.75rem', fontWeight: '600', margin: '2px 0 0' }}>
                {active ? LABELS[active] : 'Tap a star to rate'}
              </p>
            </div>

            {/* Stars row */}
            <div
              style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', marginBottom: '0.7rem' }}
              onMouseLeave={() => setHovered(0)}
            >
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <button
                  key={i}
                  onMouseEnter={() => setHovered(i)}
                  onClick={() => submitRating(i)}
                  disabled={submitting}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '2px', fontSize: '1.35rem',
                    color: starColor(i),
                    transition: 'all 0.1s',
                    transform: hovered >= i ? 'scale(1.2)' : 'scale(1)',
                    filter: hovered >= i ? 'drop-shadow(0 0 6px #F5C518)' : 'none',
                  }}
                  title={`${i}/10 – ${LABELS[i]}`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Score display */}
            {active > 0 && (
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <span style={{
                  fontSize: '1.5rem', fontWeight: '900', color: '#F5C518',
                  fontFamily: 'monospace', lineHeight: 1,
                }}>{active}</span>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>/10</span>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                background: 'none', border: 'none', color: '#475569',
                fontSize: '0.65rem', cursor: 'pointer', padding: '0.2rem',
              }}
            >✕ Close</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main MovieCard ──────────────────────────────────────────────────────────
export default function MovieCard({ movie, rank, index }) {
  const [showWhy, setShowWhy] = useState(false)
  const [userRating, setUserRating] = useState(null)

  const rawGenres  = (movie.genres || '').split('|')
  const genres     = rawGenres.filter(g => !HIDDEN_GENRE_TAGS.has(g.toLowerCase()))
  const imdb       = movie.imdb_rating ?? null
  const votes      = movie.votes      ?? 0
  const matchPct   = movie.match_pct  ?? Math.round((movie.score ?? 0.7) * 100)
  const source     = movie.rating_source || 'estimated'
  const movieId    = movie.movieId || `${rank}-${movie.title?.slice(0,8)}`

  const rm  = imdb ? ratingMeta(imdb) : null
  const mc  = matchColor(matchPct)
  const isTop3 = rank <= 3

  return (
    <motion.div
      id={`movie-card-${rank}`}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.055 }}
      whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(99,102,241,0.28)' }}
      style={{
        background: 'linear-gradient(145deg, #131929 0%, #1a2035 100%)',
        border: `1px solid ${isTop3 ? 'rgba(245,197,24,0.2)' : 'rgba(45,58,94,0.8)'}`,
        borderRadius: '1rem',
        overflow: 'visible',
        position: 'relative',
        cursor: 'default',
      }}
    >
      {/* ── Rank stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '4px', height: '100%',
        background: isTop3
          ? 'linear-gradient(180deg,#F5C518,#f97316)'
          : 'linear-gradient(180deg,#6366f1,#8b5cf6)',
        borderRadius: '1rem 0 0 1rem',
      }} />

      {/* ── Header row */}
      <div style={{ padding: '1rem 1rem 0 1.1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        {/* Rank + Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{
              fontSize: '0.62rem', fontWeight: '900', letterSpacing: '0.05em',
              color: isTop3 ? '#F5C518' : '#6366f1',
              background: isTop3 ? 'rgba(245,197,24,0.12)' : 'rgba(99,102,241,0.12)',
              border: `1px solid ${isTop3 ? 'rgba(245,197,24,0.3)' : 'rgba(99,102,241,0.3)'}`,
              borderRadius: '999px', padding: '0.1rem 0.45rem',
            }}>#{rank}</span>
            {movie.year && (
              <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: '600',
                background: 'rgba(45,58,94,0.4)', borderRadius: '0.3rem', padding: '0.1rem 0.35rem' }}>
                {movie.year}
              </span>
            )}
            {movie.is_personalized && (
              <span style={{ fontSize: '0.55rem', color: '#a78bfa', fontWeight: '700',
                background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: '999px', padding: '0.1rem 0.4rem' }}>✨ For You</span>
            )}
          </div>
          <h3 style={{
            color: '#f1f5f9', fontWeight: '700', fontSize: '0.92rem',
            lineHeight: 1.35, margin: 0,
          }}>{movie.title}</h3>
        </div>

        {/* IMDB Rating block */}
        {imdb && (
          <div style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'rgba(0,0,0,0.3)', borderRadius: '0.6rem',
            padding: '0.4rem 0.55rem', minWidth: '56px',
            border: `1px solid ${rm.color}30`,
          }}>
            <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#F5C518', letterSpacing: '0.04em', marginBottom: '1px' }}>IMDb</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
              <span style={{ color: rm.color, fontWeight: '900', fontSize: '1.15rem', fontFamily: 'monospace', lineHeight: 1 }}>{imdb.toFixed(1)}</span>
              <span style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: '500' }}>/10</span>
            </div>
            <span style={{ color: '#64748b', fontSize: '0.55rem', marginTop: '2px' }}>{fmtVotes(votes)} votes</span>
            {source === 'imdb' && (
              <span style={{ fontSize: '0.45rem', color: '#F5C518', fontWeight: '700', marginTop: '1px', letterSpacing: '0.05em' }}>REAL ✓</span>
            )}
          </div>
        )}
      </div>

      {/* ── Genre tags */}
      <div style={{ padding: '0.6rem 1rem 0 1.1rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {genres.slice(0, 4).map(g => {
          const c = GENRE_COLORS[g] || GENRE_COLORS.default
          return (
            <span key={g} style={{
              padding: '0.15rem 0.55rem', borderRadius: '999px',
              fontSize: '0.67rem', fontWeight: '600',
              background: c.bg, color: c.text, border: `1px solid ${c.border}`,
            }}>{g}</span>
          )
        })}
      </div>

      {/* ── AI Match bar */}
      <div style={{ padding: '0.75rem 1rem 0 1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600' }}>AI Match</span>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: mc, fontFamily: 'monospace' }}>
            {matchPct}%
          </span>
        </div>
        <div style={{ height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', borderRadius: '999px', background: `linear-gradient(90deg, ${mc}, ${mc}cc)` }}
            initial={{ width: 0 }}
            animate={{ width: `${matchPct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 + index * 0.04 }}
          />
        </div>
      </div>

      {/* ── User Rating Row (IMDB-style) */}
      <div style={{
        padding: '0.65rem 1rem 0 1.1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '600' }}>Your Rating</span>
          {userRating && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{
                fontSize: '0.7rem', fontWeight: '800', color: '#F5C518',
                background: 'rgba(245,197,24,0.12)', borderRadius: '999px',
                padding: '0.1rem 0.45rem', border: '1px solid rgba(245,197,24,0.3)',
              }}
            >
              ★ {userRating}/10
            </motion.span>
          )}
        </div>
        <StarRating
          movieId={movieId}
          movieTitle={movie.title}
          existingRating={userRating}
          onRated={setUserRating}
        />
      </div>

      {/* ── Why recommended toggle */}
      <div style={{ padding: '0.5rem 1rem 0.9rem 1.1rem', position: 'relative' }}>
        <button
          id={`explain-btn-${rank}`}
          onClick={() => setShowWhy(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            fontSize: '0.7rem', color: '#818cf8', fontWeight: '600',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
          onMouseLeave={e => e.currentTarget.style.color = '#818cf8'}
        >
          <span style={{ fontSize: '0.75rem' }}>{showWhy ? '▲' : '▼'}</span>
          Why recommended?
        </button>

        <AnimatePresence>
          {showWhy && movie.explanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                marginTop: '0.5rem',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '0.6rem', padding: '0.6rem 0.75rem',
              }}>
                <p style={{ color: '#e2e8f0', fontSize: '0.72rem', lineHeight: 1.65, margin: 0 }}>
                  {movie.explanation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
