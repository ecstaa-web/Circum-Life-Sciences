import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Logo from './Logo'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-rp-border mt-20 bg-white/60">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Logo size={36} />
              <span className="font-display font-bold text-rp-text">RetroPulse</span>
            </div>
            <p className="text-sm text-rp-muted leading-relaxed">{t('footer.tagline')}</p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-rp-text mb-4">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm text-rp-muted">
              <li><Link to="/browse" className="hover:text-rp-primary transition-colors">{t('nav.browse')}</Link></li>
              <li><Link to="/pricing" className="hover:text-rp-primary transition-colors">{t('nav.pricing')}</Link></li>
              <li><Link to="/create" className="hover:text-rp-primary transition-colors">{t('nav.sell')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-rp-text mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm text-rp-muted">
              <li><span className="hover:text-rp-primary transition-colors cursor-pointer">{t('footer.about')}</span></li>
              <li><span className="hover:text-rp-primary transition-colors cursor-pointer">{t('footer.blog')}</span></li>
              <li><span className="hover:text-rp-primary transition-colors cursor-pointer">{t('footer.careers')}</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-rp-text mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-rp-muted">
              <li><span className="hover:text-rp-primary transition-colors cursor-pointer">{t('footer.privacy')}</span></li>
              <li><span className="hover:text-rp-primary transition-colors cursor-pointer">{t('footer.terms')}</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-rp-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-rp-muted">&copy; 2026 RetroPulse. {t('footer.rights')}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-rp-muted">API Status: Online</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
