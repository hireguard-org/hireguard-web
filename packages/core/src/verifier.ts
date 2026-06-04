// ─── Verifier Engine ─────────────────────────────────────────────────
// Orchestrates the full verification pipeline:
// 1. Registry lookup → canonical domain resolution
// 2. hiring.txt fetch + parse + validate
// 3. Cross-reference sender against declarations
// 4. Heuristic analysis
// 5. Email auth analysis
// 6. Verdict determination

import type {
  Tier0,
  Verdict,
  HeuristicSignal,
  EmailAuthResult,
  ParseResult,
} from './types';
import { parse } from './parser';
import { validate } from './validator';
import { analyzeHeuristics } from './heuristics';
import { parseAuthenticationResults } from './email-auth';

// ─── Input / Output types ────────────────────────────────────────────

export interface VerifyInput {
  /** Company name or identifier (for registry lookup) */
  companyName?: string;
  /** Sender email address */
  senderEmail?: string;
  /** Job listing URL */
  listingUrl?: string;
  /** Optional pasted Authentication-Results header */
  authHeader?: string;
  /** Optional pasted message text for scam language analysis */
  messageText?: string;
  /** Canonical domain — may be known from registry or entered by user */
  canonicalDomain?: string;
}

export interface CompanyEntry {
  id: string;
  names: string[];
  canonicalDomains: string[];
  officialChannels: string[];
  country: string;
  sector: string;
  impersonationRisk: string;
}

export interface VerifyStep {
  id: string;
  status: 'pass' | 'fail' | 'warn' | 'skip' | 'info';
  label: string;
  detail?: string;
}

export interface VerifyResult {
  verdict: Verdict;
  steps: VerifyStep[];
  tier0?: Tier0;
  heuristics: HeuristicSignal[];
  emailAuth?: EmailAuthResult;
  reasons: string[];
}

// ─── Registry lookup ─────────────────────────────────────────────────

/**
 * Resolve a company name to a registry entry.
 * Returns the matching entry or null.
 */
export function lookupCompany(
  nameOrDomain: string,
  registry: CompanyEntry[],
): CompanyEntry | null {
  const query = nameOrDomain.toLowerCase().trim();
  if (!query) return null;

  // Try exact name match first
  for (const company of registry) {
    for (const name of company.names) {
      if (name.toLowerCase() === query) return company;
    }
  }

  // Try domain match
  for (const company of registry) {
    for (const domain of company.canonicalDomains) {
      if (domain.toLowerCase() === query) return company;
    }
  }

  // Try partial/fuzzy name match
  for (const company of registry) {
    for (const name of company.names) {
      if (name.toLowerCase().includes(query) || query.includes(name.toLowerCase())) {
        return company;
      }
    }
  }

  return null;
}

// ─── Verification engine ─────────────────────────────────────────────

/**
 * Run the full verification pipeline.
 *
 * This is a pure function — the actual hiring.txt fetch is performed
 * by the caller (the UI layer) and the raw text is passed in.
 * This keeps the engine DOM-free and testable.
 */
export function verify(
  input: VerifyInput,
  hiringTxtRaw: string | null,
  registryEntry: CompanyEntry | null,
): VerifyResult {
  const steps: VerifyStep[] = [];
  const reasons: string[] = [];
  let tier0: Tier0 | undefined;
  let heuristics: HeuristicSignal[] = [];
  let emailAuth: EmailAuthResult | undefined;

  const senderDomain = input.senderEmail?.split('@')[1]?.toLowerCase();
  const canonicalDomains = registryEntry?.canonicalDomains
    ?? (input.canonicalDomain ? [input.canonicalDomain] : []);

  // ── Step 1: Registry lookup ──
  if (registryEntry) {
    steps.push({
      id: 'registry',
      status: 'pass',
      label: 'Company found in registry',
      detail: `${registryEntry.names[0]} — ${registryEntry.canonicalDomains.join(', ')}`,
    });
  } else if (input.canonicalDomain) {
    steps.push({
      id: 'registry',
      status: 'warn',
      label: 'Company not in registry',
      detail: `Using user-provided domain: ${input.canonicalDomain}`,
    });
  } else {
    steps.push({
      id: 'registry',
      status: 'fail',
      label: 'Company not found',
      detail: 'No matching company in registry and no canonical domain provided',
    });
    return {
      verdict: 'UNKNOWN' as Verdict,
      steps,
      heuristics: [],
      reasons: ['Could not resolve canonical domain'],
    };
  }

  // ── Step 2: hiring.txt fetch ──
  if (hiringTxtRaw === null) {
    steps.push({
      id: 'fetch',
      status: 'fail',
      label: 'hiring.txt not accessible',
      detail: 'Could not fetch file — CORS blocked or file does not exist',
    });
    reasons.push('hiring.txt not accessible');
  } else {
    steps.push({
      id: 'fetch',
      status: 'pass',
      label: 'hiring.txt retrieved',
    });

    // ── Step 3: Parse ──
    const parseResult: ParseResult = parse(hiringTxtRaw);
    if (!parseResult.ok) {
      steps.push({
        id: 'parse',
        status: 'fail',
        label: 'Parse failed',
        detail: parseResult.errors.join('; '),
      });
      reasons.push('hiring.txt parse failed');
    } else {
      tier0 = parseResult.data;
      steps.push({
        id: 'parse',
        status: 'pass',
        label: 'Valid hiring.txt parsed',
      });

      // ── Step 4: Validate ──
      const validationErrors = validate(tier0);
      const errors = validationErrors.filter(e => e.severity === 'error');
      if (errors.length > 0) {
        steps.push({
          id: 'validate',
          status: 'fail',
          label: 'Validation failed',
          detail: errors.map(e => e.message).join('; '),
        });
        reasons.push('hiring.txt validation failed');
      } else {
        steps.push({
          id: 'validate',
          status: 'pass',
          label: 'Tier 0 validation passed',
        });

        // ── Step 5: Expires check ──
        const expiresDate = new Date(tier0.expires);
        if (expiresDate.getTime() < Date.now()) {
          steps.push({
            id: 'expires',
            status: 'fail',
            label: 'File expired',
            detail: `Expired on ${tier0.expires}`,
          });
          reasons.push('hiring.txt has expired');
        } else {
          steps.push({
            id: 'expires',
            status: 'pass',
            label: 'File is current',
            detail: `Expires: ${tier0.expires}`,
          });
        }

        // ── Step 6: Domain cross-reference ──
        if (senderDomain) {
          const domainMatch = tier0.canonicalDomains.some(
            d => d.toLowerCase() === senderDomain,
          );
          if (domainMatch) {
            steps.push({
              id: 'domain-match',
              status: 'pass',
              label: 'Sender domain matches declaration',
              detail: `${senderDomain} ∈ Canonical-Domains`,
            });
          } else {
            steps.push({
              id: 'domain-match',
              status: 'fail',
              label: 'Sender domain not declared',
              detail: `${senderDomain} ∉ {${tier0.canonicalDomains.join(', ')}}`,
            });
            reasons.push(`Sender domain "${senderDomain}" not in declared Canonical-Domains`);
          }
        }

        // ── Step 7: Channel cross-reference ──
        if (input.listingUrl) {
          const channelMatch = tier0.recruitingChannels.some(ch =>
            input.listingUrl!.toLowerCase().startsWith(ch.toLowerCase()),
          ) || tier0.applicationUrls.some(url =>
            input.listingUrl!.toLowerCase().startsWith(url.toLowerCase()),
          );
          if (channelMatch) {
            steps.push({
              id: 'channel-match',
              status: 'pass',
              label: 'Listing URL matches declared channels',
            });
          } else {
            steps.push({
              id: 'channel-match',
              status: 'warn',
              label: 'Listing URL not in declared channels',
              detail: input.listingUrl,
            });
          }
        }
      }
    }
  }

  // ── Step 8: Heuristic analysis ──
  heuristics = analyzeHeuristics({
    senderEmail: input.senderEmail,
    senderDomain,
    canonicalDomains,
    messageText: input.messageText,
  });

  if (heuristics.length > 0) {
    for (const signal of heuristics) {
      steps.push({
        id: `heuristic-${signal.type}`,
        status: 'warn',
        label: signal.description,
        detail: `Confidence: ${Math.round(signal.confidence * 100)}%`,
      });
    }
    reasons.push(...heuristics.map(s => s.description));
  }

  // ── Step 9: Email auth ──
  if (input.authHeader) {
    emailAuth = parseAuthenticationResults(input.authHeader);
    const allPass = emailAuth.dkim === 'pass'
      && emailAuth.spf === 'pass'
      && emailAuth.dmarc === 'pass';
    const anyFail = emailAuth.dkim === 'fail'
      || emailAuth.spf === 'fail'
      || emailAuth.dmarc === 'fail';

    steps.push({
      id: 'email-auth',
      status: allPass ? 'pass' : anyFail ? 'fail' : 'info',
      label: `Email auth: DKIM=${emailAuth.dkim}, SPF=${emailAuth.spf}, DMARC=${emailAuth.dmarc}`,
    });

    if (anyFail) {
      reasons.push('Email authentication failed — possible spoofing');
    }
  }

  // ── Determine verdict ──
  const verdict = determineVerdict(steps, heuristics, tier0);

  return { verdict, steps, tier0, heuristics, emailAuth, reasons };
}

/**
 * Determine the final verdict based on step outcomes and heuristics.
 */
function determineVerdict(
  steps: VerifyStep[],
  heuristics: HeuristicSignal[],
  tier0?: Tier0,
): Verdict {
  const hasHighConfidenceSignal = heuristics.some(s => s.confidence >= 0.8);
  const criticalSteps = ['fetch', 'parse', 'validate', 'expires'];
  const hasCriticalFail = steps.some(s => criticalSteps.includes(s.id) && s.status === 'fail');
  const domainMatch = steps.find(s => s.id === 'domain-match');
  const domainPassed = domainMatch?.status === 'pass';

  // SUSPICIOUS: high-confidence heuristic signal (homograph, etc.)
  if (hasHighConfidenceSignal) {
    return 'SUSPICIOUS' as Verdict;
  }

  // SUSPICIOUS: multiple medium-confidence signals
  if (heuristics.length >= 2) {
    return 'SUSPICIOUS' as Verdict;
  }

  // UNKNOWN: critical step failed (no hiring.txt, parse failed, expired)
  if (hasCriticalFail) {
    return 'UNKNOWN' as Verdict;
  }

  // VERIFIED: domain matches and no suspicious signals
  if (domainPassed && tier0 && heuristics.length === 0) {
    return 'VERIFIED' as Verdict;
  }

  // UNKNOWN: default
  return 'UNKNOWN' as Verdict;
}
