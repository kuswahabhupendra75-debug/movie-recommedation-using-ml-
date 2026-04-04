import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50" style={{ background: 'rgba(15,17,23,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #2d3a5e' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="text-3xl">🎬</span>
          <span className="text-xl font-black font-display text-gradient-brand hidden sm:block">CineHybrid</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'text-white bg-surface-card' : ''}`} style={location.pathname === '/' ? { background: '#1e2540', color: '#fff' } : {}}>
            🎬 Discover
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                id="user-menu-btn"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200 hover:border-brand-400"
                style={{ border: '1px solid #2d3a5e', background: '#1e2540' }}
                onClick={() => setMenuOpen(v => !v)}
              >
                <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full" />
                <span className="text-sm font-medium text-white hidden sm:block max-w-[100px] truncate">{user.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    className="absolute right-0 mt-2 w-52 rounded-xl py-1 z-50 border"
                    style={{ background: '#1e2540', border: '1px solid #2d3a5e', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: '#2d3a5e' }}>
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs truncate" style={{ color: '#64748b' }}>{user.email}</p>
                    </div>
                    <button
                      id="logout-btn"
                      className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface-border flex items-center gap-2"
                      style={{ color: '#f43f5e' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#2d3a5e'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={handleLogout}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign in</Link>
              <Link to="/signup" className="btn-primary text-sm py-2 px-4">Sign up free</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
