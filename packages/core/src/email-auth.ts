// ─── Email Authentication Parser ─────────────────────────────────────
// Parses pasted Authentication-Results email headers to extract
// DKIM, SPF, and DMARC status.

import type { EmailAuthResult } from './types';

/**
 * Parse an Authentication-Results header value and extract
 * DKIM, SPF, and DMARC verdicts.
 *
 * Example input:
 *   "mx.google.com; dkim=pass header.i=@acme.com; spf=pass smtp.mailfrom=acme.com; dmarc=pass"
 *
 * Also handles multi-line pasted headers where the user may include
 * the header name itself: "Authentication-Results: mx.google.com; ..."
 */
export function parseAuthenticationResults(headerValue: string): EmailAuthResult {
  // Strip the header name if pasted
  let value = headerValue;
  const headerPrefix = /^authentication-results:\s*/i;
  if (headerPrefix.test(value)) {
    value = value.replace(headerPrefix, '');
  }

  // Normalize whitespace (multi-line folding)
  value = value.replace(/\r?\n\s+/g, ' ').trim();

  const result: EmailAuthResult = {
    dkim: 'none',
    spf: 'none',
    dmarc: 'none',
    raw: headerValue,
  };

  // Extract DKIM result
  const dkimMatch = value.match(/\bdkim\s*=\s*(pass|fail|temperror|permerror|neutral|none|softfail|policy)\b/i);
  if (dkimMatch) {
    result.dkim = normalizeVerdict(dkimMatch[1]);
  }

  // Extract SPF result
  const spfMatch = value.match(/\bspf\s*=\s*(pass|fail|temperror|permerror|neutral|none|softfail)\b/i);
  if (spfMatch) {
    result.spf = normalizeVerdict(spfMatch[1]);
  }

  // Extract DMARC result
  const dmarcMatch = value.match(/\bdmarc\s*=\s*(pass|fail|temperror|permerror|none|bestguesspass)\b/i);
  if (dmarcMatch) {
    result.dmarc = normalizeVerdict(dmarcMatch[1]);
  }

  return result;
}

/**
 * Normalize various email auth verdicts to pass/fail/none.
 */
function normalizeVerdict(raw: string): 'pass' | 'fail' | 'none' {
  const lower = raw.toLowerCase();
  if (lower === 'pass' || lower === 'bestguesspass') return 'pass';
  if (['fail', 'softfail', 'permerror', 'policy'].includes(lower)) return 'fail';
  return 'none';
}
