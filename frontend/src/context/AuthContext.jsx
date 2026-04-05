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

  const API = import.meta.env.VITE_API_URL || "https://movie-recommedation-using-ml.onrender.com"

  const loginUser = async (username, password) => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (data.status === "success") {
      const u = { 
        name: data.username, 
        userId: data.userId, 
        email: data.email || `${data.username}@cinehybrid.com`, 
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=6366f1&color=fff&bold=true` 
      }
      setUser(u)
      localStorage.setItem('cinehybrid_user', JSON.stringify(u))
      return { success: true }
    }
    return { success: false, error: data.error }
  }

  const signupUser = async (username, email, password) => {
    const res = await fetch(`${API}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    })
    const data = await res.json()
    if (data.status === "success") {
      return { success: true }
    }
    return { success: false, error: data.error }
  }

  const loginWithGoogle = () => {
    // Mock Google OAuth — in production replace with real OAuth flow
    const u = { name: 'G-User-101', userId: 101, email: 'user@gmail.com', avatar: null }
    setUser(u)
    localStorage.setItem('cinehybrid_user', JSON.stringify(u))
  }

  const loginWithGitHub = () => {
    const u = { name: 'GH-User-102', userId: 102, email: 'user@github.com', avatar: null }
    setUser(u)
    localStorage.setItem('cinehybrid_user', JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('cinehybrid_user')
  }

  return (
    <AuthContext.Provider value={{ user, login: loginUser, signup: signupUser, loginWithGoogle, loginWithGitHub, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
