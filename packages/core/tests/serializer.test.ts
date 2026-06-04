import { describe, it, expect } from 'vitest';
import { serialize } from '../src/serializer';
import { parse } from '../src/parser';
import type { Tier0 } from '../src/types';

const FULL_DATA: Tier0 = {
  canonicalDomains: ['acme.com', 'careers.acme.com'],
  recruitingChannels: [
    'https://www.linkedin.com/company/acme',
    'https://careers.acme.com',
  ],
  applicationUrls: ['https://careers.acme.com/jobs'],
  never: ['payment', 'crypto', 'gift-cards', 'personal-email', 'id-before-offer'],
  verifyContact: 'mailto:verify@acme.com',
  reportAbuse: 'mailto:abuse@acme.com',
  policy: 'https://www.acme.com/recruiting-policy',
  verifiedRecruiters: [
    'https://www.linkedin.com/in/jane-doe',
    'https://www.linkedin.com/in/john-smith',
  ],
  expires: '2027-06-01T00:00:00Z',
  lastUpdated: '2026-06-04T00:00:00Z',
};

describe('serializer', () => {
  it('should produce valid wire format', () => {
    const output = serialize(FULL_DATA);

    // Should start with comment
    expect(output.startsWith('#')).toBe(true);

    // Should contain all required fields
    expect(output).toContain('Canonical-Domains: acme.com, careers.acme.com');
    expect(output).toContain('Recruiting-Channels: https://www.linkedin.com/company/acme');
    expect(output).toContain('Recruiting-Channels: https://careers.acme.com');
    expect(output).toContain('Application-URLs: https://careers.acme.com/jobs');
    expect(output).toContain('Never: payment, crypto, gift-cards, personal-email, id-before-offer');
    expect(output).toContain('Verify-Contact: mailto:verify@acme.com');
    expect(output).toContain('Report-Abuse: mailto:abuse@acme.com');
    expect(output).toContain('Policy: https://www.acme.com/recruiting-policy');
    expect(output).toContain('Verified-Recruiters: https://www.linkedin.com/in/jane-doe');
    expect(output).toContain('Verified-Recruiters: https://www.linkedin.com/in/john-smith');
    expect(output).toContain('Expires: 2027-06-01T00:00:00Z');
    expect(output).toContain('Last-Updated: 2026-06-04T00:00:00Z');
  });

  it('should use comma-separated for Canonical-Domains (comma-safe)', () => {
    const output = serialize(FULL_DATA);
    // Should be a single line with commas, not repeated keys
    const cdLines = output.split('\n').filter(l => l.startsWith('Canonical-Domains:'));
    expect(cdLines).toHaveLength(1);
    expect(cdLines[0]).toContain(', ');
  });

  it('should use repeated keys for Recruiting-Channels (not comma-safe)', () => {
    const output = serialize(FULL_DATA);
    const rcLines = output.split('\n').filter(l => l.startsWith('Recruiting-Channels:'));
    expect(rcLines).toHaveLength(2);
  });

  it('should use repeated keys for Verified-Recruiters (not comma-safe)', () => {
    const output = serialize(FULL_DATA);
    const vrLines = output.split('\n').filter(l => l.startsWith('Verified-Recruiters:'));
    expect(vrLines).toHaveLength(2);
  });

  it('should omit optional fields when undefined', () => {
    const minimal: Tier0 = {
      canonicalDomains: ['acme.com'],
      recruitingChannels: ['https://careers.acme.com'],
      applicationUrls: ['https://careers.acme.com/apply'],
      never: ['payment'],
      verifyContact: 'mailto:v@acme.com',
      reportAbuse: 'mailto:a@acme.com',
      expires: '2027-01-01T00:00:00Z',
    };

    const output = serialize(minimal);
    expect(output).not.toContain('Policy:');
    expect(output).not.toContain('Verified-Recruiters:');
  });

  it('should auto-set Last-Updated when not provided', () => {
    const minimal: Tier0 = {
      canonicalDomains: ['acme.com'],
      recruitingChannels: ['https://careers.acme.com'],
      applicationUrls: ['https://careers.acme.com/apply'],
      never: ['payment'],
      verifyContact: 'mailto:v@acme.com',
      reportAbuse: 'mailto:a@acme.com',
      expires: '2027-01-01T00:00:00Z',
    };

    const output = serialize(minimal);
    expect(output).toContain('Last-Updated:');
  });

  it('should end with a newline', () => {
    const output = serialize(FULL_DATA);
    expect(output.endsWith('\n')).toBe(true);
  });

  // ─── Round-trip ────────────────────────────────────────────────────

  it('should round-trip: serialize → parse → equal data', () => {
    const output = serialize(FULL_DATA);
    const result = parse(output);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.canonicalDomains).toEqual(FULL_DATA.canonicalDomains);
      expect(result.data.recruitingChannels).toEqual(FULL_DATA.recruitingChannels);
      expect(result.data.applicationUrls).toEqual(FULL_DATA.applicationUrls);
      expect(result.data.never).toEqual(FULL_DATA.never);
      expect(result.data.verifyContact).toBe(FULL_DATA.verifyContact);
      expect(result.data.reportAbuse).toBe(FULL_DATA.reportAbuse);
      expect(result.data.policy).toBe(FULL_DATA.policy);
      expect(result.data.verifiedRecruiters).toEqual(FULL_DATA.verifiedRecruiters);
      expect(result.data.expires).toBe(FULL_DATA.expires);
      expect(result.data.lastUpdated).toBe(FULL_DATA.lastUpdated);
    }
  });
});
