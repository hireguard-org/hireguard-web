import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import styles from './Landing.module.css';

export function Landing() {
  const { t } = useTranslation('landing');
  const { lang } = useParams<{ lang: string }>();
  useDocumentTitle(t('title'));

  return (
    <div className="container">
      {/* ── Hero ── */}
      <section className={`${styles.hero} rise rise-delay-1`}>
        <span className={styles.badge}>
          <span className={styles.dot} />
          {t('badge')}
        </span>

        <h1 className={styles.title}>
          {t('title')}<span className="accent">{t('titleAccent')}</span>
        </h1>

        <p className={styles.subtitle}>{t('subtitle')}</p>

        <div className={styles.ctas}>
          <Link to={`/${lang}/generator`} className={styles.btnPrimary}>
            {t('ctaGenerate')}
          </Link>
          <Link to={`/${lang}/verify`} className={styles.btnSecondary}>
            {t('ctaVerify')}
          </Link>
        </div>
      </section>

      {/* ── What is hiring.txt ── */}
      <section className={`${styles.section} rise rise-delay-2`}>
        <h2>{t('whatIs.title')}</h2>
        <div className={styles.explanationCard}>
          <pre className={styles.exampleCode}>
            <span className={styles.synComment}># https://acme.com/.well-known/hiring.txt</span>{'\n'}
            <span className={styles.synKey}>Canonical-Domains</span><span className={styles.synComment}>:</span> acme.com, careers.acme.com{'\n'}
            <span className={styles.synKey}>Recruiting-Channels</span><span className={styles.synComment}>:</span> https://linkedin.com/company/acme{'\n'}
            <span className={styles.synKey}>Application-URLs</span><span className={styles.synComment}>:</span> https://careers.acme.com/jobs{'\n'}
            <span className={styles.synKey}>Never</span><span className={styles.synComment}>:</span> payment, crypto, gift-cards{'\n'}
            <span className={styles.synKey}>Verify-Contact</span><span className={styles.synComment}>:</span> mailto:verify@acme.com{'\n'}
            <span className={styles.synKey}>Expires</span><span className={styles.synComment}>:</span> 2027-06-01T00:00:00Z
          </pre>
          <p
            className={styles.explanationText}
            dangerouslySetInnerHTML={{ __html: t('whatIs.description') }}
          />
        </div>
      </section>

      {/* ── Problem ── */}
      <section className={`${styles.section} rise rise-delay-3`}>
        <h2>{t('problem.title')}</h2>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{t('problem.stat1')}</span>
            <span className={styles.statLabel}>{t('problem.stat1Label')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{t('problem.stat2')}</span>
            <span className={styles.statLabel}>{t('problem.stat2Label')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{t('problem.stat3')}</span>
            <span className={styles.statLabel}>{t('problem.stat3Label')}</span>
          </div>
        </div>
        <p className={styles.sectionDesc}>{t('problem.description')}</p>
      </section>

      {/* ── Solution ── */}
      <section className={`${styles.section} rise rise-delay-4`}>
        <h2>{t('solution.title')}</h2>
        <div className={styles.steps}>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>01</span>
            <h3 className={styles.stepTitle}>{t('solution.step1Title')}</h3>
            <p className={styles.stepDesc}>{t('solution.step1Desc')}</p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>02</span>
            <h3 className={styles.stepTitle}>{t('solution.step2Title')}</h3>
            <p className={styles.stepDesc}>{t('solution.step2Desc')}</p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>03</span>
            <h3 className={styles.stepTitle}>{t('solution.step3Title')}</h3>
            <p className={styles.stepDesc}>{t('solution.step3Desc')}</p>
          </div>
        </div>
      </section>

      {/* ── Open Protocol ── */}
      <section className={`${styles.section} ${styles.openProto} rise`}>
        <h2>{t('openProtocol.title')}</h2>
        <p className={styles.sectionDesc}>{t('openProtocol.description')}</p>
        <Link to={`/${lang}/spec`} className={styles.btnSecondary} style={{ alignSelf: 'flex-start' }}>
          Read the Spec →
        </Link>
      </section>
    </div>
  );
}
