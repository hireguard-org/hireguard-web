import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  verify,
  lookupCompany,
  type VerifyInput,
  type VerifyResult,
  type CompanyEntry,
  type VerifyStep,
} from '@hireguard/core';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import styles from './Verify.module.css';

type Phase = 'form' | 'loading' | 'result';

export function Verify() {
  const { t } = useTranslation('verify');
  useDocumentTitle(t('title'));
  const [phase, setPhase] = useState<Phase>('form');
  const [registry, setRegistry] = useState<CompanyEntry[]>([]);
  const [result, setResult] = useState<VerifyResult | null>(null);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [listingUrl, setListingUrl] = useState('');
  const [messageText, setMessageText] = useState('');
  const [authHeader, setAuthHeader] = useState('');
  const [canonicalDomain, setCanonicalDomain] = useState('');
  const [registryMatch, setRegistryMatch] = useState<CompanyEntry | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load company registry
  useEffect(() => {
    fetch('/data/companies.json')
      .then(r => r.json())
      .then(data => setRegistry(data.companies ?? []))
      .catch(() => {/* registry unavailable — non-critical */});
  }, []);

  // Live registry lookup when company name changes
  useEffect(() => {
    if (!companyName.trim() || registry.length === 0) {
      setRegistryMatch(null);
      return;
    }
    const match = lookupCompany(companyName, registry);
    setRegistryMatch(match);
  }, [companyName, registry]);

  const handleVerify = useCallback(async () => {
    setPhase('loading');

    const input: VerifyInput = {
      companyName: companyName.trim() || undefined,
      senderEmail: senderEmail.trim() || undefined,
      listingUrl: listingUrl.trim() || undefined,
      messageText: messageText.trim() || undefined,
      authHeader: authHeader.trim() || undefined,
      canonicalDomain: canonicalDomain.trim() || undefined,
    };

    const entry = registryMatch;
    const domain = entry?.canonicalDomains[0] ?? canonicalDomain.trim();

    // Try to fetch hiring.txt
    let hiringTxtRaw: string | null = null;
    if (domain) {
      try {
        const url = `https://${domain}/.well-known/hiring.txt`;
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) {
          hiringTxtRaw = await res.text();
        }
      } catch {
        // CORS blocked or network error — hiringTxtRaw stays null
      }
    }

    const verifyResult = verify(input, hiringTxtRaw, entry);
    setResult(verifyResult);
    setPhase('result');
  }, [companyName, senderEmail, listingUrl, messageText, authHeader, canonicalDomain, registryMatch]);

  const handleReset = useCallback(() => {
    setPhase('form');
    setResult(null);
    setCompanyName('');
    setSenderEmail('');
    setListingUrl('');
    setMessageText('');
    setAuthHeader('');
    setCanonicalDomain('');
    setRegistryMatch(null);
    setShowAdvanced(false);
  }, []);

  const canVerify = companyName.trim() || senderEmail.trim();

  return (
    <div className="container">
      <header className={`${styles.header} rise rise-delay-1`}>
        <h1>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </header>

      {phase === 'form' && (
        <div className={`${styles.formContainer} rise rise-delay-2`}>
          {/* Company Name */}
          <div className={styles.field}>
            <label className={styles.label}>
              {t('form.company.label')} <span className={styles.req}>{t('required')}</span>
            </label>
            <input
              className={styles.input}
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder={t('form.company.placeholder')}
            />
            <p className={styles.hint}>{t('form.company.hint')}</p>
            {companyName.trim() && (
              <div className={registryMatch ? styles.registryFound : styles.registryNotFound}>
                {registryMatch
                  ? `✓ ${t('registry.found')} — ${registryMatch.names[0]} (${registryMatch.canonicalDomains.join(', ')})`
                  : `⚠ ${t('registry.notFound')}`
                }
              </div>
            )}
          </div>

          {/* Canonical Domain — shown when not in registry */}
          {companyName.trim() && !registryMatch && (
            <div className={styles.field}>
              <label className={styles.label}>
                {t('form.canonicalDomain.label')} <span className={styles.req}>{t('required')}</span>
              </label>
              <input
                className={styles.input}
                value={canonicalDomain}
                onChange={e => setCanonicalDomain(e.target.value)}
                placeholder={t('form.canonicalDomain.placeholder')}
              />
              <p className={styles.hint}>{t('form.canonicalDomain.hint')}</p>
            </div>
          )}

          {/* Sender Email */}
          <div className={styles.field}>
            <label className={styles.label}>
              {t('form.senderEmail.label')} <span className={styles.req}>{t('required')}</span>
            </label>
            <input
              className={styles.input}
              type="email"
              value={senderEmail}
              onChange={e => setSenderEmail(e.target.value)}
              placeholder={t('form.senderEmail.placeholder')}
            />
            <p className={styles.hint}>{t('form.senderEmail.hint')}</p>
          </div>

          {/* Job Listing URL */}
          <div className={styles.field}>
            <label className={styles.label}>
              {t('form.listingUrl.label')} <span className={styles.opt}>{t('optional')}</span>
            </label>
            <input
              className={styles.input}
              type="url"
              value={listingUrl}
              onChange={e => setListingUrl(e.target.value)}
              placeholder={t('form.listingUrl.placeholder')}
            />
            <p className={styles.hint}>{t('form.listingUrl.hint')}</p>
          </div>

          {/* Advanced toggle */}
          <button
            className={styles.advancedToggle}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '−' : '+'} {t('form.messageText.label')} & {t('form.authHeader.label')}
          </button>

          {showAdvanced && (
            <>
              {/* Message Text */}
              <div className={styles.field}>
                <label className={styles.label}>
                  {t('form.messageText.label')} <span className={styles.opt}>{t('optional')}</span>
                </label>
                <textarea
                  className={styles.textarea}
                  rows={5}
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder={t('form.messageText.placeholder')}
                />
                <p className={styles.hint}>{t('form.messageText.hint')}</p>
              </div>

              {/* Auth Header */}
              <div className={styles.field}>
                <label className={styles.label}>
                  {t('form.authHeader.label')} <span className={styles.opt}>{t('optional')}</span>
                </label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={authHeader}
                  onChange={e => setAuthHeader(e.target.value)}
                  placeholder={t('form.authHeader.placeholder')}
                />
                <p className={styles.hint}>{t('form.authHeader.hint')}</p>
              </div>
            </>
          )}

          <button
            className={styles.btnVerify}
            disabled={!canVerify}
            onClick={handleVerify}
          >
            {t('btn.verify')}
          </button>
        </div>
      )}

      {phase === 'loading' && (
        <div className={`${styles.loadingContainer} rise`}>
          <div className={styles.spinner} />
          <p>{t('btn.verifying')}</p>
        </div>
      )}

      {phase === 'result' && result && (
        <div className={`${styles.resultContainer} rise`}>
          {/* Verdict badge */}
          <div className={`${styles.verdictBox} ${styles[`verdict${result.verdict}`]}`}>
            <span className={styles.verdictLabel}>
              {t(`result.verdict.${result.verdict}`)}
            </span>
            <p className={styles.verdictDesc}>
              {t(`result.verdictDesc.${result.verdict}`)}
            </p>
          </div>

          {/* Action recommendation */}
          <div className={styles.actionBox}>
            <h3>{t('result.actions')}</h3>
            <p>{t(`result.action_${result.verdict}`)}</p>
          </div>

          {/* Steps */}
          <section className={styles.stepsSection}>
            <h3>{t('result.steps')}</h3>
            <div className={styles.stepList}>
              {result.steps.map((step, i) => (
                <StepRow key={`${step.id}-${i}`} step={step} />
              ))}
            </div>
          </section>

          {/* Reasons */}
          {result.reasons.length > 0 && (
            <section className={styles.reasonsSection}>
              <h3>{t('result.reasons')}</h3>
              <ul className={styles.reasonList}>
                {result.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Email Auth */}
          {result.emailAuth && (
            <section className={styles.authSection}>
              <h3>{t('result.emailAuth')}</h3>
              <div className={styles.authGrid}>
                <AuthBadge label="DKIM" value={result.emailAuth.dkim} />
                <AuthBadge label="SPF" value={result.emailAuth.spf} />
                <AuthBadge label="DMARC" value={result.emailAuth.dmarc} />
              </div>
            </section>
          )}

          <button className={styles.btnReset} onClick={handleReset}>
            {t('btn.reset')}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function StepRow({ step }: { step: VerifyStep }) {
  const icon = {
    pass: '✓',
    fail: '✗',
    warn: '⚠',
    skip: '—',
    info: 'ℹ',
  }[step.status];

  return (
    <div className={`${styles.stepRow} ${styles[`step${step.status}`]}`}>
      <span className={styles.stepIcon}>{icon}</span>
      <div>
        <span className={styles.stepLabel}>{step.label}</span>
        {step.detail && <span className={styles.stepDetail}>{step.detail}</span>}
      </div>
    </div>
  );
}

function AuthBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${styles.authBadge} ${styles[`auth${value}`]}`}>
      <span className={styles.authLabel}>{label}</span>
      <span className={styles.authValue}>{value.toUpperCase()}</span>
    </div>
  );
}
