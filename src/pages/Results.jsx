import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, MinusCircle, RotateCcw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAssessment } from '../context/AssessmentContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { scoreAssessment, buildAssessmentPayload } from '../utils/scoring'
import LanguageSwitcher from '../components/LanguageSwitcher'
import SummarySheet from '../components/SummarySheet'

const TIER_ACCENT = {
  high: { text: 'text-rust', bg: 'bg-rust-light' },
  moderate: { text: 'text-amber', bg: 'bg-amber-light' },
  low: { text: 'text-sage', bg: 'bg-sage-light' },
}

export default function Results() {
  const { t, language } = useLanguage()
  const { answers, resetAnswers } = useAssessment()
  const { user } = useAuth()
  const navigate = useNavigate()
  const submittedRef = useRef(false)

  // Sync complete assessment data to backend & Supabase once on mount
  useEffect(() => {
    if (submittedRef.current || !answers) return

    async function syncAssessment() {
      submittedRef.current = true
      try {
        await api.submitAssessment(buildAssessmentPayload(answers))
      } catch (err) {
        console.warn('Backend sync failed:', err.message)
      }
    }

    syncAssessment()
  }, [answers])

  // Safely score assessment without crashing on partial/missing keys
  const score = scoreAssessment(answers || {})
  const { c1, c2, c3, flagCount = 0, tier = 'low', medicationCaveat } = score || {}
  const accent = TIER_ACCENT[tier] || TIER_ACCENT.low

  async function handleDownloadPdf() {
    try {
      await api.downloadDoctorReport(user?.fullName || 'Patient', language)
    } catch (err) {
      alert(err.message || 'Failed to download report. Ensure the backend server is running.')
    }
  }

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

          {/* Unified Summary Sheet with internal PDF download */}
          <div className="mb-6">
            <SummarySheet
              t={t}
              language={language}
              answers={answers}
              score={score}
              onDownload={handleDownloadPdf}
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