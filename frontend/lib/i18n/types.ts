
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja'

export type Translation = {
  [key: string]: string | Translation
}


export type Translations = {
  [key in Language]: Translation
}