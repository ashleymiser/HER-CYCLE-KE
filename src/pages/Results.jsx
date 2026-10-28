import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Loader2, MinusCircle, RotateCcw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAssessment } from '../context/AssessmentContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import {
  initialAnswers,
  scoreAssessment,
  buildAssessmentPayload,
  isSectionComplete,
  SECTION_FIELDS,
} from '../utils/scoring'
import LanguageSwitcher from '../components/LanguageSwitcher'
import SummarySheet from '../components/SummarySheet'

const TIER_ACCENT = {
  high: { text: 'text-rust', bg: 'bg-rust-light' },
  moderate: { text: 'text-amber', bg: 'bg-amber-light' },
  low: { text: 'text-sage', bg: 'bg-sage-light' },
}

const SYNC_KEY = 'hercycle_synced_assessment'
const ANSWER_KEYS = Object.keys(initialAnswers)

// Stable fingerprint of the questionnaire answers (key order independent).
function answersSignature(a) {
  return JSON.stringify(ANSWER_KEYS.map((k) => a?.[k] ?? ''))
}

function readSynced() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_KEY))
  } catch {
    return null
  }
}

function isQuestionnaireComplete(answers) {
  return Object.keys(SECTION_FIELDS).every((section) => isSectionComplete(answers || {}, Number(section)))
}

export default function Results() {
  const { t, language } = useLanguage()
  const { answers, resetAnswers } = useAssessment()
  const { user } = useAuth()
  const navigate = useNavigate()
  const inFlightRef = useRef(null)
  // 'idle' | 'saving' | 'saved' | 'error'
  const [syncStatus, setSyncStatus] = useState('idle')

  const userId = String(user?.id ?? '')
  const signature = answersSignature(answers)
  const complete = isQuestionnaireComplete(answers)

  // These exact answers are already saved if this device synced them for this
  // user, or if the server's latest assessment matches them (e.g. after login).
  const synced = readSynced()
  const serverAnswers = user?.latestAssessment?.raw_questionnaire_data
  const alreadySynced =
    (synced?.userId === userId && synced?.signature === signature) ||
    (serverAnswers && answersSignature(serverAnswers) === signature)

  const syncAssessment = useCallback(async () => {
    inFlightRef.current = signature
    setSyncStatus('saving')
    try {
      await api.submitAssessment(buildAssessmentPayload(answers))
      try {
        localStorage.setItem(SYNC_KEY, JSON.stringify({ userId, signature }))
      } catch {
        // ignore storage failures
      }
      setSyncStatus('saved')
    } catch (err) {
      console.warn('Backend sync failed:', err.message)
      inFlightRef.current = null // allow a retry
      setSyncStatus('error')
    }
  }, [answers, signature, userId])

  // Save to the backend once per distinct set of complete answers. Revisiting
  // this page (or React StrictMode re-running effects) does not re-submit.
  useEffect(() => {
    if (!complete || alreadySynced) return
    if (inFlightRef.current === signature) return
    syncAssessment()
  }, [complete, alreadySynced, signature, syncAssessment])

  const status = alreadySynced ? 'saved' : syncStatus

  // Safely score assessment without crashing on partial/missing keys
  const score = scoreAssessment(answers || {})
  const { c1, c2, c3, flagCount = 0, tier = 'low', medicationCaveat } = score || {}
  const accent = TIER_ACCENT[tier] || TIER_ACCENT.low

  function handleStartOver() {
    resetAnswers()
    navigate('/assessment')
  }

  const criteriaRows = [
    { label: t('results.criteria.c1'), flagged: c1 },
    { label: t('results.criteria.c2'), flagged: c2 },
    { label: t('results.criteria.c3'), flagged: c3 },
  ]

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <header className="no-print flex justify-between items-center px-6 pt-6 max-w-4xl w-full mx-auto">
        <button
          onClick={() => navigate('/assessment')}
          className="text-sm text-plum-light hover:text-plum transition-colors"
        >
          ← {t('nav.back')}
        </button>
        <LanguageSwitcher />
      </header>

      <main className="flex-1 flex justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          <p className="font-mono text-xs tracking-[0.15em] uppercase text-plum-light mb-3">
            {t('results.eyebrow')}
          </p>

          <div className={`rounded-xl p-4 mb-5 ${accent.bg}`}>
            <div className={`font-display font-bold text-lg mb-1 ${accent.text}`}>
              {t(`results.tier.${tier}`)}
            </div>
            <div className="text-xs text-plum">
              {t('results.criteriaFlagged', { count: flagCount })}
            </div>
          </div>

          {medicationCaveat && (
            <div className="flex items-start gap-2 rounded-lg p-3 mb-5 text-xs bg-amber-light text-plum">
              <AlertTriangle size={15} className="text-amber mt-0.5 flex-shrink-0" />
              {t('results.medicationCaveat')}
            </div>
          )}

          <div className="space-y-2 mb-6">
            {criteriaRows.map((row) => (
              <div key={row.label} className="flex items-center gap-2 text-sm text-plum">
                {row.flagged ? (
                  <CheckCircle2 size={16} className="text-rust" />
                ) : (
                  <MinusCircle size={16} className="text-plum-light" />
                )}
                {row.label}
              </div>
            ))}
          </div>

          {complete && status !== 'idle' && (
            <div className="no-print mb-4" role="status" aria-live="polite">
              {status === 'saving' && (
                <p className="flex items-center gap-1.5 text-xs text-plum-light">
                  <Loader2 size={13} className="animate-spin" /> {t('results.sync.saving')}
                </p>
              )}
              {status === 'saved' && (
                <p className="flex items-center gap-1.5 text-xs text-plum-light">
                  <CheckCircle2 size={13} className="text-sage" /> {t('results.sync.saved')}
                </p>
              )}
              {status === 'error' && (
                <div className="flex items-start justify-between gap-3 rounded-lg p-3 text-xs bg-amber-light text-plum">
                  <span className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-amber mt-0.5 flex-shrink-0" />
                    {t('results.sync.failed')}
                  </span>
                  <button
                    type="button"
                    onClick={syncAssessment}
                    className="font-semibold underline whitespace-nowrap"
                  >
                    {t('results.sync.retry')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Unified Summary Sheet with internal PDF download */}
          <div className="mb-6">
            <SummarySheet
              t={t}
              language={language}
              answers={answers}
              score={score}
            />
          </div>

          <button
            onClick={handleStartOver}
            className="no-print flex items-center gap-1.5 text-sm font-semibold text-plum-light hover:text-plum transition-colors"
          >
            <RotateCcw size={14} /> {t('results.startOver')}
          </button>

          <p className="text-center text-xs text-plum-light mt-8">{t('results.disclaimer')}</p>
        </div>
      </main>
    </div>
  )
}
