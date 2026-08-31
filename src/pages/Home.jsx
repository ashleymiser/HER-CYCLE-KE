import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import CycleRing from '../components/CycleRing'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Home() {
  const { t, language } = useLanguage()
  const { user: authUser, saveAuth, logout } = useAuth()
  const navigate = useNavigate()

  const [patient, setPatient] = useState(authUser || null)
  const [latestAssessment, setLatestAssessment] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadPatientDetails() {
      try {
        const data = await api.getMe()
        if (isMounted) {
          setPatient(data.user)
          setLatestAssessment(data.latestAssessment)
          saveAuth(data.user, localStorage.getItem('hercycle_token'))
        }
      } catch (err) {
        console.warn('Could not load remote profile:', err.message)
      }
    }

    loadPatientDetails()

    return () => {
      isMounted = false
    }
  }, [])

  function handleLogout() {
    logout()
    navigate('/signup')
  }

  // Greeting switches dynamically between "Welcome" (en) and "Karibu" (sw)
  const greetingPrefix = language === 'sw' ? 'Karibu' : 'Welcome'

  return (
    <div className="min-h-screen bg-sand flex flex-col">
      <header className="flex justify-between items-center px-6 pt-6 max-w-4xl w-full mx-auto">
        <div className="text-left">
          {patient?.fullName ? (
            <p className="text-base font-semibold text-plum">
              {greetingPrefix}, <span className="text-rust">{patient.fullName}</span>
            </p>
          ) : (
            <p className="text-base font-semibold text-plum">
              {greetingPrefix}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {patient && (
            <button
              onClick={handleLogout}
              className="text-xs text-rust hover:text-plum font-medium underline transition-colors"
            >
              {language === 'sw' ? 'Toka' : 'Log out'}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md w-full">
          <div className="flex justify-center mb-4">
            <CycleRing progress={0.7} segments={4} size={88} strokeWidth={6}>
              <span className="font-display text-sm text-plum">PCOS</span>
            </CycleRing>
          </div>

          <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust mt-6 mb-3">
            {t('home.eyebrow')}
          </p>

          <h1 className="font-display text-3xl md:text-4xl text-plum leading-tight mb-4">
            {t('home.title')}
          </h1>

          <p className="text-plum-light leading-relaxed mb-6">{t('home.body')}</p>

          {latestAssessment?.evaluation_results?.[0] && (
            <div className="bg-sand-light border border-plum/10 rounded-2xl p-4 mb-6 text-left shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs uppercase tracking-wider font-mono text-plum-light">
                  {language === 'sw' ? 'Tathmini Iliyopita' : 'Previous Screening'}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rust/10 text-rust">
                  {latestAssessment.evaluation_results[0].risk_level} {language === 'sw' ? 'Hatari' : 'Risk'}
                </span>
              </div>
              <p className="text-xs text-plum-light">
                {language === 'sw' ? 'Ilikamilika: ' : 'Completed: '}
                {new Date(latestAssessment.completed_at).toLocaleDateString()}
              </p>
            </div>
          )}

          <button
            onClick={() => navigate('/assessment')}
            className="px-8 py-4 rounded-full bg-plum text-cream font-medium
                       hover:bg-plum-light transition-colors
                       focus:outline-none focus:ring-2 focus:ring-rust focus:ring-offset-2 focus:ring-offset-sand shadow-sm"
          >
            {latestAssessment ? (language === 'sw' ? 'Fanya Tathmini Upya' : 'Retake Assessment') : t('home.cta')}
          </button>

          <p className="text-xs text-plum-light mt-6 max-w-xs mx-auto">
            {t('home.disclaimer')}
          </p>
        </div>
      </main>
    </div>
  )
}