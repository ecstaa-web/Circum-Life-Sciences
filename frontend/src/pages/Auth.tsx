import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Gamepad2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignup) {
        const { api } = await import('../lib/api')
        await api.register(email, password, name)
      }
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError(t('common.error'))
    }
  }

  const fillDemo = () => {
    setEmail('demo@retropulse.io')
    setPassword('demo123')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rp-cyan to-rp-purple flex items-center justify-center glow-cyan">
            <Gamepad2 className="w-8 h-8 text-rp-bg" />
          </div>
          <h1 className="font-display text-3xl font-bold">
            {isSignup ? t('auth.signupTitle') : t('auth.loginTitle')}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8 space-y-5">
          {isSignup && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('auth.name')}</label>
              <input value={name} onChange={e => setName(e.target.value)} className="rp-input" required />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('auth.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="rp-input" required />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('auth.password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="rp-input" required minLength={6} />
          </div>

          {error && <p className="text-rp-magenta text-sm">{error}</p>}

          <button type="submit" className="btn-primary w-full py-4">
            {isSignup ? t('auth.signupBtn') : t('auth.loginBtn')}
          </button>

          <p className="text-center text-sm text-gray-500">
            <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-rp-cyan hover:underline">
              {isSignup ? t('auth.loginBtn') : t('auth.signupBtn')}
            </button>
          </p>

          <button type="button" onClick={fillDemo} className="w-full text-xs text-gray-600 hover:text-rp-cyan transition-colors">
            {t('auth.demoHint')}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
