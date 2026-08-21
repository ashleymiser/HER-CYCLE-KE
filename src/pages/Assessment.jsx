import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAssessment } from '../context/AssessmentContext'
import { SECTION_FIELDS, isSectionComplete } from '../utils/scoring'
import { SECTION_ACCENT, FIELD_VALUES, BINARY_FIELDS } from '../utils/fieldConfig'
import CycleRing from '../components/CycleRing'
import LanguageSwitcher from '../components/LanguageSwitcher'
import QuestionBlock from '../components/QuestionBlock'
import OptionButton from '../components/OptionButton'
import { useState } from 'react'

const TOTAL_SECTIONS = 4

export default function Assessment() {
  const { t } = useLanguage()
  const { answers, setField } = useAssessment()
  const navigate = useNavigate()
  const [section, setSection] = useState(1)

  const fields = SECTION_FIELDS[section]
  const accent = SECTION_ACCENT[section]
  const canAdvance = isSectionComplete(answers, section)

  function handleBack() {
    if (section === 1) {
      navigate('/home')
    } else {
      setSection(section - 1)
    }
  }

  function handleNext() {
    if (section === TOTAL_SECTIONS) {
      navigate('/results')
    } else {
      setSection(section + 1)
    }
  }

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <header className="flex justify-between items-center px-6 pt-6">
        <button
          onClick={handleBack}
          className="text-sm text-plum-light hover:text-plum transition-colors"
        >
          ← {t('nav.back')}
        </button>
        <LanguageSwitcher />
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-lg">
          <div className="flex flex-col items-center mb-6">
            <CycleRing progress={section / TOTAL_SECTIONS} segments={TOTAL_SECTIONS} size={72} strokeWidth={6}>
              <span className="font-mono text-xs text-plum">
                {section}/{TOTAL_SECTIONS}
              </span>
            </CycleRing>
            <p className="font-mono text-xs tracking-[0.15em] uppercase text-plum-light mt-3">
              {t(`assessment.sections.${section}.label`)}
            </p>
          </div>

          <div className="bg-cream rounded-2xl border border-sand-dark p-6">
            {fields.map((field) => {
              const values = FIELD_VALUES[field]
              const isBinary = BINARY_FIELDS.has(field)
              const help = t(`assessment.questions.${field}.help`)

              return (
                <QuestionBlock
                  key={field}
                  title={t(`assessment.questions.${field}.title`)}
                  help={help.startsWith('assessment.') ? null : help}
                >
                  {values.map((value) => {
                    const label = isBinary
                      ? t(`common.${value}`)
                      : t(`assessment.questions.${field}.options.${value}`)
                    return (
                      <OptionButton
                        key={value}
                        label={label}
                        selected={answers[field] === value}
                        onClick={() => setField(field, value)}
                        accent={accent}
                      />
                    )
                  })}
                </QuestionBlock>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleBack}
              className="text-sm font-medium text-plum-light hover:text-plum transition-colors"
            >
              ← {t('nav.back')}
            </button>
            <span className="font-mono text-xs text-plum-light">
              {t('assessment.progress', { current: section, total: TOTAL_SECTIONS })}
            </span>
            <button
              disabled={!canAdvance}
              onClick={handleNext}
              className="px-5 py-2.5 rounded-full bg-plum text-cream text-sm font-semibold
                         hover:bg-plum-light transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {section === TOTAL_SECTIONS ? t('nav.seeResult') : t('nav.next')} →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
