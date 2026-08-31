import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import en from '../i18n/en.json'
import sw from '../i18n/sw.json'

const DICTIONARIES = { en, sw }
const STORAGE_KEY = 'hercycle-language'

const LanguageContext = createContext(null)

// In-memory key path cache to eliminate split-reduce overhead during renders
const pathCache = new Map()

function getFromPath(obj, path) {
  if (!obj) return undefined
  const cacheKey = path

  if (!pathCache.has(cacheKey)) {
    pathCache.set(cacheKey, path.split('.'))
  }

  const keys = pathCache.get(cacheKey)
  let curr = obj
  for (let i = 0; i < keys.length; i++) {
    if (curr === undefined || curr === null) return undefined
    curr = curr[keys[i]]
  }
  return curr
}

function interpolate(str, vars) {
  if (!vars || typeof str !== 'string') return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in vars ? vars[key] : `{{${key}}}`))
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null
    } catch {
      return null
    }
  })

  const setLanguage = useCallback((lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
    setLanguageState(lang)
  }, [])

  const t = useCallback(
    (path, vars) => {
      const activeLang = language || 'en'
      const dict = DICTIONARIES[activeLang] || DICTIONARIES.en
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