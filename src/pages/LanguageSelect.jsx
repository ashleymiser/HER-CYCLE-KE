import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const OPTIONS = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'sw', label: 'Kiswahili', native: 'Kiswahili' },
]

export default function LanguageSelect() {
  const { setLanguage } = useLanguage()
  const navigate = useNavigate()

  function choose(code) {
    setLanguage(code)
    navigate('/landing')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-sand">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-plum-light text-center mb-3">
          HerCycle Kenya
        </p>
        <h1 className="font-display text-3xl text-center text-plum mb-8">
          Choose your language
          <span className="block text-lg text-plum-light mt-1">Chagua lugha yako</span>
        </h1>

        <div className="flex flex-col gap-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => choose(opt.code)}
              className="w-full text-left px-6 py-5 rounded-2xl bg-cream border border-sand-dark
                         hover:border-rust hover:bg-rust-light transition-colors
                         focus:outline-none focus:ring-2 focus:ring-rust focus:ring-offset-2 focus:ring-offset-sand"
            >
              <span className="font-display text-xl text-plum">{opt.native}</span>
            </button>
          ))}
        </div>

        <p className="text-sm text-plum-light text-center mt-8">
          You can switch anytime from the top of the screen.
        </p>
      </div>
    </div>
  )
}