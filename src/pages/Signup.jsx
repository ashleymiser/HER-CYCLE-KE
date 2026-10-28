import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useAssessment } from '../context/AssessmentContext'
import { api } from '../services/api'
import { authErrorKey } from '../utils/authErrors'
import styles from '../styles/scrapbook.module.css'

const SAVED_PROFILES_KEY = 'hercycle_saved_profiles'

export default function Signup() {
  const { t, language } = useLanguage()
  const { saveAuth } = useAuth()
  const { resetAnswers } = useAssessment()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const cleanName = name.trim()
    const cleanContact = contact.trim()

    if (!cleanName || !cleanContact) {
      setError(t('signup.validationError'))
      return
    }

    setLoading(true)

    try {
      const data = await api.register({
        fullName: cleanName,
        phoneNumber: cleanContact,
        preferredLanguage: language || 'en',
      })

      // Add to suggestion list for next time
      try {
        const existing = JSON.parse(localStorage.getItem(SAVED_PROFILES_KEY) || '[]')
        const updated = [
          { name: cleanName, contact: cleanContact },
          ...existing.filter((p) => p.name.toLowerCase() !== cleanName.toLowerCase()),
        ].slice(0, 5)
        localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }

      if (typeof resetAnswers === 'function') {
        resetAnswers()
      }

      saveAuth(data.user, data.token, null)
      navigate('/home')
    } catch (err) {
      setError(t(authErrorKey(err, 'register')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <header className={styles.landingHeader}>
        <Link to="/landing" className={styles.logo}>
          Her<span>Cycle</span> Kenya
        </Link>
        <Link to="/landing" className={styles.backLink}>
          ← {t('signup.back')}
        </Link>
      </header>

      <section className={styles.signupSection}>
        <form className={styles.journalPage} onSubmit={handleSubmit} autoComplete="on">
          <div className={styles.journalTape}></div>
          <p className={styles.journalEyebrow}>{t('signup.eyebrow')}</p>
          <h3 className={styles.journalTitle}>{t('signup.title')}</h3>
          <p className={styles.journalSub}>{t('signup.sub')}</p>

          {error && (
            <div
              style={{
                backgroundColor: '#fde8e8',
                color: '#9b1c1c',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                border: '1px solid #f8b4b4',
                lineHeight: '1.4',
                fontWeight: '500',
              }}
            >
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="name">{t('signup.nameLabel')}</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t('signup.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="contact">{t('signup.contactLabel')}</label>
            <input
              id="contact"
              name="tel"
              type="tel"
              autoComplete="tel"
              placeholder={t('signup.contactPlaceholder')}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className={styles.journalSubmit} disabled={loading}>
            {t('signup.submit')}
          </button>
        </form>
      </section>
    </div>
  )
}
