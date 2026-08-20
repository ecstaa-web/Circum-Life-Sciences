import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Bell, Filter, TrendingUp, Users, Zap, ShoppingBag,
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
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rp-cyan/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rp-magenta/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rp-purple/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-rp-cyan/20 mb-8">
              <Sparkles className="w-4 h-4 text-rp-amber" />
              <span className="text-xs font-medium tracking-wider text-rp-cyan">{t('hero.badge')}</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-black leading-[1.1] mb-6">
              <span className="text-white">{t('hero.title1')}</span>
              <br />
              <span className="gradient-text text-glow-cyan">{t('hero.title2')}</span>
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed mb-10 max-w-lg">
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
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative glass-strong rounded-3xl p-8 glow-cyan">
              <div className="absolute -top-3 -right-3 w-20 h-20 bg-gradient-to-br from-rp-cyan to-rp-magenta rounded-2xl flex items-center justify-center font-pixel text-[8px] text-rp-bg text-center leading-tight">
                RETRO<br/>PULSE
              </div>
              <div className="space-y-4">
                {featured.slice(0, 3).map(l => (
                  <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <img src={l.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{l.console}</p>
                      <p className="text-xs text-gray-500 truncate">{l.title}</p>
                    </div>
                    <span className="font-display font-bold text-rp-cyan">{l.price}€</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-rp-green animate-pulse" />
                Live market feed
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-0 left-0 right-0"
          >
            <div className="max-w-5xl mx-auto px-6 pb-8">
              <div className="glass-strong rounded-2xl grid grid-cols-2 md:grid-cols-4 divide-x divide-rp-border">
                {statItems.map((s, i) => (
                  <div key={i} className="p-6 text-center">
                    <p className="font-display text-2xl md:text-3xl font-bold gradient-text">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="font-display text-3xl md:text-5xl font-bold mb-4"
          >
            {t('features.title')}
          </motion.h2>
          <p className="text-gray-400 max-w-2xl mx-auto">{t('features.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n, i) => {
            const Icon = featureIcons[i]
            return (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-8 hover:border-rp-cyan/20 border border-transparent transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rp-cyan/20 to-rp-purple/20 flex items-center justify-center mb-5 group-hover:glow-cyan transition-all">
                  <Icon className="w-6 h-6 text-rp-cyan" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{t(`features.f${n}.title`)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(`features.f${n}.desc`)}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rp-purple/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-16">{t('howItWorks.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-rp-cyan to-rp-purple flex items-center justify-center font-display text-2xl font-black text-rp-bg">
                  {step}
                </div>
                <h3 className="font-display font-semibold text-xl mb-2">{t(`howItWorks.step${step}.title`)}</h3>
                <p className="text-gray-500">{t(`howItWorks.step${step}.desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">{t('featured.title')}</h2>
            <p className="text-gray-500">{t('featured.subtitle')}</p>
          </div>
          <Link to="/browse" className="hidden md:flex items-center gap-2 text-rp-cyan hover:gap-3 transition-all text-sm font-medium">
            {t('featured.viewAll')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((l, i) => (
            <ListingCard key={l.id} listing={l} index={i} />
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/browse" className="btn-secondary">{t('featured.viewAll')}</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="relative glass-strong rounded-3xl p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-rp-cyan/5 via-rp-purple/5 to-rp-magenta/5" />
          <div className="relative">
            <Zap className="w-12 h-12 text-rp-amber mx-auto mb-6" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {t('hero.title1')} <span className="gradient-text">{t('hero.title2')}</span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">{t('hero.subtitle')}</p>
            <Link to="/auth" className="btn-primary text-lg">{t('nav.signup')}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
