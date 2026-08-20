import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Gamepad2 } from 'lucide-react'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-rp-border mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rp-cyan to-rp-purple flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-rp-bg" />
              </div>
              <span className="font-display font-bold gradient-text">RetroPulse</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{t('footer.tagline')}</p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-gray-300 mb-4">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/browse" className="hover:text-rp-cyan transition-colors">{t('nav.browse')}</Link></li>
              <li><Link to="/pricing" className="hover:text-rp-cyan transition-colors">{t('nav.pricing')}</Link></li>
              <li><Link to="/create" className="hover:text-rp-cyan transition-colors">{t('nav.sell')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-gray-300 mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span className="hover:text-rp-cyan transition-colors cursor-pointer">{t('footer.about')}</span></li>
              <li><span className="hover:text-rp-cyan transition-colors cursor-pointer">{t('footer.blog')}</span></li>
              <li><span className="hover:text-rp-cyan transition-colors cursor-pointer">{t('footer.careers')}</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-gray-300 mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span className="hover:text-rp-cyan transition-colors cursor-pointer">{t('footer.privacy')}</span></li>
              <li><span className="hover:text-rp-cyan transition-colors cursor-pointer">{t('footer.terms')}</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-rp-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">&copy; 2026 RetroPulse. {t('footer.rights')}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rp-green animate-pulse" />
            <span className="text-xs text-gray-500">API Status: Online</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
