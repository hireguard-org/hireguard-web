// ─── hiring.txt Serializer ───────────────────────────────────────────
// Converts a Tier0 object back to wire-format hiring.txt text.
// Generator UI uses this to produce downloadable output.

import type { Tier0 } from './types';

/**
 * Serialize a Tier0 data model into hiring.txt wire format.
 *
 * Conventions:
 * - Comment header with canonical domain path
 * - Comma-safe fields (Canonical-Domains, Never) → comma-separated single line
 * - URL fields → repeated keys (one per line)
 * - Last-Updated auto-set to now if not provided
 */
export function serialize(data: Tier0): string {
  const lines: string[] = [];
  const host = data.canonicalDomains[0] || 'example.com';

  // Header comment
  lines.push(`# https://${host}/.well-known/hiring.txt`);

  // Canonical-Domains — comma-separated (comma-safe)
  if (data.canonicalDomains.length > 0) {
    lines.push(`Canonical-Domains: ${data.canonicalDomains.join(', ')}`);
  }

  // Recruiting-Channels — repeated keys (URL, not comma-safe)
  for (const url of data.recruitingChannels) {
    lines.push(`Recruiting-Channels: ${url}`);
  }

  // Application-URLs — repeated keys
  for (const url of data.applicationUrls) {
    lines.push(`Application-URLs: ${url}`);
  }

  // Never — comma-separated (comma-safe)
  if (data.never.length > 0) {
    lines.push(`Never: ${data.never.join(', ')}`);
  }

  // Scalar fields
  if (data.verifyContact) {
    lines.push(`Verify-Contact: ${data.verifyContact}`);
  }

  if (data.reportAbuse) {
    lines.push(`Report-Abuse: ${data.reportAbuse}`);
  }

  if (data.policy) {
    lines.push(`Policy: ${data.policy}`);
  }

  // Verified-Recruiters — repeated keys (URL)
  if (data.verifiedRecruiters) {
    for (const url of data.verifiedRecruiters) {
      lines.push(`Verified-Recruiters: ${url}`);
    }
  }

  // Expires
  if (data.expires) {
    lines.push(`Expires: ${data.expires}`);
  }

  // Last-Updated
  const lastUpdated = data.lastUpdated || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  lines.push(`Last-Updated: ${lastUpdated}`);

  return lines.join('\n') + '\n';
}
