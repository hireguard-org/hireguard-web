// ─── hiring.txt Tier 0 Data Model ────────────────────────────────────
// Mirrors hiring-txt-tier0.schema.json as TypeScript types.
// This is the *parsed* data model — wire-format concerns (comments,
// repeated keys, comma splitting) are handled by the parser.

/**
 * Parsed Tier 0 hiring.txt data.
 * All list fields are de-duplicated arrays; optional fields may be undefined.
 */
export interface Tier0 {
  tier?: 0 | 1 | 2;
  canonicalDomains: string[];
  recruitingChannels: string[];
  applicationUrls: string[];
  never: string[];
  verifyContact: string;
  reportAbuse: string;
  policy?: string;
  verifiedRecruiters?: string[];
  expires: string;       // ISO 8601 date-time
  lastUpdated?: string;  // ISO 8601 date-time
}

// ─── Verification Verdicts ───────────────────────────────────────────

/** Verifier verdict — two orthogonal axes (ADR-003). */
export enum Verdict {
  /** All hard conditions met: canonical domain resolved, hiring.txt valid,
   *  authoritative match confirmed, no Never contradiction. */
  VERIFIED = 'VERIFIED',

  /** Domain-level verification passed but a Never assertion is contradicted.
   *  Potential account compromise or sophisticated spoof. */
  VERIFIED_CONTRADICTION = 'VERIFIED_CONTRADICTION',

  /** Insufficient data to determine: no hiring.txt, CORS blocked,
   *  company not in registry, etc. */
  UNKNOWN = 'UNKNOWN',

  /** Hard negative signal: lookalike domain, payment solicitation,
   *  free-mail corporate claim, etc. */
  SUSPICIOUS = 'SUSPICIOUS',
}

// ─── Parser Types ────────────────────────────────────────────────────

export interface ParseSuccess {
  ok: true;
  data: Tier0;
  warnings: string[];
}

export interface ParseFailure {
  ok: false;
  errors: string[];
  warnings: string[];
}

export type ParseResult = ParseSuccess | ParseFailure;

// ─── Validation Types ────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
  /** 'error' blocks generation; 'warning' is advisory */
  severity: 'error' | 'warning';
}

// ─── Heuristic Types (stubs — Faz 3) ────────────────────────────────

export interface HeuristicSignal {
  type: string;
  description: string;
  confidence: number; // 0–1
}

export interface EmailAuthResult {
  dkim: 'pass' | 'fail' | 'none';
  spf: 'pass' | 'fail' | 'none';
  dmarc: 'pass' | 'fail' | 'none';
  raw: string;
}
