import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import CycleRing from '../components/CycleRing'
import LanguageSwitcher from '../components/LanguageSwitcher'

// TODO (Day 2-3): replace this stub with the real multi-step form:
// 1. Basic details
// 2. Cycle history (regularity, length, recent cycles)
// 3. Symptoms + physical markers (acne, hair growth patterns)
// 4. Metabolic / underlying conditions
export default function Assessment() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <header className="flex justify-between items-center px-6 pt-6">
        <button onClick={() => navigate('/home')} className="text-sm text-plum-light hover:text-plum">
          ← {t('nav.back')}
        </button>
        <LanguageSwitcher />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <CycleRing progress={0.25} segments={4} size={100} strokeWidth={7}>
          <span className="font-mono text-sm text-plum">1/4</span>
        </CycleRing>

        <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust mt-6 mb-3">
          {t('assessment.eyebrow')}
        </p>
        <h2 className="font-display text-2xl text-plum mb-3 max-w-sm">
          {t('assessment.placeholderTitle')}
        </h2>
        <p className="text-plum-light max-w-sm">{t('assessment.placeholderBody')}</p>
      </main>
    </div>
  )
}
