import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useAssessment } from '../context/AssessmentContext'
import { api } from '../services/api'
import styles from '../styles/scrapbook.module.css'

const SAVED_PROFILES_KEY = 'hercycle_saved_profiles'

export default function Login() {
  const { t, language } = useLanguage()
  const { saveAuth, logout } = useAuth()
  const { loadHistoricalAnswers } = useAssessment()
  const navigate = useNavigate()

  // Always initialize empty
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [savedProfiles, setSavedProfiles] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const dropdownRef = useRef(null)

  // 1. Load profiles stored locally
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_PROFILES_KEY)
      if (stored) {
        setSavedProfiles(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 2. When user clicks on a suggested name from the pop-up
  function handleSelectProfile(profile) {
    setName(profile.name)
    setContact(profile.contact) // Instantly autofills both fields
    setShowSuggestions(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const cleanName = name.trim()
    const cleanContact = contact.trim()

    if (!cleanName || !cleanContact) {
      setError(
        language === 'sw'
          ? 'Tafadhali weka jina lako na nambari ya simu.'
          : 'Please enter both your name and phone number.'
      )
      return
    }

    setLoading(true)

    try {
      const data = await api.login({
        fullName: cleanName,
        phoneNumber: cleanContact,
      })

      if (!data || !data.token) {
        throw new Error('Invalid credentials')
      }

      // Save valid login to suggestions cache
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

      if (
        data.latestAssessment?.raw_questionnaire_data &&
        typeof loadHistoricalAnswers === 'function'
      ) {
        loadHistoricalAnswers(data.latestAssessment.raw_questionnaire_data)
      }

      saveAuth(data.user, data.token, data.latestAssessment)
      navigate('/home')
    } catch (err) {
      logout()
      setError('Invalid credentials')
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
          ← {t('login.back')}
        </Link>
      </header>

      <section className={styles.signupSection}>
        <form className={styles.journalPage} onSubmit={handleSubmit} autoComplete="off">
          <div className={styles.journalTape}></div>
          <p className={styles.journalEyebrow}>{t('login.eyebrow')}</p>
          <h3 className={styles.journalTitle}>{t('login.title')}</h3>
          <p className={styles.journalSub}>{t('login.sub')}</p>

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

          {/* NAME FIELD WITH POP-UP SUGGESTIONS */}
          <div className={styles.field} style={{ position: 'relative' }} ref={dropdownRef}>
            <label htmlFor="hc-login-patient-name">{t('login.nameLabel')}</label>
            <input
              id="hc-login-patient-name"
              name="hc_custom_auth_field_name"
              type="text"
              autoComplete="new-password"
              placeholder={t('login.namePlaceholder')}
              value={name}
              onFocus={() => {
                if (savedProfiles.length > 0) setShowSuggestions(true)
              }}
              onChange={(e) => {
                setName(e.target.value)
                setShowSuggestions(true)
              }}
              disabled={loading}
              required
            />

            {/* FLOATING SUGGESTION MENU */}
            {showSuggestions && savedProfiles.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  zIndex: 50,
                  marginTop: '4px',
                  overflow: 'hidden',
                }}
              >
                {savedProfiles
                  .filter((p) => p.name.toLowerCase().includes(name.toLowerCase()))
                  .map((profile, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectProfile(profile)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: idx === savedProfiles.length - 1 ? 'none' : '1px solid #f3f4f6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#374151',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <span style={{ fontWeight: '600' }}>{profile.name}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{profile.contact}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* CONTACT FIELD */}
          <div className={styles.field}>
            <label htmlFor="hc-login-patient-contact">{t('login.contactLabel')}</label>
            <input
              id="hc-login-patient-contact"
              name="hc_custom_auth_field_tel"
              type="tel"
              autoComplete="new-password"
              placeholder={t('login.contactPlaceholder')}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className={styles.journalSubmit} disabled={loading}>
            {loading ? (t('login.loading') || 'Please wait...') : t('login.submit')}
          </button>

          <p className={styles.journalNote}>
            {t('login.switchPrompt')}{' '}
            <Link to="/signup" className={styles.journalLink}>
              {t('login.switchAction')}
            </Link>
          </p>
        </form>
      </section>
    </div>
  )
}