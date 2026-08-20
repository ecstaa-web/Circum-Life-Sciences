import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Star, Gamepad2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { type Listing, getLocalizedTitle } from '../lib/api'
import { getLanguage } from '../i18n'

const FALLBACK_GRADIENTS = [
  'from-indigo-100 to-violet-100',
  'from-amber-50 to-orange-100',
  'from-sky-50 to-indigo-100',
]

interface Props {
  listing: Listing
  index?: number
}

export default function ListingCard({ listing, index = 0 }: Props) {
  const { t } = useTranslation()
  const lang = getLanguage()
  const title = getLocalizedTitle(listing, lang)
  const [imgError, setImgError] = useState(false)
  const gradient = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <Link to={`/listing/${listing.id}`} className="listing-card block group">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {!imgError ? (
            <img
              src={listing.image_url}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-3`}>
              <Gamepad2 className="w-10 h-10 text-indigo-400" />
              <span className="font-display text-sm text-rp-muted">{listing.console}</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={listing.listing_type === 'sell' ? 'badge-sell' : 'badge-buy'}>
              {listing.listing_type === 'sell' ? t('listing.sell') : t('listing.buy')}
            </span>
            {listing.is_collectible && (
              <span className="badge-collectible flex items-center gap-1">
                <Star className="w-3 h-3" /> {t('listing.collectible')}
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rp-primary uppercase tracking-wide">{listing.console}</span>
            <span className="font-display text-lg font-bold text-rp-text">
              {listing.price}{listing.currency === 'EUR' ? '€' : listing.currency}
            </span>
          </div>
          <h3 className="font-medium text-rp-text group-hover:text-rp-primary transition-colors line-clamp-2 mb-3 leading-snug">
            {title}
          </h3>
          <div className="flex items-center justify-between text-xs text-rp-muted">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {listing.location}
            </span>
            <span className="font-medium">{listing.source}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
