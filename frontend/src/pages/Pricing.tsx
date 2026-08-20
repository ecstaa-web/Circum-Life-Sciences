import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Check, Crown, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const plans = [
  { key: 'free', icon: Zap, color: 'bg-slate-100 text-slate-600' },
  { key: 'pro', icon: Crown, color: 'bg-indigo-600 text-white', popular: true },
  { key: 'collector', icon: Crown, color: 'bg-amber-500 text-white' },
]

export default function Pricing() {
  const { t } = useTranslation()
  const featureCounts: Record<string, number> = { free: 4, pro: 6, collector: 6 }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-14">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-5xl font-bold mb-4 text-rp-text tracking-tight"
        >
          {t('pricing.title')}
        </motion.h1>
        <p className="text-rp-muted max-w-xl mx-auto">{t('pricing.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, i) => {
          const Icon = plan.icon
          const features = Array.from({ length: featureCounts[plan.key] }, (_, j) =>
            t(`pricing.${plan.key}.f${j + 1}`)
          )

          return (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative glass-strong rounded-3xl p-8 flex flex-col ${
                plan.popular ? 'ring-2 ring-indigo-200 shadow-lg shadow-indigo-100 scale-[1.02]' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-rp-primary text-white">
                  {t('pricing.pro.badge')}
                </span>
              )}

              <div className={`w-12 h-12 rounded-xl ${plan.color} flex items-center justify-center mb-6`}>
                <Icon className="w-6 h-6" />
              </div>

              <h3 className="font-display text-xl font-bold mb-2 text-rp-text">{t(`pricing.${plan.key}.name`)}</h3>

              <div className="mb-6">
                <span className="font-display text-4xl font-bold text-rp-text">
                  {t(`pricing.${plan.key}.price`)}
                </span>
                <span className="text-rp-muted text-sm ml-1">{t(`pricing.${plan.key}.period`)}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-rp-muted">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/auth"
                className={plan.popular ? 'btn-primary text-center' : 'btn-secondary text-center'}
              >
                {t(`pricing.${plan.key}.cta`)}
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
