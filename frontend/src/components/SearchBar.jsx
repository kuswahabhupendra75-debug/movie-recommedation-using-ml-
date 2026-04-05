import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || "https://movie-recommedation-using-ml.onrender.com"

export default function SearchBar({ onSearch, onMovieSelect }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleInput = (val) => {
    setQuery(val)
    if (!val.trim()) { setSuggestions([]); setOpen(false); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await axios.get(`${API}/search/${val}`)
        setSuggestions(data || [])
        setOpen(true)
      } catch { setSuggestions([]) }
      finally { setLoading(false) }
    }, 200)
  }

  const handleSelect = (movie) => {
    setQuery(movie.title); setSuggestions([]); setOpen(false); onMovieSelect(movie)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) { setOpen(false); onSearch(query.trim()) }
  }

  const regionColor = { Bollywood: '#f59e0b', 'South Indian': '#10b981', Hollywood: '#8b5cf6' }

  return (
    <div
      ref={wrapperRef}
      id="search-container"
      style={{ position: 'relative', width: '100%' }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
        {/* Input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', pointerEvents: 'none' }}>🎬</span>
          <input
            id="movie-search-input"
            type="text"
            className="input-field"
            style={{ paddingLeft: '3rem', paddingRight: loading ? '3rem' : '1rem', fontSize: '1rem', height: '52px' }}
            placeholder="Search Bollywood, South Indian, Hollywood… e.g. 3 Idiots, RRR, Inception"
            value={query}
            onChange={e => handleInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            autoComplete="off"
          />
          {loading && (
            <span style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              color: '#818cf8', fontSize: '1.2rem', animation: 'spin 0.8s linear infinite',
            }}>⟳</span>
          )}
        </div>

        {/* Submit button */}
        <button
          id="search-submit-btn"
          type="submit"
          className="btn-primary"
          style={{ whiteSpace: 'nowrap', fontSize: '0.9rem', padding: '0 1.5rem', height: '52px', flexShrink: 0 }}
        >
          🔍 Recommend
        </button>
      </form>

      {/* Autocomplete dropdown */}
      {open && suggestions.length > 0 && (
        <div
          id="autocomplete-dropdown"
          style={{
            position: 'absolute', top: '100%', marginTop: '0.5rem',
            width: '100%', zIndex: 100,
            background: '#1e2540',
            border: '1px solid #2d3a5e',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {suggestions.map((movie, i) => {
            const rc = regionColor[movie.region] || '#6366f1'
            return (
              <button
                key={movie.movieId}
                id={`suggestion-${i}`}
                type="button"
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '0.875rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: i < suggestions.length - 1 ? '1px solid #2d3a5e' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#252d4a'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                onClick={() => handleSelect(movie)}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🎥</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {movie.title}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {movie.genres.replace(/\|/g, ' · ')}
                  </p>
                </div>
                {movie.region && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: '700',
                    padding: '0.2rem 0.6rem', borderRadius: '999px', flexShrink: 0,
                    background: `${rc}22`, color: rc, border: `1px solid ${rc}44`,
                  }}>{movie.region}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
