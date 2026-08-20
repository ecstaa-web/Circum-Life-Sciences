import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, SlidersHorizontal } from 'lucide-react'
import ListingCard from '../components/ListingCard'
import { api, type Listing } from '../lib/api'

export default function Browse() {
  const { t } = useTranslation()
  const [listings, setListings] = useState<Listing[]>([])
  const [consoles, setConsoles] = useState<{ name: string; count: number }[]>([])
  const [brands, setBrands] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [listingType, setListingType] = useState('')
  const [consoleFilter, setConsoleFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [collectible, setCollectible] = useState(false)
  const [sort, setSort] = useState('newest')

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getListings({
        search: search || undefined,
        listing_type: listingType || undefined,
        console: consoleFilter || undefined,
        brand: brandFilter || undefined,
        collectible: collectible || undefined,
        sort,
        limit: 50,
      })
      setListings(data)
    } catch {
      setListings([])
    }
    setLoading(false)
  }, [search, listingType, consoleFilter, brandFilter, collectible, sort])

  useEffect(() => {
    api.getConsoles().then(setConsoles).catch(() => {})
    api.getBrands().then(setBrands).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(fetchListings, 300)
    return () => clearTimeout(timer)
  }, [fetchListings])

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">{t('browse.title')}</h1>
        <p className="text-gray-500">{t('browse.subtitle')}</p>
      </div>

      {/* Search & Filters */}
      <div className="glass-strong rounded-2xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('browse.search')}
              className="rp-input pl-12"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select value={listingType} onChange={e => setListingType(e.target.value)} className="rp-select">
              <option value="">{t('browse.allTypes')}</option>
              <option value="sell">{t('browse.sell')}</option>
              <option value="buy">{t('browse.buy')}</option>
            </select>

            <select value={consoleFilter} onChange={e => setConsoleFilter(e.target.value)} className="rp-select">
              <option value="">{t('browse.allConsoles')}</option>
              {consoles.map(c => (
                <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
              ))}
            </select>

            <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="rp-select">
              <option value="">{t('browse.allBrands')}</option>
              {brands.map(b => (
                <option key={b.name} value={b.name}>{b.name} ({b.count})</option>
              ))}
            </select>

            <select value={sort} onChange={e => setSort(e.target.value)} className="rp-select">
              <option value="newest">{t('browse.sortNewest')}</option>
              <option value="price_asc">{t('browse.sortPriceAsc')}</option>
              <option value="price_desc">{t('browse.sortPriceDesc')}</option>
            </select>

            <label className="flex items-center gap-2 px-4 py-3 rounded-xl glass cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={collectible}
                onChange={e => setCollectible(e.target.checked)}
                className="accent-rp-cyan"
              />
              <SlidersHorizontal className="w-4 h-4 text-rp-amber" />
              {t('browse.collectibleOnly')}
            </label>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        {t('browse.results', { count: listings.length })}
      </p>

      {loading ? (
        <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">{t('browse.noResults')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l, i) => (
            <ListingCard key={l.id} listing={l} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
