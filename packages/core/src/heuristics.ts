// ─── Heuristic Analysis ──────────────────────────────────────────────
// Client-side message analysis: lookalike domains, free-mail detection,
// scam language patterns, urgency signals.

import type { HeuristicSignal } from './types';

// ── Free-mail providers ──
const FREE_MAIL_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'aol.com', 'mail.com', 'protonmail.com', 'proton.me',
  'icloud.com', 'me.com', 'yandex.com', 'yandex.ru',
  'zoho.com', 'gmx.com', 'gmx.de', 'web.de',
  'tutanota.com', 'tuta.io', 'fastmail.com',
  'mail.ru', 'inbox.ru', 'list.ru',
]);

// ── Scam language patterns ──
const SCAM_PATTERNS: Array<{ pattern: RegExp; type: string; description: string }> = [
  { pattern: /\b(payment|pay\s*fee|processing\s*fee|registration\s*fee|advance\s*fee)\b/i, type: 'payment-language', description: 'Payment or fee request detected' },
  { pattern: /\b(bitcoin|btc|ethereum|eth|crypto|usdt|cryptocurrency|wallet\s*address)\b/i, type: 'crypto-language', description: 'Cryptocurrency reference detected' },
  { pattern: /\b(gift\s*card|itunes\s*card|google\s*play\s*card|prepaid\s*card|steam\s*card)\b/i, type: 'gift-card-language', description: 'Gift card reference detected' },
  { pattern: /\b(urgent|immediately|within\s*24\s*hours|act\s*now|limited\s*time|expire\s*soon|asap)\b/i, type: 'urgency-language', description: 'Urgency pressure language detected' },
  { pattern: /\b(wire\s*transfer|western\s*union|moneygram|bank\s*transfer|routing\s*number)\b/i, type: 'wire-transfer-language', description: 'Wire transfer reference detected' },
  { pattern: /\b(ssn|social\s*security|passport\s*number|national\s*id|identity\s*card)\b/i, type: 'id-request-language', description: 'Personal identification request detected' },
  { pattern: /\b(guaranteed\s*job|100%\s*placement|no\s*interview\s*needed|instant\s*hire)\b/i, type: 'too-good', description: 'Unrealistic job guarantee detected' },
  { pattern: /\b(whatsapp\s*me|contact\s*on\s*telegram|text\s*me\s*on|add\s*me\s*on\s*whatsapp)\b/i, type: 'messaging-redirect', description: 'Redirect to personal messaging app detected' },
];

// ── Unicode confusable map (common homoglyphs) ──
const CONFUSABLES: Record<string, string> = {
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x',
  'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ɡ': 'g', 'ɩ': 'l',
  '0': 'o', '1': 'l', 'ı': 'i', 'ɾ': 'r', 'ո': 'n', 'ν': 'v',
  'ω': 'w', 'ρ': 'p', 'τ': 't', 'ℓ': 'l',
};

/**
 * Normalize a string by replacing Unicode confusables with their ASCII
 * equivalents. This enables homograph attack detection.
 */
function normalizeConfusables(str: string): string {
  return [...str].map(ch => CONFUSABLES[ch] ?? ch).join('');
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Detect lookalike/homograph domains using Levenshtein distance
 * and Unicode confusable character tables.
 */
export function detectLookalike(
  senderDomain: string,
  canonicalDomains: string[],
): HeuristicSignal | null {
  const normalizedSender = normalizeConfusables(senderDomain.toLowerCase());

  for (const canonical of canonicalDomains) {
    const normalizedCanonical = normalizeConfusables(canonical.toLowerCase());

    // Exact match after confusable normalization → homograph attack
    if (normalizedSender === normalizedCanonical && senderDomain.toLowerCase() !== canonical.toLowerCase()) {
      return {
        type: 'homograph-domain',
        description: `Domain "${senderDomain}" uses Unicode characters that mimic "${canonical}"`,
        confidence: 0.95,
      };
    }

    // Levenshtein distance ≤ 2 → typosquatting/lookalike
    const dist = levenshtein(normalizedSender, normalizedCanonical);
    if (dist > 0 && dist <= 2 && normalizedSender !== normalizedCanonical) {
      return {
        type: 'lookalike-domain',
        description: `Domain "${senderDomain}" is suspiciously similar to "${canonical}" (edit distance: ${dist})`,
        confidence: Math.max(0.6, 1 - dist * 0.2),
      };
    }
  }

  return null;
}

/**
 * Check if an email address uses a known free mail provider
 * while potentially claiming corporate identity.
 */
export function detectFreeMail(email: string): HeuristicSignal | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  if (FREE_MAIL_PROVIDERS.has(domain)) {
    return {
      type: 'free-mail',
      description: `Sender uses free email provider "${domain}" — legitimate corporate recruiters use company domains`,
      confidence: 0.7,
    };
  }
  return null;
}

/**
 * Scan message text for payment, crypto, urgency, and gift-card language.
 */
export function detectScamLanguage(messageText: string): HeuristicSignal[] {
  const signals: HeuristicSignal[] = [];

  for (const { pattern, type, description } of SCAM_PATTERNS) {
    if (pattern.test(messageText)) {
      signals.push({ type, description, confidence: 0.65 });
    }
  }

  return signals;
}

/**
 * Run all heuristic checks and return collected signals.
 */
export function analyzeHeuristics(
  input: {
    senderEmail?: string;
    senderDomain?: string;
    canonicalDomains?: string[];
    messageText?: string;
  },
): HeuristicSignal[] {
  const signals: HeuristicSignal[] = [];

  // Free-mail check
  if (input.senderEmail) {
    const freeMail = detectFreeMail(input.senderEmail);
    if (freeMail) signals.push(freeMail);
  }

  // Lookalike domain check
  const domain = input.senderDomain ?? input.senderEmail?.split('@')[1];
  if (domain && input.canonicalDomains?.length) {
    const lookalike = detectLookalike(domain, input.canonicalDomains);
    if (lookalike) signals.push(lookalike);
  }

  // Scam language check
  if (input.messageText) {
    signals.push(...detectScamLanguage(input.messageText));
  }

  return signals;
}
