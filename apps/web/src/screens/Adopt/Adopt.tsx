import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import styles from './Adopt.module.css';
import { useState } from 'react';

const SERVER_TABS = ['nginx', 'apache', 'caddy', 'staticHost'] as const;
type ServerTab = typeof SERVER_TABS[number];

export function Adopt() {
  const { t } = useTranslation('adopt');
  const { lang } = useParams<{ lang: string }>();
  const [activeTab, setActiveTab] = useState<ServerTab>('nginx');
  useDocumentTitle(t('title'));

  return (
    <div className="container">
      <header className={`${styles.header} rise rise-delay-1`}>
        <h1>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </header>

      {/* ── Step 1: Generate ── */}
      <section className={`${styles.step} rise rise-delay-2`}>
        <div className={styles.stepHead}>
          <span className={styles.stepNum}>{t('step1.num')}</span>
          <h2 className={styles.stepTitle}>{t('step1.title')}</h2>
        </div>
        <p className={styles.stepDesc} dangerouslySetInnerHTML={{ __html: t('step1.desc') }} />
        <Link to={`/${lang}/generator`} className={styles.btnPrimary}>
          {t('step1.cta')}
        </Link>
      </section>

      {/* ── Step 2: Deploy ── */}
      <section className={`${styles.step} rise rise-delay-3`}>
        <div className={styles.stepHead}>
          <span className={styles.stepNum}>{t('step2.num')}</span>
          <h2 className={styles.stepTitle}>{t('step2.title')}</h2>
        </div>
        <p className={styles.stepDesc} dangerouslySetInnerHTML={{ __html: t('step2.desc') }} />

        {/* Server config tabs */}
        <div className={styles.tabs}>
          {SERVER_TABS.map((tab) => (
            <button
              key={tab}
              className={styles.tab}
              aria-pressed={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {t(`step2.${tab}`)}
            </button>
          ))}
        </div>
        <pre className={styles.codeBlock}>{t(`step2.${activeTab}Config`)}</pre>
      </section>

      {/* ── Step 3: Verify & Announce ── */}
      <section className={`${styles.step} rise rise-delay-4`}>
        <div className={styles.stepHead}>
          <span className={styles.stepNum}>{t('step3.num')}</span>
          <h2 className={styles.stepTitle}>{t('step3.title')}</h2>
        </div>
        <p className={styles.stepDesc} dangerouslySetInnerHTML={{ __html: t('step3.desc') }} />

        <div className={styles.checklist}>
          {(['check1', 'check2', 'check3', 'check4', 'check5'] as const).map((key) => (
            <label key={key} className={styles.checkItem}>
              <span className={styles.checkIcon}>◻</span>
              <span dangerouslySetInnerHTML={{ __html: t(`step3.${key}`) }} />
            </label>
          ))}
        </div>

        <p className={styles.announce}>{t('step3.announce')}</p>
      </section>

      {/* ── Maintenance ── */}
      <section className={`${styles.section} rise`}>
        <h2>{t('maintenance.title')}</h2>
        <p className={styles.intro}>{t('maintenance.desc')}</p>
        <ul className={styles.ruleList}>
          {(['rule1', 'rule2', 'rule3', 'rule4'] as const).map((key) => (
            <li key={key} className={styles.ruleItem}>{t(`maintenance.${key}`)}</li>
          ))}
        </ul>
      </section>

      {/* ── FAQ ── */}
      <section className={`${styles.section} rise`}>
        <h2>{t('faq.title')}</h2>
        <div className={styles.faqList}>
          {(['q1', 'q2', 'q3', 'q4'] as const).map((key) => (
            <details key={key} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>{t(`faq.${key}`)}</summary>
              <p className={styles.faqAnswer}>{t(`faq.a${key.slice(1)}`)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
