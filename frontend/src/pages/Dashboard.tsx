import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Bell, Heart, Plus, Trash2, Package } from 'lucide-react'
import ListingCard from '../components/ListingCard'
import { api, type Alert, type Listing } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAuth()
  const [watchlist, setWatchlist] = useState<Listing[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [tab, setTab] = useState<'watchlist' | 'alerts'>('watchlist')
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [alertConsole, setAlertConsole] = useState('')
  const [alertPrice, setAlertPrice] = useState('')
  const [alertType, setAlertType] = useState('sell')

  useEffect(() => {
    if (isAuthenticated) {
      api.getWatchlist().then(setWatchlist).catch(() => {})
      api.getAlerts().then(setAlerts).catch(() => {})
    }
  }, [isAuthenticated])

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    const alert = await api.createAlert({
      console: alertConsole,
      max_price: Number(alertPrice),
      listing_type: alertType,
    })
    setAlerts(prev => [...prev, alert])
    setShowAlertForm(false)
    setAlertConsole('')
    setAlertPrice('')
  }

  const handleDeleteAlert = async (id: number) => {
    await api.deleteAlert(id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Package className="w-16 h-16 text-gray-600 mx-auto mb-6" />
        <h2 className="font-display text-2xl font-bold mb-4">{t('dashboard.title')}</h2>
        <p className="text-gray-500 mb-8">{t('auth.demoHint')}</p>
        <Link to="/auth" className="btn-primary">{t('nav.login')}</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl font-bold mb-2">{t('dashboard.title')}</h1>
        <p className="text-gray-500 mb-10">{t('dashboard.welcome', { name: user?.name })}</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab('watchlist')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'watchlist' ? 'bg-rp-cyan/10 text-rp-cyan border border-rp-cyan/20' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" /> {t('dashboard.watchlist')} ({watchlist.length})
        </button>
        <button
          onClick={() => setTab('alerts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'alerts' ? 'bg-rp-cyan/10 text-rp-cyan border border-rp-cyan/20' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" /> {t('dashboard.alerts')} ({alerts.length})
        </button>
        <Link to="/create" className="ml-auto btn-primary text-sm !px-4 !py-2.5">
          <Plus className="w-4 h-4" /> {t('dashboard.createListing')}
        </Link>
      </div>

      {tab === 'watchlist' && (
        watchlist.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">{t('dashboard.noWatchlist')}</p>
            <Link to="/browse" className="btn-secondary mt-6 inline-flex">{t('nav.browse')}</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
          </div>
        )
      )}

      {tab === 'alerts' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowAlertForm(!showAlertForm)} className="btn-secondary text-sm !px-4 !py-2">
              <Plus className="w-4 h-4" /> {t('dashboard.createAlert')}
            </button>
          </div>

          {showAlertForm && (
            <form onSubmit={handleCreateAlert} className="glass-strong rounded-2xl p-6 mb-6 grid sm:grid-cols-4 gap-4">
              <input
                value={alertConsole}
                onChange={e => setAlertConsole(e.target.value)}
                placeholder={t('dashboard.console')}
                className="rp-input"
                required
              />
              <input
                type="number"
                value={alertPrice}
                onChange={e => setAlertPrice(e.target.value)}
                placeholder={t('dashboard.maxPrice')}
                className="rp-input"
                required
              />
              <select value={alertType} onChange={e => setAlertType(e.target.value)} className="rp-select">
                <option value="sell">{t('browse.sell')}</option>
                <option value="buy">{t('browse.buy')}</option>
              </select>
              <button type="submit" className="btn-primary">{t('common.save')}</button>
            </form>
          )}

          {alerts.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">{t('dashboard.noAlerts')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className="glass rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-lg bg-rp-cyan/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-rp-cyan" />
                    </div>
                    <div>
                      <p className="font-medium">{alert.console}</p>
                      <p className="text-sm text-gray-500">
                        Max {alert.max_price}€ • {alert.listing_type === 'sell' ? t('browse.sell') : t('browse.buy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-rp-green">{t('dashboard.active')}</span>
                    <button onClick={() => handleDeleteAlert(alert.id)} className="p-2 text-gray-500 hover:text-rp-magenta transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
