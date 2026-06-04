// ─── hiring.txt Parser ───────────────────────────────────────────────
// Implements the Format Grammar defined in hiring-txt-spec.md §1.
// Produces a Tier0 object from raw hiring.txt text.

import type { Tier0, ParseResult } from './types';
import { KEY_TO_PROPERTY, COMMA_SAFE_FIELDS, ARRAY_FIELDS } from './constants';

/**
 * Parse raw hiring.txt content into a Tier0 data model.
 *
 * Grammar rules (ADR-001, ADR-002):
 * - Lines starting with `#` (after leading whitespace trim) are comments → discarded.
 * - Inline `#` does NOT start a comment (URLs may contain fragments).
 * - Blank lines → discarded.
 * - Data lines: `Key: Value` (first `:` is separator).
 * - Repeated keys → values are unioned.
 * - Comma-safe fields (Canonical-Domains, Never): additionally split on `,`.
 * - URL-containing fields: repeated keys only, no comma splitting.
 */
export function parse(raw: string): ParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Intermediate accumulator: property name → collected string values
  const acc: Record<string, string[]> = {};

  const lines = raw.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // Comment line: first non-whitespace is #
    if (trimmed.startsWith('#')) continue;

    // Blank line
    if (trimmed.trim() === '') continue;

    // Data line: find first ':'
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx < 0) {
      warnings.push(`Line ${i + 1}: no key-value separator found, skipping`);
      continue;
    }

    const rawKey = trimmed.slice(0, colonIdx).trim();
    const rawValue = trimmed.slice(colonIdx + 1).trim();

    if (!rawKey) {
      warnings.push(`Line ${i + 1}: empty key, skipping`);
      continue;
    }

    // Resolve wire key → Tier0 property name (case-insensitive)
    const normalizedKey = rawKey.toLowerCase();
    const prop = KEY_TO_PROPERTY[normalizedKey];

    if (!prop) {
      warnings.push(`Line ${i + 1}: unknown key "${rawKey}", skipping`);
      continue;
    }

    if (!rawValue) {
      warnings.push(`Line ${i + 1}: empty value for "${rawKey}", skipping`);
      continue;
    }

    // Find the original wire-format key name for comma-safe check
    // We need the casing-normalized wire key
    const wireKey = Object.keys(KEY_TO_PROPERTY).find(
      k => k.toLowerCase() === normalizedKey,
    )!;

    // Determine values to add
    let values: string[];

    if (ARRAY_FIELDS.has(prop) && COMMA_SAFE_FIELDS.has(capitalizeWireKey(wireKey))) {
      // Comma-safe field: split on comma, trim each segment
      values = rawValue.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      values = [rawValue];
    }

    // Accumulate
    if (!acc[prop]) acc[prop] = [];
    acc[prop].push(...values);
  }

  // Build Tier0 object
  const data: Partial<Tier0> = {};

  // Process array fields: deduplicate preserving order
  for (const field of ARRAY_FIELDS) {
    if (acc[field]) {
      (data as Record<string, unknown>)[field] = dedupe(acc[field]);
    }
  }

  // Process scalar fields (take last value if repeated — shouldn't happen)
  const scalarFields: Array<keyof Tier0> = [
    'tier', 'verifyContact', 'reportAbuse', 'policy', 'expires', 'lastUpdated',
  ];

  for (const field of scalarFields) {
    if (acc[field]) {
      const val = acc[field][acc[field].length - 1];
      if (field === 'tier') {
        const num = parseInt(val, 10);
        if (num === 0 || num === 1 || num === 2) {
          data.tier = num;
        } else {
          warnings.push(`Invalid tier value "${val}", ignoring`);
        }
      } else {
        // TypeScript needs help here — we know these are string fields
        (data as Record<string, unknown>)[field] = val;
      }
    }
  }

  // Validate required fields
  const required: Array<keyof Tier0> = [
    'canonicalDomains', 'recruitingChannels', 'applicationUrls',
    'never', 'verifyContact', 'reportAbuse', 'expires',
  ];

  for (const field of required) {
    const value = data[field];
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }

  return { ok: true, data: data as Tier0, warnings };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of arr) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

/**
 * Capitalize a wire key for COMMA_SAFE_FIELDS lookup.
 * Wire keys in KEY_TO_PROPERTY are lowercase; COMMA_SAFE_FIELDS uses
 * the canonical casing (e.g., "Canonical-Domains").
 */
function capitalizeWireKey(key: string): string {
  return key
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}
