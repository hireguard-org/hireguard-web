// ─── hiring.txt Validator ────────────────────────────────────────────
// Validates a Tier0 object against schema rules.
// Used by both the generator (pre-serialize check) and verifier (post-parse check).

import type { Tier0, ValidationError } from './types';
import {
  DOMAIN_PATTERN,
  HTTPS_PATTERN,
  CONTACT_PATTERN,
  NEVER_TOKEN_PATTERN,
} from './constants';

/**
 * Validate a Tier0 data model.
 * Returns an empty array if all rules pass.
 */
export function validate(data: Tier0): ValidationError[] {
  const errors: ValidationError[] = [];

  // ── Required fields ──
  if (!data.canonicalDomains || data.canonicalDomains.length === 0) {
    errors.push({ field: 'canonicalDomains', message: 'At least one canonical domain is required', severity: 'error' });
  }

  if (!data.recruitingChannels || data.recruitingChannels.length === 0) {
    errors.push({ field: 'recruitingChannels', message: 'At least one recruiting channel is required', severity: 'error' });
  }

  if (!data.applicationUrls || data.applicationUrls.length === 0) {
    errors.push({ field: 'applicationUrls', message: 'At least one application URL is required', severity: 'error' });
  }

  if (!data.never || data.never.length === 0) {
    errors.push({ field: 'never', message: 'At least one Never assertion is required', severity: 'error' });
  }

  if (!data.verifyContact) {
    errors.push({ field: 'verifyContact', message: 'Verify contact is required', severity: 'error' });
  }

  if (!data.reportAbuse) {
    errors.push({ field: 'reportAbuse', message: 'Report abuse contact is required', severity: 'error' });
  }

  if (!data.expires) {
    errors.push({ field: 'expires', message: 'Expiration date is required', severity: 'error' });
  }

  // ── Format validation ──

  // Canonical domains: must be valid hostnames
  if (data.canonicalDomains) {
    for (const domain of data.canonicalDomains) {
      if (!DOMAIN_PATTERN.test(domain)) {
        errors.push({ field: 'canonicalDomains', message: `Invalid domain format: "${domain}"`, severity: 'error' });
      }
    }
  }

  // Recruiting channels: HTTPS only
  if (data.recruitingChannels) {
    for (const url of data.recruitingChannels) {
      if (!HTTPS_PATTERN.test(url)) {
        errors.push({ field: 'recruitingChannels', message: `Must be HTTPS: "${url}"`, severity: 'error' });
      }
    }
  }

  // Application URLs: HTTPS only
  if (data.applicationUrls) {
    for (const url of data.applicationUrls) {
      if (!HTTPS_PATTERN.test(url)) {
        errors.push({ field: 'applicationUrls', message: `Must be HTTPS: "${url}"`, severity: 'error' });
      }
    }
  }

  // Never tokens: kebab-case format
  if (data.never) {
    for (const token of data.never) {
      if (!NEVER_TOKEN_PATTERN.test(token)) {
        errors.push({ field: 'never', message: `Invalid token format: "${token}" (must be kebab-case)`, severity: 'error' });
      }
    }
  }

  // Verify contact: mailto: or https://
  if (data.verifyContact && !CONTACT_PATTERN.test(data.verifyContact)) {
    errors.push({ field: 'verifyContact', message: 'Must be mailto: or https:// URI', severity: 'error' });
  }

  // Report abuse: mailto: or https://
  if (data.reportAbuse && !CONTACT_PATTERN.test(data.reportAbuse)) {
    errors.push({ field: 'reportAbuse', message: 'Must be mailto: or https:// URI', severity: 'error' });
  }

  // Policy: HTTPS if provided
  if (data.policy && !HTTPS_PATTERN.test(data.policy)) {
    errors.push({ field: 'policy', message: 'Must be HTTPS', severity: 'error' });
  }

  // Verified recruiters: HTTPS if provided
  if (data.verifiedRecruiters) {
    for (const url of data.verifiedRecruiters) {
      if (!HTTPS_PATTERN.test(url)) {
        errors.push({ field: 'verifiedRecruiters', message: `Must be HTTPS: "${url}"`, severity: 'error' });
      }
    }
  }

  // Expires: valid ISO date-time
  if (data.expires) {
    const expiresDate = new Date(data.expires);
    if (isNaN(expiresDate.getTime())) {
      errors.push({ field: 'expires', message: 'Invalid date-time format', severity: 'error' });
    }
  }

  // ── Warnings ──

  // Expires in the past
  if (data.expires) {
    const expiresDate = new Date(data.expires);
    if (!isNaN(expiresDate.getTime()) && expiresDate < new Date()) {
      errors.push({ field: 'expires', message: 'Expiration date is in the past', severity: 'warning' });
    }
  }

  return errors;
}

/**
 * Check if a Tier0 object has any blocking errors (severity: 'error').
 */
export function isValid(data: Tier0): boolean {
  return validate(data).filter(e => e.severity === 'error').length === 0;
}
