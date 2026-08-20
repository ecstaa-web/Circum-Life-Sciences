import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Star, Gamepad2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { type Listing, getLocalizedTitle } from '../lib/api'
import { getLanguage } from '../i18n'

const FALLBACK_GRADIENTS = [
  'from-rp-cyan/30 to-rp-purple/30',
  'from-rp-magenta/30 to-rp-amber/30',
  'from-rp-purple/30 to-rp-cyan/30',
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
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
    >
      <Link to={`/listing/${listing.id}`} className="listing-card block group">
        <div className="relative aspect-[4/3] overflow-hidden">
          {!imgError ? (
            <img
              src={listing.image_url}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-3`}>
              <Gamepad2 className="w-12 h-12 text-rp-cyan/60" />
              <span className="font-display text-sm text-white/70">{listing.console}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-rp-bg via-transparent to-transparent" />
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
          <div className="absolute bottom-3 right-3">
            <span className="font-display text-xl font-bold text-white text-glow-cyan">
              {listing.price}{listing.currency === 'EUR' ? '€' : listing.currency}
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-rp-cyan/70 uppercase tracking-wider">{listing.console}</span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500">{listing.brand}</span>
          </div>
          <h3 className="font-semibold text-white group-hover:text-rp-cyan transition-colors line-clamp-2 mb-3">
            {title}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {listing.location}
            </span>
            <span className="text-gray-600">{listing.source}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
