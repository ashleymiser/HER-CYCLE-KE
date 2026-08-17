import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import en from '../i18n/en.json'
import sw from '../i18n/sw.json'

const DICTIONARIES = { en, sw }
const STORAGE_KEY = 'hercycle-language'

const LanguageContext = createContext(null)

function getFromPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj)
}

function interpolate(str, vars) {
  if (!vars) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in vars ? vars[key] : `{{${key}}}`))
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null
  )

  const setLanguage = useCallback((lang) => {
    localStorage.setItem(STORAGE_KEY, lang)
    setLanguageState(lang)
  }, [])

  const t = useCallback(
    (path, vars) => {
      const dict = DICTIONARIES[language || 'en']
      const value = getFromPath(dict, path)
      if (value === undefined) return path
      return interpolate(value, vars)
    },
    [language]
  )

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
