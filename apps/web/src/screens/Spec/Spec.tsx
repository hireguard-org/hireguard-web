import { useTranslation } from 'react-i18next';
import { WELL_KNOWN_NEVER_TOKENS } from '@hireguard/core';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import styles from './Spec.module.css';

export function Spec() {
  const { t } = useTranslation('spec');
  useDocumentTitle(t('title'));

  const requiredFields = [
    'canonicalDomains',
    'recruitingChannels',
    'applicationUrls',
    'never',
    'verifyContact',
    'reportAbuse',
    'expires',
  ] as const;

  const optionalFields = [
    'policy',
    'verifiedRecruiters',
    'lastUpdated',
  ] as const;

  return (
    <div className="container">
      <header className={`${styles.header} rise rise-delay-1`}>
        <h1>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </header>

      {/* ── Overview ── */}
      <section className={`${styles.section} rise rise-delay-2`}>
        <h2>{t('overview.title')}</h2>
        <div className={styles.prose}>
          <p dangerouslySetInnerHTML={{ __html: t('overview.p1') }} />
          <p>{t('overview.p2')}</p>
        </div>
      </section>

      {/* ── Wire Format ── */}
      <section className={`${styles.section} rise rise-delay-3`}>
        <h2>{t('format.title')}</h2>
        <p className={styles.intro}>{t('format.p1')}</p>

        <div className={styles.rules}>
          {(['rule1', 'rule2', 'rule3', 'rule4', 'rule5'] as const).map((rule, i) => (
            <div key={rule} className={styles.ruleCard}>
              <span className={styles.ruleNum}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={styles.ruleTitle}>{t(`format.${rule}Title`)}</h3>
              <p dangerouslySetInnerHTML={{ __html: t(`format.${rule}`) }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Fields ── */}
      <section className={`${styles.section} rise`}>
        <h2>{t('fields.title')}</h2>

        <h3 className={styles.fieldGroupTitle}>
          <span className={styles.reqDot} />
          {t('fields.required')}
        </h3>
        <div className={styles.fieldList}>
          {requiredFields.map((f) => (
            <div key={f} className={styles.fieldCard}>
              <code className={styles.fieldName}>{t(`fields.${f}.name`)}</code>
              <p className={styles.fieldDesc} dangerouslySetInnerHTML={{ __html: t(`fields.${f}.desc`) }} />
              <pre className={styles.fieldExample}>{t(`fields.${f}.example`)}</pre>
            </div>
          ))}
        </div>

        <h3 className={styles.fieldGroupTitle} style={{ marginBlockStart: 28 }}>
          <span className={styles.optDot} />
          {t('fields.optional')}
        </h3>
        <div className={styles.fieldList}>
          {optionalFields.map((f) => (
            <div key={f} className={styles.fieldCard}>
              <code className={styles.fieldName}>{t(`fields.${f}.name`)}</code>
              <p className={styles.fieldDesc} dangerouslySetInnerHTML={{ __html: t(`fields.${f}.desc`) }} />
              <pre className={styles.fieldExample}>{t(`fields.${f}.example`)}</pre>
            </div>
          ))}
        </div>
      </section>

      {/* ── Never Tokens ── */}
      <section className={`${styles.section} rise`}>
        <h2>{t('neverTokens.title')}</h2>
        <p className={styles.intro}>{t('neverTokens.description')}</p>
        <div className={styles.tokenList}>
          {WELL_KNOWN_NEVER_TOKENS.map(({ token }) => (
            <div key={token} className={styles.tokenCard}>
              <code className={styles.tokenName}>{token}</code>
              <p>{t(`neverTokens.${token}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Verdicts ── */}
      <section className={`${styles.section} rise`}>
        <h2>{t('verdicts.title')}</h2>
        <p className={styles.intro}>{t('verdicts.description')}</p>
        <div className={styles.verdicts}>
          <div className={`${styles.verdictCard} ${styles.verdictVerified}`}>
            <span className={styles.verdictBadge}>{t('verdicts.verified')}</span>
            <p dangerouslySetInnerHTML={{ __html: t('verdicts.verifiedDesc') }} />
          </div>
          <div className={`${styles.verdictCard} ${styles.verdictUnknown}`}>
            <span className={styles.verdictBadge}>{t('verdicts.unknown')}</span>
            <p dangerouslySetInnerHTML={{ __html: t('verdicts.unknownDesc') }} />
          </div>
          <div className={`${styles.verdictCard} ${styles.verdictSuspicious}`}>
            <span className={styles.verdictBadge}>{t('verdicts.suspicious')}</span>
            <p dangerouslySetInnerHTML={{ __html: t('verdicts.suspiciousDesc') }} />
          </div>
        </div>
      </section>

      {/* ── CORS ── */}
      <section className={`${styles.section} rise`}>
        <h2>{t('cors.title')}</h2>
        <p className={styles.intro} dangerouslySetInnerHTML={{ __html: t('cors.description') }} />
        <pre className={styles.codeBlock}>Access-Control-Allow-Origin: *</pre>
        <p className={styles.note}>{t('cors.note')}</p>
      </section>
    </div>
  );
}
