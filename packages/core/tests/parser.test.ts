import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser';

describe('parser', () => {
  // ─── Comment Handling (ADR-001) ────────────────────────────────────

  describe('comments', () => {
    it('should discard lines starting with #', () => {
      const input = `# This is a comment
Canonical-Domains: acme.com
# Another comment
Recruiting-Channels: https://linkedin.com/company/acme
Application-URLs: https://careers.acme.com
Never: payment
Verify-Contact: mailto:verify@acme.com
Report-Abuse: mailto:abuse@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.canonicalDomains).toEqual(['acme.com']);
      }
    });

    it('should discard lines starting with # after leading whitespace', () => {
      const input = `  # Indented comment
Canonical-Domains: acme.com
Recruiting-Channels: https://careers.acme.com
Application-URLs: https://careers.acme.com/apply
Never: payment
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
    });

    it('should preserve inline # in URL values (fragments)', () => {
      const input = `Canonical-Domains: acme.com
Recruiting-Channels: https://careers.acme.com/jobs#section
Application-URLs: https://careers.acme.com/apply#form
Never: payment
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.recruitingChannels).toEqual(['https://careers.acme.com/jobs#section']);
        expect(result.data.applicationUrls).toEqual(['https://careers.acme.com/apply#form']);
      }
    });
  });

  // ─── Blank Lines ───────────────────────────────────────────────────

  describe('blank lines', () => {
    it('should skip blank lines', () => {
      const input = `Canonical-Domains: acme.com

Recruiting-Channels: https://linkedin.com/company/acme

Application-URLs: https://careers.acme.com
Never: payment
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
    });

    it('should skip whitespace-only lines', () => {
      const input = `Canonical-Domains: acme.com
   
Recruiting-Channels: https://linkedin.com/company/acme
Application-URLs: https://careers.acme.com
Never: payment
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
    });
  });

  // ─── Comma-Safe Fields (ADR-002) ───────────────────────────────────

  describe('comma-safe splitting', () => {
    it('should split Canonical-Domains on commas', () => {
      const input = `Canonical-Domains: acme.com, careers.acme.com, jobs.acme.com
Recruiting-Channels: https://linkedin.com/company/acme
Application-URLs: https://careers.acme.com
Never: payment
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.canonicalDomains).toEqual(['acme.com', 'careers.acme.com', 'jobs.acme.com']);
      }
    });

    it('should split Never tokens on commas', () => {
      const input = `Canonical-Domains: acme.com
Recruiting-Channels: https://linkedin.com/company/acme
Application-URLs: https://careers.acme.com
Never: payment, crypto, gift-cards
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.never).toEqual(['payment', 'crypto', 'gift-cards']);
      }
    });

    it('should NOT split URL fields on commas', () => {
      const input = `Canonical-Domains: acme.com
Recruiting-Channels: https://careers.acme.com/page?a=1,b=2
Application-URLs: https://careers.acme.com/apply?x=a,y=b
Never: payment
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        // The full URL with commas should be preserved intact
        expect(result.data.recruitingChannels).toEqual(['https://careers.acme.com/page?a=1,b=2']);
        expect(result.data.applicationUrls).toEqual(['https://careers.acme.com/apply?x=a,y=b']);
      }
    });
  });

  // ─── Repeated Keys ─────────────────────────────────────────────────

  describe('repeated keys', () => {
    it('should union values from repeated keys', () => {
      const input = `Canonical-Domains: acme.com
Canonical-Domains: careers.acme.com
Recruiting-Channels: https://linkedin.com/company/acme
Recruiting-Channels: https://careers.acme.com
Application-URLs: https://careers.acme.com/apply
Never: payment
Never: crypto
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.canonicalDomains).toEqual(['acme.com', 'careers.acme.com']);
        expect(result.data.recruitingChannels).toEqual([
          'https://linkedin.com/company/acme',
          'https://careers.acme.com',
        ]);
        expect(result.data.never).toEqual(['payment', 'crypto']);
      }
    });

    it('should deduplicate repeated values', () => {
      const input = `Canonical-Domains: acme.com
Canonical-Domains: acme.com
Recruiting-Channels: https://careers.acme.com
Application-URLs: https://careers.acme.com/apply
Never: payment, payment
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.canonicalDomains).toEqual(['acme.com']);
        expect(result.data.never).toEqual(['payment']);
      }
    });

    it('should union comma-split and repeated key for comma-safe fields', () => {
      const input = `Canonical-Domains: acme.com, careers.acme.com
Canonical-Domains: jobs.acme.com
Recruiting-Channels: https://careers.acme.com
Application-URLs: https://careers.acme.com/apply
Never: payment, crypto
Never: gift-cards
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.canonicalDomains).toEqual(['acme.com', 'careers.acme.com', 'jobs.acme.com']);
        expect(result.data.never).toEqual(['payment', 'crypto', 'gift-cards']);
      }
    });
  });

  // ─── Required Fields ───────────────────────────────────────────────

  describe('required fields', () => {
    it('should fail when required fields are missing', () => {
      const result = parse('# Empty file');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.length).toBeGreaterThanOrEqual(7);
      }
    });

    it('should succeed with all required fields', () => {
      const input = `Canonical-Domains: acme.com
Recruiting-Channels: https://careers.acme.com
Application-URLs: https://careers.acme.com/apply
Never: payment
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
    });
  });

  // ─── Case Insensitive Keys ─────────────────────────────────────────

  describe('case insensitive keys', () => {
    it('should accept keys in any casing', () => {
      const input = `canonical-domains: acme.com
RECRUITING-CHANNELS: https://careers.acme.com
application-urls: https://careers.acme.com/apply
NEVER: payment
verify-contact: mailto:v@acme.com
report-abuse: mailto:a@acme.com
expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
    });
  });

  // ─── Unknown Keys ──────────────────────────────────────────────────

  describe('unknown keys', () => {
    it('should skip unknown keys with a warning', () => {
      const input = `Canonical-Domains: acme.com
Recruiting-Channels: https://careers.acme.com
Application-URLs: https://careers.acme.com/apply
Never: payment
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z
Custom-Field: some value`;

      const result = parse(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.warnings.some(w => w.includes('Custom-Field'))).toBe(true);
      }
    });
  });

  // ─── Optional Fields ───────────────────────────────────────────────

  describe('optional fields', () => {
    it('should parse optional fields when present', () => {
      const input = `Canonical-Domains: acme.com
Recruiting-Channels: https://careers.acme.com
Application-URLs: https://careers.acme.com/apply
Never: payment
Verify-Contact: mailto:v@acme.com
Report-Abuse: mailto:a@acme.com
Policy: https://acme.com/policy
Verified-Recruiters: https://linkedin.com/in/jane
Expires: 2027-01-01T00:00:00Z
Last-Updated: 2026-06-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.policy).toBe('https://acme.com/policy');
        expect(result.data.verifiedRecruiters).toEqual(['https://linkedin.com/in/jane']);
        expect(result.data.lastUpdated).toBe('2026-06-01T00:00:00Z');
      }
    });
  });

  // ─── Value Trimming ────────────────────────────────────────────────

  describe('value trimming', () => {
    it('should trim whitespace from values', () => {
      const input = `Canonical-Domains:   acme.com  
Recruiting-Channels:   https://careers.acme.com   
Application-URLs: https://careers.acme.com/apply
Never:   payment  ,  crypto  
Verify-Contact:  mailto:v@acme.com  
Report-Abuse: mailto:a@acme.com
Expires: 2027-01-01T00:00:00Z`;

      const result = parse(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.canonicalDomains).toEqual(['acme.com']);
        expect(result.data.recruitingChannels).toEqual(['https://careers.acme.com']);
        expect(result.data.verifyContact).toBe('mailto:v@acme.com');
        expect(result.data.never).toEqual(['payment', 'crypto']);
      }
    });
  });
});
