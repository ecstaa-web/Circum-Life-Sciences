import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Gamepad2, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

const DEMO_EMAIL = 'demo@retropulse.io'
const DEMO_PASSWORD = 'demo123'

function getAuthErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.message === 'NETWORK_ERROR') return t('auth.networkError')
    if (error.status === 401) return t('auth.invalidCredentials')
    if (error.message === 'Email already registered') return t('auth.emailTaken')
    return error.message
  }
  return t('common.error')
}

export default function Auth() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignup) {
        const { api } = await import('../lib/api')
        await api.register(email, password, name)
      }
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(getAuthErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError('')
    setLoading(true)
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD)
      navigate('/dashboard')
    } catch (err) {
      setError(getAuthErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-rp-primary flex items-center justify-center shadow-lg shadow-indigo-200">
            <Gamepad2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-rp-text tracking-tight">
            {isSignup ? t('auth.signupTitle') : t('auth.loginTitle')}
          </h1>
          <p className="text-rp-muted mt-2 text-sm">{t('auth.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8 space-y-5">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-rp-muted mb-2">{t('auth.name')}</label>
              <input value={name} onChange={e => setName(e.target.value)} className="rp-input" required />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-rp-muted mb-2">{t('auth.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="rp-input" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-rp-muted mb-2">{t('auth.password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="rp-input" required minLength={6} />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignup ? t('auth.signupBtn') : t('auth.loginBtn'))}
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn-secondary w-full py-3.5"
          >
            {t('auth.demoLogin')}
          </button>

          <p className="text-center text-sm text-rp-muted">
            <button type="button" onClick={() => { setIsSignup(!isSignup); setError('') }} className="text-rp-primary font-medium hover:underline">
              {isSignup ? t('auth.loginBtn') : t('auth.signupBtn')}
            </button>
          </p>

          <p className="text-center text-xs text-rp-muted">{t('auth.demoHint')}</p>
        </form>
      </motion.div>
    </div>
  )
}
