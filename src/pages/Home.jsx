import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import CycleRing from '../components/CycleRing'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Home() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <header className="flex justify-end px-6 pt-6">
        <LanguageSwitcher />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <CycleRing progress={0.7} segments={4} size={88} strokeWidth={6}>
            <span className="font-display text-sm text-plum">PCOS</span>
          </CycleRing>

          <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust mt-6 mb-3">
            {t('home.eyebrow')}
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-plum leading-tight mb-4">
            {t('home.title')}
          </h1>
          <p className="text-plum-light leading-relaxed mb-6">{t('home.body')}</p>

          <button
            onClick={() => navigate('/assessment')}
            className="px-8 py-4 rounded-full bg-plum text-cream font-medium
                       hover:bg-plum-light transition-colors
                       focus:outline-none focus:ring-2 focus:ring-rust focus:ring-offset-2 focus:ring-offset-sand"
          >
            {t('home.cta')}
          </button>

          <p className="text-xs text-plum-light mt-6 max-w-xs mx-auto">
            {t('home.disclaimer')}
          </p>
        </div>
      </main>
    </div>
  )
}
