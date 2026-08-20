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
    return <div className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-500">{t('common.loading')}</div>
  }

  const title = getLocalizedTitle(listing, lang)
  const description = getLocalizedDescription(listing, lang)

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rp-cyan transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </Link>

      <div className="grid lg:grid-cols-2 gap-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative rounded-3xl overflow-hidden aspect-square"
        >
          <img src={listing.image_url} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-rp-bg/60 to-transparent" />
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

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-rp-cyan uppercase tracking-wider">{listing.console}</span>
            <span className="text-gray-600">•</span>
            <span className="text-sm text-gray-500">{listing.brand}</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">{title}</h1>

          <div className="font-display text-4xl font-black gradient-text mb-6">
            {listing.price}{listing.currency === 'EUR' ? '€' : listing.currency}
          </div>

          <p className="text-gray-400 leading-relaxed mb-8">{description}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Tag className="w-3 h-3" /> {t('listing.condition')}
              </div>
              <p className="font-medium">{listing.condition}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <MapPin className="w-3 h-3" /> {t('listing.location')}
              </div>
              <p className="font-medium">{listing.location}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <ExternalLink className="w-3 h-3" /> {t('listing.source')}
              </div>
              <p className="font-medium">{listing.source}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Calendar className="w-3 h-3" /> {t('listing.posted')}
              </div>
              <p className="font-medium">{new Date(listing.created_at).toLocaleDateString(lang)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-auto">
            <button className="btn-primary flex-1">
              <ExternalLink className="w-5 h-5" /> {t('listing.contact')}
            </button>
            <button
              onClick={handleWatchlist}
              className={`btn-secondary !px-4 ${watchlisted ? '!border-rp-magenta !text-rp-magenta' : ''}`}
            >
              <Heart className={`w-5 h-5 ${watchlisted ? 'fill-rp-magenta' : ''}`} />
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
          <h2 className="font-display text-2xl font-bold mb-8">{t('listing.similar')}</h2>
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
