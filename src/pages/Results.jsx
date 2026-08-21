import { useNavigate, Navigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, MinusCircle, RotateCcw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAssessment } from '../context/AssessmentContext'
import { scoreAssessment } from '../utils/scoring'
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
  const navigate = useNavigate()

  // If someone lands here without having answered anything, send them
  // back into the assessment rather than showing an empty result.
  if (!answers.menarcheYears) {
    return <Navigate to="/assessment" replace />
  }

  const score = scoreAssessment(answers)
  const { c1, c2, c3, flagCount, tier, medicationCaveat } = score
  const accent = TIER_ACCENT[tier]

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
      <header className="no-print flex justify-between items-center px-6 pt-6">
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
          {/* On-screen "at a glance" preview */}
          <div className="no-print">
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
          </div>

          {/* Download/Print buttons + the actual printable/downloadable
              doctor-ready sheet (hidden on screen, shown only on print) */}
          <SummarySheet t={t} language={language} answers={answers} score={score} />

          <button
            onClick={handleStartOver}
            className="no-print flex items-center gap-1.5 text-sm font-semibold text-plum-light hover:text-plum transition-colors mt-4"
          >
            <RotateCcw size={14} /> {t('results.startOver')}
          </button>

          <p className="no-print text-center text-xs text-plum-light mt-8">
            {t('results.disclaimer')}
          </p>
        </div>
      </main>
    </div>
  )
}
