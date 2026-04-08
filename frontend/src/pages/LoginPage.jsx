import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

// ── SVG icons ────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)

const EyeIcon = ({ open }) => open
  ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
  : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>

// ── Component ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, loginWithGoogle, loginWithGitHub } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.username.trim()) e.username = 'Username is required'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'At least 6 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    const result = await login(form.username, form.password)
    if (result.success) {
      navigate('/')
    } else {
      setErrors({ form: result.error || "Login failed. Please check your credentials." })
      setSubmitting(false)
    }
  }

  const handleSocial = async (fn) => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 700))
    fn()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-accent-violet/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <span className="text-4xl">🎬</span>
            <span className="text-3xl font-black font-display text-gradient-brand">CineHybrid</span>
          </Link>
          <p className="text-text-secondary text-sm mt-2">Welcome back! Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="card card-glass p-8 space-y-6">
          {/* Social logins */}
          <div className="space-y-3">
            <button
              id="google-login-btn"
              className="btn-social"
              onClick={() => handleSocial(loginWithGoogle)}
              disabled={submitting}
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              id="github-login-btn"
              className="btn-social"
              onClick={() => handleSocial(loginWithGitHub)}
              disabled={submitting}
            >
              <GitHubIcon />
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-text-muted text-xs font-medium">OR CONTINUE WITH EMAIL</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          {/* Username form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username */}
            <div>
              <label htmlFor="login-username" className="block text-text-secondary text-sm font-medium mb-1.5">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                className={`input-field ${errors.username ? 'border-accent-rose focus:border-accent-rose' : ''}`}
                placeholder="Enter your username"
                value={form.username}
                onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setErrors(er => ({ ...er, username: '' })) }}
                autoComplete="username"
              />
              {errors.username && <p className="text-accent-rose text-xs mt-1">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label htmlFor="login-password" className="text-text-secondary text-sm font-medium">Password</label>
                <button type="button" className="text-brand-400 text-xs hover:text-brand-300 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className={`input-field pr-12 ${errors.password ? 'border-accent-rose focus:border-accent-rose' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })) }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  id="toggle-pw-btn"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  onClick={() => setShowPw(v => !v)}
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
              {errors.password && <p className="text-accent-rose text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              className="btn-primary w-full text-base py-3.5"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-400 font-medium hover:text-brand-300 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
