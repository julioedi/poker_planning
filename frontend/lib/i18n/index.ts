import en from './translations/en'
import es from './translations/es'
import fr from './translations/fr'
import de from './translations/de'
import ja from './translations/ja'

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja'

export interface Translation {
  [key: string]: string | Translation | {
    [key: string]: string
  }
}

const translations: Record<Language, Translation> = {
  en,
  es,
  fr,
  de,
  ja
}

// Recursive function to get nested translation values
function getNestedTranslation(obj: any, path: string[]): string | Translation | undefined {
  if (path.length === 0) return obj
  
  const [currentKey, ...remainingPath] = path
  
  if (obj && typeof obj === 'object' && currentKey in obj) {
    return getNestedTranslation(obj[currentKey], remainingPath)
  }
  
  return undefined
}

// Recursive function to replace parameters in strings
function replaceParams(value: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce((str, [param, value]) => {
    // Handle both {param} and %s style placeholders
    return str
      .replace(new RegExp(`{${param}}`, 'g'), String(value))
      .replace(new RegExp(`%s`, 'g'), String(value))
  }, value)
}

export function t(key: string, language: Language = 'en', params?: Record<string, string | number>): string {
  // Split the key by dots to handle nested paths
  const keyPath = key.split('.')
  
  // Try to get translation from the specified language
  let translation = getNestedTranslation(translations[language], keyPath)
  
  // Fallback to English if not found
  if (translation === undefined) {
    translation = getNestedTranslation(translations.en, keyPath)
  }
  
  // If still not found, return the key itself
  if (translation === undefined) {
    // console.warn(`Translation key not found: ${key}`)
    return key
  }
  
  // If translation is an object, convert it to string representation
  if (typeof translation === 'object') {
    if (Array.isArray(translation)) {
      return translation.join(', ')
    }
    return JSON.stringify(translation)
  }
  
  // Ensure we have a string
  const translationString = String(translation)
  
  // Replace parameters if provided
  if (params && Object.keys(params).length > 0) {
    return replaceParams(translationString, params)
  }
  
  return translationString
}

// Helper function to get nested translation objects
export function tObject(key: string, language: Language = 'en'): Translation | undefined {
  const keyPath = key.split('.')
  
  let translation = getNestedTranslation(translations[language], keyPath)
  
  if (translation === undefined) {
    translation = getNestedTranslation(translations.en, keyPath)
  }
  
  if (translation === undefined) {
    console.warn(`Translation object not found: ${key}`)
    return undefined
  }
  
  if (typeof translation === 'object' && !Array.isArray(translation)) {
    return translation as Translation
  }
  
  return undefined
}

// Helper function to check if a translation key exists
export function hasTranslation(key: string, language: Language = 'en'): boolean {
  const keyPath = key.split('.')
  const translation = getNestedTranslation(translations[language], keyPath)
  return translation !== undefined
}

// Helper function to get all available languages
export function getAvailableLanguages(): Language[] {
  return Object.keys(translations) as Language[]
}

// Helper function to get language metadata
export function getLanguageMetadata(): { code: Language; name: string; flag: string }[] {
  return [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ]
}

// Helper function to get translation keys for a specific language
export function getTranslationKeys(language: Language = 'en'): string[] {
  const keys: string[] = []
  
  function extractKeys(obj: any, prefix: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        extractKeys(value, fullKey)
      } else {
        keys.push(fullKey)
      }
    }
  }
  
  extractKeys(translations[language])
  return keys
}

export { translations } 