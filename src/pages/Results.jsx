import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'

// TODO (Day 4-5): replace this stub with:
// - Risk score band (High / Moderate / Low) from the Rotterdam-proxy scoring logic
// - Downloadable "Doctor-Ready Summary Sheet" (PDF)
export default function Results() {
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
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust mb-3">
          {t('results.eyebrow')}
        </p>
        <h2 className="font-display text-2xl text-plum mb-3 max-w-sm">
          {t('results.placeholderTitle')}
        </h2>
        <p className="text-plum-light max-w-sm">{t('results.placeholderBody')}</p>
      </main>
    </div>
  )
}
