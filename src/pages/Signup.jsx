import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import styles from '../styles/scrapbook.module.css'

export default function Signup() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: wire to backend signup endpoint once it exists.
    // For now this just captures the values locally and moves on.
    console.log({ name, contact })
    navigate('/home')
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
        <form className={styles.journalPage} onSubmit={handleSubmit}>
          <div className={styles.journalTape}></div>
          <p className={styles.journalEyebrow}>{t('signup.eyebrow')}</p>
          <h3 className={styles.journalTitle}>{t('signup.title')}</h3>
          <p className={styles.journalSub}>{t('signup.sub')}</p>

          <div className={styles.field}>
            <label htmlFor="name">{t('signup.nameLabel')}</label>
            <input
              id="name"
              type="text"
              placeholder={t('signup.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="contact">{t('signup.contactLabel')}</label>
            <input
              id="contact"
              type="text"
              placeholder={t('signup.contactPlaceholder')}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.journalSubmit}>
            {t('signup.submit')}
          </button>
          <p className={styles.journalNote}>{t('signup.note')}</p>
        </form>
      </section>
    </div>
  )
}