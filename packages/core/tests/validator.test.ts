import { describe, it, expect } from 'vitest';
import { validate, isValid } from '../src/validator';
import type { Tier0 } from '../src/types';

function validData(overrides: Partial<Tier0> = {}): Tier0 {
  return {
    canonicalDomains: ['acme.com'],
    recruitingChannels: ['https://careers.acme.com'],
    applicationUrls: ['https://careers.acme.com/apply'],
    never: ['payment'],
    verifyContact: 'mailto:verify@acme.com',
    reportAbuse: 'mailto:abuse@acme.com',
    expires: '2027-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('validator', () => {
  // ─── Valid Data ────────────────────────────────────────────────────

  it('should return no errors for valid data', () => {
    const errors = validate(validData());
    const blocking = errors.filter(e => e.severity === 'error');
    expect(blocking).toHaveLength(0);
  });

  it('isValid should return true for valid data', () => {
    expect(isValid(validData())).toBe(true);
  });

  // ─── Required Fields ──────────────────────────────────────────────

  it('should error on empty canonicalDomains', () => {
    const errors = validate(validData({ canonicalDomains: [] }));
    expect(errors.some(e => e.field === 'canonicalDomains' && e.severity === 'error')).toBe(true);
  });

  it('should error on empty recruitingChannels', () => {
    const errors = validate(validData({ recruitingChannels: [] }));
    expect(errors.some(e => e.field === 'recruitingChannels' && e.severity === 'error')).toBe(true);
  });

  it('should error on empty applicationUrls', () => {
    const errors = validate(validData({ applicationUrls: [] }));
    expect(errors.some(e => e.field === 'applicationUrls' && e.severity === 'error')).toBe(true);
  });

  it('should error on empty never', () => {
    const errors = validate(validData({ never: [] }));
    expect(errors.some(e => e.field === 'never' && e.severity === 'error')).toBe(true);
  });

  it('should error on missing verifyContact', () => {
    const errors = validate(validData({ verifyContact: '' }));
    expect(errors.some(e => e.field === 'verifyContact' && e.severity === 'error')).toBe(true);
  });

  it('should error on missing reportAbuse', () => {
    const errors = validate(validData({ reportAbuse: '' }));
    expect(errors.some(e => e.field === 'reportAbuse' && e.severity === 'error')).toBe(true);
  });

  it('should error on missing expires', () => {
    const errors = validate(validData({ expires: '' }));
    expect(errors.some(e => e.field === 'expires' && e.severity === 'error')).toBe(true);
  });

  // ─── Domain Validation ────────────────────────────────────────────

  it('should error on invalid domain format', () => {
    const errors = validate(validData({ canonicalDomains: ['not a domain'] }));
    expect(errors.some(e => e.field === 'canonicalDomains' && e.severity === 'error')).toBe(true);
  });

  it('should accept valid multi-level domains', () => {
    const errors = validate(validData({ canonicalDomains: ['sub.acme.co.uk'] }));
    const domainErrors = errors.filter(e => e.field === 'canonicalDomains' && e.severity === 'error');
    expect(domainErrors).toHaveLength(0);
  });

  it('should reject domain starting with hyphen', () => {
    const errors = validate(validData({ canonicalDomains: ['-acme.com'] }));
    expect(errors.some(e => e.field === 'canonicalDomains' && e.severity === 'error')).toBe(true);
  });

  // ─── HTTPS Validation ─────────────────────────────────────────────

  it('should error on HTTP recruiting channel (not HTTPS)', () => {
    const errors = validate(validData({ recruitingChannels: ['http://careers.acme.com'] }));
    expect(errors.some(e => e.field === 'recruitingChannels' && e.severity === 'error')).toBe(true);
  });

  it('should error on HTTP application URL', () => {
    const errors = validate(validData({ applicationUrls: ['http://careers.acme.com'] }));
    expect(errors.some(e => e.field === 'applicationUrls' && e.severity === 'error')).toBe(true);
  });

  it('should error on HTTP policy', () => {
    const errors = validate(validData({ policy: 'http://acme.com/policy' }));
    expect(errors.some(e => e.field === 'policy' && e.severity === 'error')).toBe(true);
  });

  it('should error on HTTP verified recruiter', () => {
    const errors = validate(validData({ verifiedRecruiters: ['http://linkedin.com/in/jane'] }));
    expect(errors.some(e => e.field === 'verifiedRecruiters' && e.severity === 'error')).toBe(true);
  });

  // ─── Contact URI Validation ────────────────────────────────────────

  it('should accept mailto: contact', () => {
    const errors = validate(validData({ verifyContact: 'mailto:hr@acme.com' }));
    const contactErrors = errors.filter(e => e.field === 'verifyContact' && e.severity === 'error');
    expect(contactErrors).toHaveLength(0);
  });

  it('should accept https: contact', () => {
    const errors = validate(validData({ verifyContact: 'https://acme.com/verify' }));
    const contactErrors = errors.filter(e => e.field === 'verifyContact' && e.severity === 'error');
    expect(contactErrors).toHaveLength(0);
  });

  it('should error on invalid contact URI', () => {
    const errors = validate(validData({ verifyContact: 'tel:+1234' }));
    expect(errors.some(e => e.field === 'verifyContact' && e.severity === 'error')).toBe(true);
  });

  // ─── Never Token Format (ADR-007) ─────────────────────────────────

  it('should accept valid kebab-case never tokens', () => {
    const errors = validate(validData({ never: ['payment', 'crypto', 'custom-token-123'] }));
    const neverErrors = errors.filter(e => e.field === 'never' && e.severity === 'error');
    expect(neverErrors).toHaveLength(0);
  });

  it('should error on uppercase never token', () => {
    const errors = validate(validData({ never: ['Payment'] }));
    expect(errors.some(e => e.field === 'never' && e.severity === 'error')).toBe(true);
  });

  it('should error on never token with spaces', () => {
    const errors = validate(validData({ never: ['no payment'] }));
    expect(errors.some(e => e.field === 'never' && e.severity === 'error')).toBe(true);
  });

  it('should error on never token starting with number', () => {
    const errors = validate(validData({ never: ['123-payment'] }));
    expect(errors.some(e => e.field === 'never' && e.severity === 'error')).toBe(true);
  });

  it('should error on never token ending with hyphen', () => {
    const errors = validate(validData({ never: ['payment-'] }));
    expect(errors.some(e => e.field === 'never' && e.severity === 'error')).toBe(true);
  });

  // ─── Expires Validation ────────────────────────────────────────────

  it('should warn on expired date (past)', () => {
    const errors = validate(validData({ expires: '2020-01-01T00:00:00Z' }));
    expect(errors.some(e => e.field === 'expires' && e.severity === 'warning')).toBe(true);
  });

  it('should not warn on future expires date', () => {
    const errors = validate(validData({ expires: '2099-01-01T00:00:00Z' }));
    const expiresWarnings = errors.filter(e => e.field === 'expires' && e.severity === 'warning');
    expect(expiresWarnings).toHaveLength(0);
  });

  it('should error on invalid date format', () => {
    const errors = validate(validData({ expires: 'not-a-date' }));
    expect(errors.some(e => e.field === 'expires' && e.severity === 'error')).toBe(true);
  });
});
