import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import { initialAnswers } from '../utils/scoring'

const STORAGE_KEY = 'hercycle-assessment-answers'

const AssessmentContext = createContext(null)

export function AssessmentProvider({ children }) {
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      // Merge over initialAnswers so any new fields added later (via
      // scoring.js) still show up even for someone resuming an old draft.
      return saved ? { ...initialAnswers, ...JSON.parse(saved) } : initialAnswers
    } catch {
      return initialAnswers
    }
  })

  // Autosave on every change. This is what lets someone close the tab
  // mid-assessment and pick up where they left off.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
    } catch {
      // Private browsing / storage full / disabled — fail silently,
      // the assessment still works, it just won't resume later.
    }
  }, [answers])

  const setField = useCallback((key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetAnswers = useCallback(() => {
    setAnswers(initialAnswers)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  // Clears the saved draft WITHOUT touching in-memory answers — used once
  // someone reaches their results, so a future visit starts fresh instead
  // of resuming, while the current session can still display the results.
  const clearSavedDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo(
    () => ({ answers, setField, resetAnswers, clearSavedDraft }),
    [answers, setField, resetAnswers, clearSavedDraft]
  )

  return (
    <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>
  )
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('useAssessment must be used within an AssessmentProvider')
  return ctx
}