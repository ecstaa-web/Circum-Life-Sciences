import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { api } from '../lib/api'

export default function CreateListing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    title: '',
    title_en: '',
    description: '',
    description_en: '',
    console: '',
    brand: '',
    listing_type: 'sell' as 'sell' | 'buy',
    condition: 'Bon',
    price: '',
    location: '',
    image_url: 'https://images.unsplash.com/photo-1606148013644-e571fd25f218?w=800&q=80',
    is_collectible: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      price: Number(form.price),
      title_en: form.title_en || form.title,
      description_en: form.description_en || form.description,
    }
    await api.createListing(payload)
    setSuccess(true)
    setTimeout(() => navigate('/browse'), 2000)
  }

  const update = (key: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  if (success) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-32 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block">
          <CheckCircle className="w-20 h-20 text-rp-green mx-auto mb-6" />
        </motion.div>
        <h2 className="font-display text-3xl font-bold gradient-text">{t('create.success')}</h2>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl font-bold mb-2">{t('create.title')}</h1>
      <p className="text-gray-500 mb-10">{t('create.subtitle')}</p>

      <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8 space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">{t('create.listingTitle')}</label>
          <input
            value={form.title}
            onChange={e => update('title', e.target.value)}
            className="rp-input"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">{t('create.description')}</label>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            className="rp-input min-h-[120px] resize-y"
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('create.console')}</label>
            <input value={form.console} onChange={e => update('console', e.target.value)} className="rp-input" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('create.brand')}</label>
            <input value={form.brand} onChange={e => update('brand', e.target.value)} className="rp-input" required />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('create.type')}</label>
            <select value={form.listing_type} onChange={e => update('listing_type', e.target.value as 'sell' | 'buy')} className="rp-select w-full">
              <option value="sell">{t('browse.sell')}</option>
              <option value="buy">{t('browse.buy')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('create.condition')}</label>
            <select value={form.condition} onChange={e => update('condition', e.target.value)} className="rp-select w-full">
              <option value="Neuf">Neuf / New</option>
              <option value="Comme neuf">Comme neuf / Like new</option>
              <option value="Excellent">Excellent</option>
              <option value="Très bon">Très bon / Very good</option>
              <option value="Bon">Bon / Good</option>
              <option value="Correct">Correct / Fair</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('create.price')}</label>
            <input type="number" value={form.price} onChange={e => update('price', e.target.value)} className="rp-input" required />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">{t('create.location')}</label>
          <input value={form.location} onChange={e => update('location', e.target.value)} className="rp-input" required />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_collectible}
            onChange={e => update('is_collectible', e.target.checked)}
            className="accent-rp-amber w-5 h-5"
          />
          <span className="text-sm">{t('create.collectible')}</span>
        </label>

        <button type="submit" className="btn-primary w-full text-lg py-4">
          {t('create.submit')}
        </button>
      </form>
    </div>
  )
}
