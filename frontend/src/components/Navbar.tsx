import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { setLanguage, getLanguage } from '../i18n'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Navbar() {
  const { t } = useTranslation()
  const { isAuthenticated, user, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const lang = getLanguage()

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/browse', label: t('nav.browse') },
    { to: '/pricing', label: t('nav.pricing') },
    ...(isAuthenticated ? [{ to: '/dashboard', label: t('nav.dashboard') }] : []),
  ]

  const toggleLang = () => setLanguage(lang === 'fr' ? 'en' : 'fr')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="max-w-7xl mx-auto glass-strong rounded-2xl px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <Logo size={40} />
          <div className="hidden sm:block">
            <span className="font-display font-bold text-lg text-rp-text tracking-tight block">RetroPulse</span>
            <span className="text-[10px] text-rp-muted tracking-wide">Console marketplace</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                location.pathname === link.to
                  ? 'bg-rp-primary-soft text-rp-primary'
                  : 'text-rp-muted hover:text-rp-text hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-rp-border text-rp-muted hover:border-indigo-200 hover:text-rp-primary transition-all"
          >
            {lang === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
          </button>

          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-rp-muted">{user?.name}</span>
              <button onClick={logout} className="text-sm text-rp-muted hover:text-red-600 transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/auth" className="btn-secondary text-sm !px-4 !py-2">{t('nav.login')}</Link>
              <Link to="/create" className="btn-primary text-sm !px-4 !py-2">{t('nav.sell')}</Link>
            </div>
          )}

          <button className="md:hidden p-2 text-rp-text" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-2 mx-4 glass-strong rounded-2xl p-4"
          >
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-rp-text hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link to="/auth" onClick={() => setMobileOpen(false)} className="block mt-2 btn-primary text-center text-sm">
                {t('nav.login')}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
