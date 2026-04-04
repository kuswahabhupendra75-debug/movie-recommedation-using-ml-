import { useState } from 'react'
import { motion } from 'framer-motion'

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
  Western:     { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  Documentary: { bg: 'rgba(20,184,166,0.15)',  text: '#5eead4', border: 'rgba(20,184,166,0.3)' },
  Children:    { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  Musical:     { bg: 'rgba(217,70,239,0.15)',  text: '#f0abfc', border: 'rgba(217,70,239,0.3)' },
  default:     { bg: 'rgba(45,58,94,0.5)',     text: '#94a3b8', border: '#2d3a5e' },
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
      <span style={{ color: '#64748b', width: '3.5rem', flexShrink: 0 }}>{label}</span>
      <div className="score-bar-track" style={{ flex: 1 }}>
        <motion.div
          style={{ height: '100%', borderRadius: '999px', background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.round(value * 100))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <span style={{ color: '#64748b', width: '2.5rem', textAlign: 'right' }}>{(value * 100).toFixed(0)}%</span>
    </div>
  )
}

export default function MovieCard({ movie, rank, index }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const genres = (movie.genres || '').split('|')

  return (
    <motion.div
      id={`movie-card-${rank}`}
      className="card"
      style={{ padding: '1.25rem', position: 'relative', cursor: 'default' }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(99,102,241,0.25)' }}
    >
      {/* Rank badge */}
      <div style={{
        position: 'absolute', top: '-12px', left: '-12px',
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(251,191,36,0.4)',
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#0f1117' }}>#{rank}</span>
      </div>


      {/* Title */}
      <h3 style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '0.95rem', lineHeight: 1.4, marginBottom: '0.75rem', paddingRight: '3rem' }}>
        {movie.title}
      </h3>

      {/* Genre tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
        {genres.map(g => {
          const c = GENRE_COLORS[g] || GENRE_COLORS.default
          return (
            <span key={g} style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '0.2rem 0.625rem', borderRadius: '999px',
              fontSize: '0.7rem', fontWeight: '600',
              background: c.bg, color: c.text, border: `1px solid ${c.border}`,
            }}>{g}</span>
          )
        })}
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: '1rem' }}>
        <ScoreBar label="Similarity" value={movie.score} color="linear-gradient(90deg, #6366f1, #818cf8)" />
      </div>

      {/* Explanation tooltip */}
      {movie.explanation && (
        <div style={{ position: 'relative' }}>
          <button
            id={`explain-btn-${rank}`}
            style={{ fontSize: '0.75rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={e => e.target.style.color = '#a5b4fc'}
            onMouseLeave={e => e.target.style.color = '#818cf8'}
            onClick={() => setShowTooltip(v => !v)}
          >
            💡 Why recommended?
          </button>

          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: 'absolute', bottom: '1.75rem', left: 0, right: 0, zIndex: 10,
                background: '#161b2e', border: '1px solid rgba(99,102,241,0.4)',
                borderRadius: '0.75rem', padding: '0.75rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <p style={{ color: '#e2e8f0', fontSize: '0.75rem', lineHeight: 1.6 }}>{movie.explanation}</p>
              <div style={{
                position: 'absolute', bottom: '-6px', left: '1.5rem',
                width: '12px', height: '12px',
                background: '#161b2e', border: '1px solid rgba(99,102,241,0.4)',
                transform: 'rotate(45deg)', borderTop: 'none', borderLeft: 'none',
              }} />
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  )
}
