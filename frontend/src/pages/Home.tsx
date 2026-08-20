import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Bell, Filter, TrendingUp, Users, ShoppingBag,
  ArrowRight, Radio, Search, Sparkles
} from 'lucide-react'
import ListingCard from '../components/ListingCard'
import { api, type Listing, type Stats } from '../lib/api'

const featureIcons = [Radio, Bell, Filter, ShoppingBag, TrendingUp, Users]

export default function Home() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats | null>(null)
  const [featured, setFeatured] = useState<Listing[]>([])

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {})
    api.getListings({ featured: true, limit: 6 }).then(setFeatured).catch(() => {})
  }, [])

  const statItems = stats ? [
    { label: t('hero.stats.listings'), value: stats.total_listings },
    { label: t('hero.stats.consoles'), value: stats.total_consoles },
    { label: t('hero.stats.collectors'), value: stats.collectors_items },
    { label: t('hero.stats.avgPrice'), value: `${stats.avg_price}€` },
  ] : []

  return (
    <div>
      <section className="relative min-h-[88vh] flex items-center">
        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-14 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-rp-border shadow-sm mb-8">
              <Sparkles className="w-4 h-4 text-rp-accent" />
              <span className="text-xs font-semibold text-rp-primary">{t('hero.badge')}</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1.08] mb-6 tracking-tight text-rp-text">
              {t('hero.title1')}
              <br />
              <span className="gradient-text">{t('hero.title2')}</span>
            </h1>

            <p className="text-lg text-rp-muted leading-relaxed mb-10 max-w-lg">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/browse" className="btn-primary text-base">
                <Search className="w-5 h-5" /> {t('hero.cta1')}
              </Link>
              <Link to="/dashboard" className="btn-secondary text-base">
                <Bell className="w-5 h-5" /> {t('hero.cta2')}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative hidden lg:block"
          >
            <div className="glass-strong rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-rp-text">Live feed</h3>
                <span className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </div>
              <div className="space-y-3">
                {featured.slice(0, 3).map(l => (
                  <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 transition-colors border border-transparent hover:border-indigo-100">
                    <img src={l.image_url} alt="" className="w-14 h-14 rounded-xl object-cover bg-white" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-rp-text truncate">{l.console}</p>
                      <p className="text-xs text-rp-muted truncate">{l.title}</p>
                    </div>
                    <span className="font-display font-bold text-rp-primary">{l.price}€</span>
                  </div>
                ))}
              </div>
              {stats?.sources_active && stats.sources_active.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-rp-border">
                  {stats.sources_active.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-full bg-rp-primary-soft text-rp-primary text-[11px] font-medium">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-0 left-0 right-0"
          >
            <div className="max-w-5xl mx-auto px-6 pb-8">
              <div className="glass-strong rounded-2xl grid grid-cols-2 md:grid-cols-4 divide-x divide-rp-border">
                {statItems.map((s, i) => (
                  <div key={i} className="p-6 text-center">
                    <p className="font-display text-2xl md:text-3xl font-bold text-rp-text">{s.value}</p>
                    <p className="text-xs text-rp-muted mt-1 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-rp-text tracking-tight">
            {t('features.title')}
          </h2>
          <p className="text-rp-muted max-w-2xl mx-auto">{t('features.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n, i) => {
            const Icon = featureIcons[i]
            return (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-8 hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-rp-primary-soft flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-rp-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-rp-text">{t(`features.f${n}.title`)}</h3>
                <p className="text-sm text-rp-muted leading-relaxed">{t(`features.f${n}.desc`)}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="py-28 bg-white/50 border-y border-rp-border">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-14 text-rp-text tracking-tight">
            {t('howItWorks.title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[1, 2, 3].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-rp-primary text-white flex items-center justify-center font-display text-xl font-bold shadow-lg shadow-indigo-200">
                  {step}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-rp-text">{t(`howItWorks.step${step}.title`)}</h3>
                <p className="text-rp-muted text-sm leading-relaxed">{t(`howItWorks.step${step}.desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-28">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2 text-rp-text tracking-tight">{t('featured.title')}</h2>
            <p className="text-rp-muted">{t('featured.subtitle')}</p>
          </div>
          <Link to="/browse" className="hidden md:flex items-center gap-2 text-rp-primary hover:gap-3 transition-all text-sm font-semibold">
            {t('featured.viewAll')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((l, i) => (
            <ListingCard key={l.id} listing={l} index={i} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-28">
        <div className="glass-strong rounded-3xl p-12 md:p-16 text-center bg-gradient-to-br from-indigo-50 via-white to-amber-50">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-rp-text tracking-tight">
            {t('hero.title1')} <span className="gradient-text">{t('hero.title2')}</span>
          </h2>
          <p className="text-rp-muted mb-8 max-w-lg mx-auto">{t('hero.subtitle')}</p>
          <Link to="/auth" className="btn-primary text-lg">{t('nav.signup')}</Link>
        </div>
      </section>
    </div>
  )
}
