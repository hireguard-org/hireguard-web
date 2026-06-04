// ─── @hireguard/core — Public API ────────────────────────────────────

// Types
export type {
  Tier0,
  ParseResult,
  ParseSuccess,
  ParseFailure,
  ValidationError,
  Verdict,
  HeuristicSignal,
  EmailAuthResult,
} from './types';

export { Verdict as VerdictEnum } from './types';

// Constants
export {
  WELL_KNOWN_NEVER_TOKENS,
  WELL_KNOWN_NEVER_SET,
  DEFAULT_NEVER_TOKENS,
  NEVER_TOKEN_PATTERN,
  DOMAIN_PATTERN,
  HTTPS_PATTERN,
  CONTACT_PATTERN,
  COMMA_SAFE_FIELDS,
  KEY_TO_PROPERTY,
  ARRAY_FIELDS,
} from './constants';

export type { NeverTokenDef } from './constants';

// Parser
export { parse } from './parser';

// Serializer
export { serialize } from './serializer';

// Validator
export { validate, isValid } from './validator';

// Heuristics
export {
  detectLookalike,
  detectFreeMail,
  detectScamLanguage,
  analyzeHeuristics,
} from './heuristics';

// Email Auth
export { parseAuthenticationResults } from './email-auth';

// Verifier Engine
export { verify, lookupCompany } from './verifier';
export type { VerifyInput, VerifyResult, VerifyStep, CompanyEntry } from './verifier';
