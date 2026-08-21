import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { initialAnswers } from '../utils/scoring'

const AssessmentContext = createContext(null)

export function AssessmentProvider({ children }) {
  const [answers, setAnswers] = useState(initialAnswers)

  const setField = useCallback((key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetAnswers = useCallback(() => {
    setAnswers(initialAnswers)
  }, [])

  const value = useMemo(
    () => ({ answers, setField, resetAnswers }),
    [answers, setField, resetAnswers]
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
