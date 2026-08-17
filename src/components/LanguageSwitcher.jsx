import { useLanguage } from '../context/LanguageContext'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="inline-flex rounded-full border border-sand-dark bg-cream p-1 font-mono text-xs">
      {['en', 'sw'].map((code) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={`px-3 py-1.5 rounded-full uppercase tracking-wide transition-colors
            ${language === code ? 'bg-plum text-cream' : 'text-plum-light hover:text-plum'}`}
        >
          {code}
        </button>
      ))}
    </div>
  )
}
