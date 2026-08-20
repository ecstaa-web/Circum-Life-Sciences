import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

const savedLang = localStorage.getItem('retropulse.lang')
const browserLang = navigator.language.startsWith('fr') ? 'fr' : 'en'
const initialLang = savedLang || browserLang

const titles: Record<string, string> = {
  fr: 'RetroPulse — Le pulse du marché des consoles',
  en: 'RetroPulse — The pulse of the console market',
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = initialLang
document.title = titles[initialLang] || titles.fr

export default i18n

export function setLanguage(lang: 'fr' | 'en') {
  i18n.changeLanguage(lang)
  localStorage.setItem('retropulse.lang', lang)
  document.documentElement.lang = lang
  document.title = titles[lang]
}

export function getLanguage(): 'fr' | 'en' {
  return (i18n.language?.startsWith('fr') ? 'fr' : 'en') as 'fr' | 'en'
}
