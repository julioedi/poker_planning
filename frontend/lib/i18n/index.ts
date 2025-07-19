import en from './translations/en'
import es from './translations/es'
import fr from './translations/fr'
import de from './translations/de'
import ja from './translations/ja'

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja'

const translations = {
  en,
  es,
  fr,
  de,
  ja
}

export type TranslationKey = keyof typeof en

export function t(key: TranslationKey, language: Language = 'en', params?: Record<string, string | number>): string {
  const translation = translations[language]?.[key] || translations.en[key] || key
  
  if (params) {
    return Object.entries(params).reduce((str, [param, value]) => {
      return str.replace(new RegExp(`%s`, 'g'), String(value))
    }, translation)
  }
  
  return translation
}

export function getAvailableLanguages(): { code: Language; name: string; flag: string }[] {
  return [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ]
}

export { translations } 