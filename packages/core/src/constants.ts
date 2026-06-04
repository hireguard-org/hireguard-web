// ─── Well-Known Never Tokens ─────────────────────────────────────────
// Standardized tokens with defined semantics (ADR-007).
// Verifiers SHOULD recognize these for automated policy-contradiction checks.

export interface NeverTokenDef {
  token: string;
  description: string;
}

export const WELL_KNOWN_NEVER_TOKENS: readonly NeverTokenDef[] = [
  { token: 'payment',                  description: 'We never request payment from candidates' },
  { token: 'crypto',                   description: 'We never request cryptocurrency transactions' },
  { token: 'gift-cards',               description: 'We never request gift card purchases' },
  { token: 'personal-email',           description: 'We never recruit from personal email addresses' },
  { token: 'whatsapp-first-contact',   description: 'We never initiate first contact via WhatsApp' },
  { token: 'telegram-first-contact',   description: 'We never initiate first contact via Telegram' },
  { token: 'id-before-offer',          description: 'We never request government ID before a formal offer' },
  { token: 'bank-details-before-offer', description: 'We never request bank/financial details before a formal offer' },
] as const;

export const WELL_KNOWN_NEVER_SET = new Set(
  WELL_KNOWN_NEVER_TOKENS.map(t => t.token),
);

/** Tokens selected by default in the generator UI. */
export const DEFAULT_NEVER_TOKENS = new Set([
  'payment',
  'crypto',
  'gift-cards',
  'personal-email',
  'id-before-offer',
]);

// ─── Patterns ────────────────────────────────────────────────────────

/** Valid Never token format: kebab-case, starts with letter, ends with alphanumeric. */
export const NEVER_TOKEN_PATTERN = /^[a-z][a-z0-9-]*[a-z0-9]$/;

/** Valid hostname pattern (simplified). */
export const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

/** HTTPS URL prefix. */
export const HTTPS_PATTERN = /^https:\/\/.+/i;

/** Valid contact URI: mailto: or https:// */
export const CONTACT_PATTERN = /^(mailto:.+@.+\..+|https:\/\/.+)/i;

// ─── Wire Format ─────────────────────────────────────────────────────

/** Fields where comma-separated values are allowed (value type cannot contain commas). */
export const COMMA_SAFE_FIELDS = new Set([
  'Canonical-Domains',
  'Never',
]);

/**
 * Mapping from wire-format key names to Tier0 property names.
 * Keys are case-insensitive; values are the canonical casing.
 */
export const KEY_TO_PROPERTY: Record<string, keyof import('./types').Tier0> = {
  'tier':                 'tier',
  'canonical-domains':    'canonicalDomains',
  'recruiting-channels':  'recruitingChannels',
  'application-urls':     'applicationUrls',
  'never':                'never',
  'verify-contact':       'verifyContact',
  'report-abuse':         'reportAbuse',
  'policy':               'policy',
  'verified-recruiters':  'verifiedRecruiters',
  'expires':              'expires',
  'last-updated':         'lastUpdated',
};

/** Fields that hold arrays in the Tier0 model. */
export const ARRAY_FIELDS = new Set<keyof import('./types').Tier0>([
  'canonicalDomains',
  'recruitingChannels',
  'applicationUrls',
  'never',
  'verifiedRecruiters',
]);
