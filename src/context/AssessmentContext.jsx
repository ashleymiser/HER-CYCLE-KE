import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { initialAnswers } from '../utils/scoring'
import { useAuth } from './AuthContext'

const STORAGE_KEY = 'hercycle-assessment-answers'

const AssessmentContext = createContext(null)

export function AssessmentProvider({ children }) {
  const { user } = useAuth()
  const lastUserIdRef = useRef(user?.id)

  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...initialAnswers, ...JSON.parse(saved) } : initialAnswers
    } catch {
      return initialAnswers
    }
  })

  // Synchronize when the authenticated user changes or logs in
  useEffect(() => {
    const currentUserId = user?.id

    if (lastUserIdRef.current !== currentUserId) {
      lastUserIdRef.current = currentUserId

      const historicalData = user?.latestAssessment?.raw_questionnaire_data

      if (historicalData && typeof historicalData === 'object' && Object.keys(historicalData).length > 0) {
        const merged = { ...initialAnswers, ...historicalData }
        setAnswers(merged)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        } catch {
          // ignore
        }
      } else if (!user) {
        setAnswers(initialAnswers)
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore
        }
      }
    }
  }, [user])

  // Autosave answers to localStorage on modification
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
    } catch {
      // ignore
    }
  }, [answers])

  const setField = useCallback((key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }, [])

  const loadHistoricalAnswers = useCallback((historicalData) => {
    if (historicalData && typeof historicalData === 'object') {
      const merged = { ...initialAnswers, ...historicalData }
      setAnswers(merged)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      } catch {
        // ignore
      }
    }
  }, [])

  const resetAnswers = useCallback(() => {
    setAnswers(initialAnswers)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const clearSavedDraft = useCallback(() => {
    setAnswers(initialAnswers)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo(
    () => ({
      answers,
      setField,
      updateAnswer: setField,
      loadHistoricalAnswers,
      resetAnswers,
      clearSavedDraft,
    }),
    [answers, setField, loadHistoricalAnswers, resetAnswers, clearSavedDraft]
  )

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  )
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('useAssessment must be used within an AssessmentProvider')
  return ctx
}