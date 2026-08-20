import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Calendar, Tag, Heart, Share2, ExternalLink, Star
} from 'lucide-react'
import ListingCard from '../components/ListingCard'
import { api, type Listing, getLocalizedTitle, getLocalizedDescription } from '../lib/api'
import { getLanguage } from '../i18n'

export default function ListingDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const lang = getLanguage()
  const [listing, setListing] = useState<Listing | null>(null)
  const [similar, setSimilar] = useState<Listing[]>([])
  const [watchlisted, setWatchlisted] = useState(false)

  useEffect(() => {
    if (!id) return
    api.getListing(Number(id)).then(l => {
      setListing(l)
      api.getListings({ console: l.console, limit: 4 }).then(items =>
        setSimilar(items.filter(i => i.id !== l.id).slice(0, 3))
      )
    }).catch(() => {})
  }, [id])

  const handleWatchlist = async () => {
    if (!listing) return
    await api.addToWatchlist(listing.id)
    setWatchlisted(true)
  }

  if (!listing) {
    return <div className="max-w-7xl mx-auto px-6 py-20 text-center text-rp-muted">{t('common.loading')}</div>
  }

  const title = getLocalizedTitle(listing, lang)
  const description = getLocalizedDescription(listing, lang)

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-rp-muted hover:text-rp-primary transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </Link>

      <div className="grid lg:grid-cols-2 gap-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative rounded-3xl overflow-hidden aspect-square bg-slate-100 border border-rp-border shadow-sm"
        >
          <img src={listing.image_url} alt={title} className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={listing.listing_type === 'sell' ? 'badge-sell' : 'badge-buy'}>
              {listing.listing_type === 'sell' ? t('listing.sell') : t('listing.buy')}
            </span>
            {listing.is_collectible && (
              <span className="badge-collectible flex items-center gap-1">
                <Star className="w-3 h-3" /> {t('listing.collectible')}
              </span>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-rp-primary uppercase tracking-wide">{listing.console}</span>
            <span className="text-slate-300">•</span>
            <span className="text-sm text-rp-muted">{listing.brand}</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4 text-rp-text tracking-tight">{title}</h1>

          <div className="font-display text-4xl font-bold text-rp-text mb-6">
            {listing.price}{listing.currency === 'EUR' ? '€' : listing.currency}
          </div>

          <p className="text-rp-muted leading-relaxed mb-8">{description}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { icon: Tag, label: t('listing.condition'), value: listing.condition },
              { icon: MapPin, label: t('listing.location'), value: listing.location },
              { icon: ExternalLink, label: t('listing.source'), value: listing.source },
              { icon: Calendar, label: t('listing.posted'), value: new Date(listing.synced_at || listing.created_at).toLocaleDateString(lang) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 text-rp-muted text-xs mb-1">
                  <Icon className="w-3 h-3" /> {label}
                </div>
                <p className="font-medium text-rp-text">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-auto">
            {listing.source_url ? (
              <a href={listing.source_url} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1">
                <ExternalLink className="w-5 h-5" /> {t('listing.viewOn', { source: listing.source })}
              </a>
            ) : (
              <button className="btn-primary flex-1">
                <ExternalLink className="w-5 h-5" /> {t('listing.contact')}
              </button>
            )}
            <button
              onClick={handleWatchlist}
              className={`btn-secondary !px-4 ${watchlisted ? '!border-rose-300 !text-rose-600 !bg-rose-50' : ''}`}
            >
              <Heart className={`w-5 h-5 ${watchlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              {watchlisted ? t('listing.watchlisted') : t('listing.watchlist')}
            </button>
            <button className="btn-secondary !px-4">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold mb-8 text-rp-text">{t('listing.similar')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similar.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
