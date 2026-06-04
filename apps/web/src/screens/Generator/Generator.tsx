import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  serialize,
  validate,
  WELL_KNOWN_NEVER_TOKENS,
  DEFAULT_NEVER_TOKENS,
  NEVER_TOKEN_PATTERN,
} from '@hireguard/core';
import type { Tier0, ValidationError } from '@hireguard/core';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import styles from './Generator.module.css';

function defaultExpires(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function lines(v: string): string[] {
  return v.split('\n').map(s => s.trim()).filter(Boolean);
}

export function Generator() {
  const { t } = useTranslation('generator');
  useDocumentTitle(t('sectionOutput'));

  // ── Form state ──
  const [canonicalDomains, setCanonicalDomains] = useState('');
  const [recruitingChannels, setRecruitingChannels] = useState('');
  const [applicationUrls, setApplicationUrls] = useState('');
  const [neverSet, setNeverSet] = useState<Set<string>>(new Set(DEFAULT_NEVER_TOKENS));
  const [customToken, setCustomToken] = useState('');
  const [verifyContact, setVerifyContact] = useState('');
  const [reportAbuse, setReportAbuse] = useState('');
  const [policy, setPolicy] = useState('');
  const [verifiedRecruiters, setVerifiedRecruiters] = useState('');
  const [expires, setExpires] = useState(defaultExpires);
  const [copied, setCopied] = useState(false);

  // ── Build Tier0 data ──
  const data: Tier0 = useMemo(() => {
    const cd = lines(canonicalDomains);
    const vr = lines(verifiedRecruiters);
    return {
      canonicalDomains: cd.length > 0 ? cd : [],
      recruitingChannels: lines(recruitingChannels),
      applicationUrls: lines(applicationUrls),
      never: [...neverSet],
      verifyContact: verifyContact.trim(),
      reportAbuse: reportAbuse.trim(),
      policy: policy.trim() || undefined,
      verifiedRecruiters: vr.length > 0 ? vr : undefined,
      expires: expires ? `${expires}T00:00:00Z` : '',
      lastUpdated: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    };
  }, [canonicalDomains, recruitingChannels, applicationUrls, neverSet, verifyContact, reportAbuse, policy, verifiedRecruiters, expires]);

  const output = useMemo(() => serialize(data), [data]);
  const errors = useMemo(() => validate(data).filter((e: ValidationError) => e.severity === 'error'), [data]);
  const isValid = errors.length === 0;

  // ── Chip toggle ──
  const toggleNever = useCallback((token: string) => {
    setNeverSet(prev => {
      const next = new Set(prev);
      if (next.has(token)) next.delete(token);
      else next.add(token);
      return next;
    });
  }, []);

  // ── Custom token add ──
  const addCustomToken = useCallback(() => {
    const token = customToken.trim().toLowerCase();
    if (token && NEVER_TOKEN_PATTERN.test(token) && !neverSet.has(token)) {
      setNeverSet(prev => new Set([...prev, token]));
      setCustomToken('');
    }
  }, [customToken, neverSet]);

  // ── Copy / Download ──
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* fallback: user selects manually */
    }
  }, [output]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hiring.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }, [output]);

  // ── Syntax highlighting ──
  const highlighted = useMemo(() => {
    return output.split('\n').map((line, i) => {
      if (line.startsWith('#')) {
        return <span key={i} className={styles.synComment}>{line}{'\n'}</span>;
      }
      const idx = line.indexOf(':');
      if (idx < 0) return <span key={i}>{line}{'\n'}</span>;
      return (
        <span key={i}>
          <span className={styles.synKey}>{line.slice(0, idx)}</span>
          <span className={styles.synComment}>:</span>
          <span className={styles.synVal}>{line.slice(idx + 1)}</span>
          {'\n'}
        </span>
      );
    });
  }, [output]);

  const host = lines(canonicalDomains)[0] || 'example.com';

  return (
    <div className="container">
      <header className={`${styles.header} rise rise-delay-1`}>
        <span className={styles.badge}>
          <span className={styles.dot} />
          {t('sectionOutput')}
        </span>
        <h1>
          hiring<span className="accent">.txt</span>
        </h1>
      </header>

      <div className={styles.grid}>
        {/* ── FORM ── */}
        <section className={`${styles.card} rise rise-delay-2`}>
          <h2>{t('sectionDefinition')}</h2>

          {/* Canonical Domains */}
          <div className={styles.field}>
            <label className="label">
              {t('canonicalDomains.label')} <span className={styles.req}>{t('required')}</span>
            </label>
            <textarea
              id="canonicalDomains"
              value={canonicalDomains}
              onChange={e => setCanonicalDomains(e.target.value)}
              placeholder={t('canonicalDomains.placeholder')}
              className={styles.textarea}
            />
            <p className="hint">{t('canonicalDomains.hint')}</p>
          </div>

          {/* Recruiting Channels */}
          <div className={styles.field}>
            <label className="label">
              {t('recruitingChannels.label')} <span className={styles.req}>{t('required')}</span>
            </label>
            <textarea
              id="recruitingChannels"
              value={recruitingChannels}
              onChange={e => setRecruitingChannels(e.target.value)}
              placeholder={t('recruitingChannels.placeholder')}
              className={styles.textarea}
            />
            <p className="hint">{t('recruitingChannels.hint')}</p>
          </div>

          {/* Application URLs */}
          <div className={styles.field}>
            <label className="label">
              {t('applicationUrls.label')} <span className={styles.req}>{t('required')}</span>
            </label>
            <textarea
              id="applicationUrls"
              value={applicationUrls}
              onChange={e => setApplicationUrls(e.target.value)}
              placeholder={t('applicationUrls.placeholder')}
              className={styles.textarea}
            />
            <p className="hint" dangerouslySetInnerHTML={{ __html: t('applicationUrls.hint') }} />
          </div>

          {/* Never Tokens */}
          <div className={styles.field}>
            <label className="label">
              {t('never.label')} <span className={styles.req}>{t('required')}</span>
            </label>
            <div className={styles.chips}>
              {WELL_KNOWN_NEVER_TOKENS.map(({ token }) => (
                <button
                  key={token}
                  type="button"
                  className={styles.chip}
                  aria-pressed={neverSet.has(token)}
                  onClick={() => toggleNever(token)}
                >
                  <span className={styles.chipIcon}>
                    {neverSet.has(token) ? '✓' : '+'}
                  </span>
                  {token}
                </button>
              ))}
              {/* Custom tokens that aren't well-known */}
              {[...neverSet].filter(t => !WELL_KNOWN_NEVER_TOKENS.some(wk => wk.token === t)).map(token => (
                <button
                  key={token}
                  type="button"
                  className={styles.chip}
                  aria-pressed={true}
                  onClick={() => toggleNever(token)}
                >
                  <span className={styles.chipIcon}>✓</span>
                  {token}
                </button>
              ))}
            </div>
            <p className="hint">{t('never.hint')}</p>

            {/* Custom token input */}
            <div className={styles.customToken}>
              <input
                type="text"
                value={customToken}
                onChange={e => setCustomToken(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder={t('never.customPlaceholder')}
                className={styles.input}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomToken())}
              />
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={addCustomToken}
                disabled={!customToken.trim() || !NEVER_TOKEN_PATTERN.test(customToken.trim())}
              >
                +
              </button>
            </div>
            <p className="hint">{t('never.customHint')}</p>
          </div>

          <h2 style={{ marginBlockStart: 26 }}>{t('sectionContact')}</h2>

          {/* Verify Contact */}
          <div className={styles.field}>
            <label className="label">
              {t('verifyContact.label')} <span className={styles.req}>{t('required')}</span>
            </label>
            <input
              id="verifyContact"
              type="text"
              value={verifyContact}
              onChange={e => setVerifyContact(e.target.value)}
              placeholder={t('verifyContact.placeholder')}
              className={styles.input}
            />
            <p className="hint" dangerouslySetInnerHTML={{ __html: t('verifyContact.hint') }} />
          </div>

          {/* Report Abuse */}
          <div className={styles.field}>
            <label className="label">
              {t('reportAbuse.label')} <span className={styles.req}>{t('required')}</span>
            </label>
            <input
              id="reportAbuse"
              type="text"
              value={reportAbuse}
              onChange={e => setReportAbuse(e.target.value)}
              placeholder={t('reportAbuse.placeholder')}
              className={styles.input}
            />
            <p className="hint">{t('reportAbuse.hint')}</p>
          </div>

          {/* Policy */}
          <div className={styles.field}>
            <label className="label">
              {t('policy.label')} <span className={styles.opt}>{t('optional')}</span>
            </label>
            <input
              id="policy"
              type="text"
              value={policy}
              onChange={e => setPolicy(e.target.value)}
              placeholder={t('policy.placeholder')}
              className={styles.input}
            />
          </div>

          {/* Verified Recruiters */}
          <div className={styles.field}>
            <label className="label">
              {t('verifiedRecruiters.label')} <span className={styles.opt}>{t('optional')}</span>
            </label>
            <textarea
              id="verifiedRecruiters"
              value={verifiedRecruiters}
              onChange={e => setVerifiedRecruiters(e.target.value)}
              placeholder={t('verifiedRecruiters.placeholder')}
              className={styles.textarea}
            />
            <p className="hint">{t('verifiedRecruiters.hint')}</p>
          </div>

          {/* Expires */}
          <div className={styles.field}>
            <label className="label">
              {t('expires.label')} <span className={styles.req}>{t('required')}</span>
            </label>
            <input
              id="expires"
              type="date"
              value={expires}
              onChange={e => setExpires(e.target.value)}
              className={styles.input}
            />
            <p className="hint">{t('expires.hint')}</p>
          </div>
        </section>

        {/* ── PREVIEW ── */}
        <section className={`${styles.card} ${styles.previewCard} rise rise-delay-3`}>
          <div className={styles.previewHead}>
            <h2 style={{ margin: 0 }}>{t('sectionOutput')}</h2>
            <span className={styles.path}>
              <strong className="accent">{host}</strong>/{t('pathPrefix')}
            </span>
          </div>

          <pre className={styles.codeBlock}>{highlighted}</pre>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleCopy}
              disabled={!isValid}
            >
              {copied ? t('btnCopied') : t('btnCopy')}
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleDownload}
              disabled={!isValid}
            >
              {t('btnDownload')}
            </button>
          </div>

          {/* Status */}
          <div className={`${styles.status} ${isValid ? styles.statusOk : styles.statusErr}`}>
            <span className={styles.statusIcon}>{isValid ? '✓' : '⚠'}</span>
            {isValid
              ? t('statusValid')
              : t('statusErrors', {
                  count: errors.length,
                  first: errors[0]?.message || '',
                  rest: errors.length - 1,
                })}
          </div>

          <div className={styles.foot} dangerouslySetInnerHTML={{ __html: t('footerNote') }} />
        </section>
      </div>
    </div>
  );
}
