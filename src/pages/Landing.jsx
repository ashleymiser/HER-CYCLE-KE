import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import styles from '../styles/scrapbook.module.css'

const SYMPTOM_KEYS = ['periods', 'acne', 'weight', 'hair']
const FEATURE_ITEMS = [
  { key: 'learn', icon: '📖' },
  { key: 'screen', icon: '✓' },
  { key: 'pharmacy', icon: '💊' },
  { key: 'guardian', icon: '👪' },
]

export default function Landing() {
  const { t } = useLanguage()

  return (
    <>
      <div className={styles.grain}></div>
      <header className={styles.landingHeader}>
        <Link to="/landing" className={styles.logo}>
          Her<span>Cycle</span> Kenya
        </Link>
        <div className={styles.navRight}>
          <LanguageSwitcher />
          <Link to="/signup" className={styles.navCta}>
            {t('landing.nav.signUp')}
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <span className={styles.heroTape}>{t('landing.hero.tape')}</span>
        <h1 className={styles.heroTitle}>
          {t('landing.hero.titleLine1')}
          <br />
          <em>{t('landing.hero.titleEm')}</em>
        </h1>
        <p className={styles.heroSub}>{t('landing.hero.sub')}</p>
        <div className={styles.heroActions}>
          <Link to="/signup" className={styles.btnPrimary}>
            {t('landing.hero.ctaPrimary')}
          </Link>
          <a href="#learn" className={styles.btnGhost}>
            {t('landing.hero.ctaGhost')}
          </a>
        </div>
      </section>

      <section className={styles.corkboard} id="learn">
        <h2 className={styles.corkboardHeading}>{t('landing.corkboard.heading')}</h2>

        <div className={styles.spread}>
          {/* Tile A: What is PCOS */}
          <div className={`${styles.tornCard} ${styles.tornCardA}`}>
            <div className={`${styles.tape} ${styles.tapeSage}`}></div>
            <p className={styles.cardEyebrow}>{t('landing.pcosCard.eyebrow')}</p>
            <h3 className={styles.cardTitle}>{t('landing.pcosCard.title')}</h3>
            <p className={styles.cardBody}>{t('landing.pcosCard.body')}</p>

            <div className={styles.statCallout}>
              <span className={styles.statNum}>{t('landing.pcosCard.statNum')}</span>
              <span className={styles.statLabel}>{t('landing.pcosCard.statLabel')}</span>
            </div>

            <div className={styles.stickyGrid}>
              {SYMPTOM_KEYS.map((key) => (
                <div key={key} className={styles.sticky}>
                  {t(`landing.symptoms.${key}`)}
                </div>
              ))}
            </div>
          </div>

          {/* Tile B: About HerCycle */}
          <div className={`${styles.tornCard} ${styles.tornCardB}`}>
            <div className={`${styles.tape} ${styles.tapeAmber}`}></div>
            <p className={styles.cardEyebrow}>{t('landing.aboutCard.eyebrow')}</p>
            <h3 className={styles.cardTitle}>{t('landing.aboutCard.title')}</h3>
            <p className={styles.cardBody}>{t('landing.aboutCard.body')}</p>

            <div className={styles.featurePolaroids}>
              {FEATURE_ITEMS.map(({ key, icon }) => (
                <div key={key} className={styles.polaroid}>
                  <div className={styles.polaroidIcon}>{icon}</div>
                  <div className={styles.polaroidCap}>{t(`landing.features.${key}`)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.quoteStrip}>
        <div className={styles.receipt}>{t('landing.quote')}</div>
      </section>

      <section className={styles.ctaBand}>
        <h2>{t('landing.ctaBand.title')}</h2>
        <p>{t('landing.ctaBand.body')}</p>
        <Link to="/signup" className={styles.btnPrimary}>
          {t('landing.ctaBand.cta')}
        </Link>
      </section>

      <footer className={styles.pageFooter}>{t('landing.footer')}</footer>
    </>
  )
}