import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Check, Crown, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

const plans = [
  { key: 'free', icon: Zap, color: 'from-gray-500 to-gray-600' },
  { key: 'pro', icon: Crown, color: 'from-rp-cyan to-rp-purple', popular: true },
  { key: 'collector', icon: Crown, color: 'from-rp-amber to-rp-magenta' },
]

export default function Pricing() {
  const { t } = useTranslation()

  const featureCounts: Record<string, number> = { free: 4, pro: 6, collector: 6 }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-5xl font-bold mb-4"
        >
          {t('pricing.title')}
        </motion.h1>
        <p className="text-gray-500 max-w-xl mx-auto">{t('pricing.subtitle')}</p>
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
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className={`relative glass-strong rounded-3xl p-8 flex flex-col ${
                plan.popular ? 'border-rp-cyan/30 glow-cyan scale-105' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-rp-cyan to-rp-purple text-rp-bg">
                  {t('pricing.pro.badge')}
                </span>
              )}

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}>
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="font-display text-xl font-bold mb-2">{t(`pricing.${plan.key}.name`)}</h3>

              <div className="mb-6">
                <span className="font-display text-4xl font-black gradient-text">
                  {t(`pricing.${plan.key}.price`)}
                </span>
                <span className="text-gray-500 text-sm">{t(`pricing.${plan.key}.period`)}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-gray-400">
                    <Check className="w-4 h-4 text-rp-green mt-0.5 shrink-0" />
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
