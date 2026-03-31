import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Re-hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cinehybrid_user')
      if (stored) setUser(JSON.parse(stored))
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const login = ({ name, email, avatar }) => {
    const u = { name, email, avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true` }
    setUser(u)
    localStorage.setItem('cinehybrid_user', JSON.stringify(u))
  }

  const loginWithGoogle = () => {
    // Mock Google OAuth — in production replace with real OAuth flow
    login({ name: 'Google User', email: 'user@gmail.com', avatar: null })
  }

  const loginWithGitHub = () => {
    login({ name: 'GitHub User', email: 'user@github.com', avatar: null })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('cinehybrid_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, loginWithGitHub, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
