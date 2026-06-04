# hiring.txt — Protocol Specification v0.1

> Open, domain-rooted recruiter verification convention.
> This document defines the wire format, parsing rules, verification logic, and architectural decisions for `hiring.txt`.

**Status:** Draft · **Companion:** `hiring-txt-tier0.schema.json` (data model)

---

## 1. Format Grammar

The `hiring.txt` file uses a line-oriented, human-readable, machine-parseable text format served at `/.well-known/hiring.txt` over HTTPS.

### 1.1 Line Types

A parser processes the file line by line. After trimming leading whitespace, each line is classified:

| Line Type | Rule | Action |
|-----------|------|--------|
| **Comment** | First non-whitespace character is `#` | Silently discard |
| **Blank** | Empty or whitespace-only | Silently discard |
| **Data** | Contains `:` (first occurrence is the key-value separator) | Parse as `Key: Value` |

**Critical:** Inline `#` does **NOT** start a comment. URLs may contain fragments (`https://example.com/page#section`), and values in fields like `Application-URLs` or `Recruiting-Channels` must preserve them. Only a line whose first non-whitespace character is `#` is a comment.

### 1.2 Key-Value Parsing

```
Key: Value
```

- **Key** = all characters before the first `:`. Trimmed. Case-insensitive for matching (normalize to the canonical casing in schema).
- **Value** = all characters after the first `:`. Leading/trailing whitespace trimmed.

### 1.3 Multi-Value Fields

List-type fields support two serialization forms. Which forms are allowed depends on whether the value type is **comma-safe**:

| Field | Value Type | Comma-Safe? | Allowed Forms |
|-------|-----------|-------------|---------------|
| `Canonical-Domains` | hostname | ✔ (hostnames cannot contain `,`) | Comma-separated single line **OR** repeated keys |
| `Never` | kebab-case token | ✔ (tokens cannot contain `,`) | Comma-separated single line **OR** repeated keys |
| `Recruiting-Channels` | URL | ✘ (URL path/query may contain `,`) | Repeated keys **only** |
| `Application-URLs` | URL | ✘ | Repeated keys **only** |
| `Verified-Recruiters` | URL | ✘ | Repeated keys **only** |

**Parser behavior:**
1. For **all** list fields: if the same key appears multiple times, union the values.
2. For **comma-safe** fields only: additionally split each value on `,` and trim each segment.
3. Discard empty segments after trimming.
4. Deduplicate (preserve first occurrence order).

### 1.4 Example

```
# https://acme.com/.well-known/hiring.txt
# Acme Corp — Recruiting Verification File

Canonical-Domains: acme.com, careers.acme.com
Recruiting-Channels: https://www.linkedin.com/company/acme
Recruiting-Channels: https://careers.acme.com
Application-URLs: https://careers.acme.com/jobs
Never: payment, crypto, gift-cards, personal-email, id-before-offer
Verify-Contact: mailto:verify@acme.com
Report-Abuse: mailto:abuse@acme.com
Policy: https://www.acme.com/recruiting-policy
Verified-Recruiters: https://www.linkedin.com/in/jane-doe
Verified-Recruiters: https://www.linkedin.com/in/john-smith
Expires: 2027-06-01T00:00:00Z
Last-Updated: 2026-06-04T00:00:00Z
```

---

## 2. Verification Logic

### 2.1 Verdict Taxonomy

The verifier produces one of three verdicts. These are **orthogonal axes** — VERIFIED is a deterministic authoritative-match boolean, not a low risk score. Heuristics **cannot grant** VERIFIED; they can only **raise suspicion**.

#### VERIFIED ✓

All of the following hard conditions are met:

1. **Canonical domain independently resolved** — via curated registry (`companies.json`) or explicit user confirmation (with warning).
2. **`hiring.txt` retrieved and valid** — fetched over HTTPS from the canonical domain, parsed successfully, schema-valid (Tier 0), `Expires` not in the past.
3. **Positive authoritative match** for the relevant channel:
   - **Email:** sender domain ∈ `Canonical-Domains` **AND** DKIM/SPF pass confirmed via pasted `Authentication-Results` header. Domain match alone is insufficient (From: is spoofable). If no header is provided → downgrade: "domain consistent but transport unverified" (not VERIFIED).
   - **Web/Social:** channel/profile URL ∈ `Recruiting-Channels`.
   - **Tier 1/2:** cryptographic signature or VC validated.
4. **No hard `Never` contradiction** — the message/interaction does not violate any declared `Never` token.

**Special case — VERIFIED DOMAIN, POLICY CONTRADICTION:**
Conditions 1–3 pass, but the message violates a `Never` assertion (e.g., domain matches + DKIM passes, but payment is requested while the company declares `Never: payment`). This is a potential account compromise or sophisticated spoof signal. The verifier MUST NOT issue a clean VERIFIED; instead display a compound warning.

#### UNKNOWN ◌

None of the conditions for VERIFIED or SUSPICIOUS are conclusively established:
- `hiring.txt` not found or CORS-blocked
- Company not in registry and domain not user-confirmed
- Insufficient data to make a determination

Honest "we cannot determine." The verifier provides guidance: "Verify directly with the company via their official website."

#### SUSPICIOUS ⚠

Any hard negative signal detected:
- Lookalike/homograph domain (Levenshtein distance, Unicode confusable)
- Payment/crypto/gift-card solicitation language
- Free email provider claiming corporate identity
- Application link outside declared `Application-URLs`
- Unsolicited job offer for a position the user never applied for
- Other heuristic triggers

Heuristics feed this axis. Multiple low-confidence signals may compound into SUSPICIOUS.

### 2.2 Verification Flow

```
Input: company name + sender email/handle + job listing URL + (opt.) pasted email headers

1. Resolve canonical domain
   a. Match against companies.json (curated registry)
   b. If no match → ask user for official domain (with warning)

2. Fetch <canonical>/.well-known/hiring.txt (CORS required)
   - CORS blocked → "Verify with browser extension" fallback
   - 404/timeout → verdict: UNKNOWN

3. Parse + JSON Schema (Tier 0) validate
   - Expires in past → verdict: UNKNOWN ("unverifiable — expired file")

4. Authoritative match:
   - Sender domain ∈ Canonical-Domains?
   - Channel ∈ Recruiting-Channels?
   - Application URL ∈ Application-URLs?

5. Email authentication (if headers pasted):
   - Parse Authentication-Results → DKIM/SPF/DMARC pass?

6. Never contradiction check:
   - Does message content contradict any Never token?

7. Heuristics (client-side):
   - Lookalike domain (Levenshtein + homograph/IDN)
   - Free email provider detection
   - Payment/urgency/crypto language patterns
   - Unsolicited offer signals

8. Verdict: VERIFIED | VERIFIED+CONTRADICTION | UNKNOWN | SUSPICIOUS
   + reasoning + actionable guidance
```

---

## 3. `Never` Token Registry

### 3.1 Well-Known Tokens

These tokens have standardized semantics. Verifiers SHOULD recognize and automatically match them against message content.

| Token | Meaning |
|-------|---------|
| `payment` | We never request payment from candidates (covers training fees, equipment deposits, remote-work fees) |
| `crypto` | We never request cryptocurrency transactions |
| `gift-cards` | We never request gift card purchases |
| `personal-email` | We never recruit from personal email addresses (Gmail, Yahoo, etc.) |
| `whatsapp-first-contact` | We never initiate first contact via WhatsApp |
| `telegram-first-contact` | We never initiate first contact via Telegram |
| `id-before-offer` | We never request government ID before a formal offer |
| `bank-details-before-offer` | We never request bank/financial details before a formal offer |

### 3.2 Custom Tokens

Companies may declare custom tokens beyond the well-known set. Custom tokens:
- **MUST** conform to kebab-case format: `^[a-z][a-z0-9-]*[a-z0-9]$`
- Are human-readable negative assertions
- May not be automatically matched by all verifiers (noted in generator UI)
- Can be promoted to well-known status through the spec governance process

### 3.3 Governance

New well-known tokens follow an open process analogous to IANA registries:
1. Propose via PR with token name, definition, and detection heuristic
2. Community review period
3. Merge into spec + update verifier heuristics

---

## 4. Company Registry (`companies.json`)

### 4.1 Purpose

The registry provides **canonical domain resolution** — mapping a company name to its official domain(s). It is NOT a `hiring.txt` adoption tracker. Companies are included regardless of whether they publish `hiring.txt`.

### 4.2 Scope

- **Curated, not exhaustive.** Focus on frequently impersonated / well-known employers (hundreds to low thousands).
- **No `hiring.txt` status caching.** The registry stores only stable name→domain mappings. `hiring.txt` availability is resolved live.
- **Community-maintained.** PRs with verification process (domain ownership evidence).

### 4.3 Schema

```json
{
  "version": "2026.06",
  "updated": "2026-06-04",
  "companies": [
    {
      "id": "amazon",
      "names": ["Amazon", "Amazon.com", "AWS"],
      "canonicalDomains": ["amazon.com", "amazon.jobs"],
      "officialChannels": ["https://www.linkedin.com/company/amazon"],
      "country": "US",
      "sector": "tech",
      "impersonationRisk": "high"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✔ | Unique kebab-case identifier |
| `names` | string[] | ✔ | Display names and aliases for fuzzy matching (normalize: lowercase, strip punctuation) |
| `canonicalDomains` | string[] | ✔ | Official domains |
| `officialChannels` | string[] | ✘ | Known official recruiting channels (LinkedIn, etc.) |
| `country` | string | ✘ | ISO 3166-1 alpha-2 |
| `sector` | string | ✘ | Industry category |
| `impersonationRisk` | enum | ✘ | `"high"` \| `"medium"` \| `"low"` — curation priority |

---

## 5. CORS Requirement

`hiring.txt` is public data. The convention **requires** publishers to serve `/.well-known/hiring.txt` with:

```
Access-Control-Allow-Origin: *
```

This enables any frontend verifier to fetch and validate the file without a backend proxy — preserving the privacy-by-design principle (no third-party server sees the verification query).

Publishers that do not set this header limit verification to browser extensions (which bypass CORS via host permissions). The generator output and adoption guide include this as a **mandatory deployment step**.

---

## 6. Architecture Decision Records (ADR)

### ADR-001: Comments are part of wire-format grammar, not data model

**Context:** Generator produces `#`-prefixed lines. Parser must handle them.
**Decision:** Formalize. Parser discards lines starting with `#` (after whitespace trim). Inline `#` is NOT a comment (URLs contain fragments). Comments belong to the wire-format grammar, not `schema.json` (which models parsed data). No comment property in schema.
**Consequences:** Parser is straightforward; no ambiguity with URL fragments.

### ADR-002: Comma-separated vs repeated keys — type-driven rule

**Context:** Generator inconsistently uses commas for some fields, repeated keys for others.
**Decision:** Formalize based on value type safety. Comma-safe types (hostname, kebab-case token) allow both forms. URL-containing fields require repeated keys only (URLs may contain commas in path/query). Parser supports both where allowed, unions results.
**Consequences:** Backward-compatible with existing generator output. Clear rule for future fields.

### ADR-003: VERIFIED is authoritative-match, not low-risk-score

**Context:** Verification could be a risk score or a boolean match.
**Decision:** Two orthogonal axes. VERIFIED = deterministic authoritative match (all hard conditions met). Heuristics cannot grant VERIFIED, only raise SUSPICIOUS. Special compound state for domain-verified + policy contradiction.
**Consequences:** Clear trust semantics. A clean VERIFIED has strong meaning. Heuristic false-positives don't contaminate the authoritative signal.

### ADR-004: Company registry includes non-adopters

**Context:** Registry could track only companies that publish `hiring.txt`.
**Decision:** Registry provides canonical domain resolution for any frequently impersonated company. `hiring.txt` status is resolved live, not cached. Early-stage, most entries won't have `hiring.txt`.
**Consequences:** Registry is immediately useful for verifier even before adoption. No stale status data.

### ADR-005: Scam-intelligence deferred to value layer

**Context:** Static snapshot of reported scam domains/profiles could be bundled.
**Decision:** Defer to post-v1. Liability risk (defamation), moderation burden, data quality concerns. When implemented, serves as the differentiated value layer — optional API or CORS-enabled static snapshot. Core web app must function fully without it.
**Consequences:** v1 scope reduced. Clear separation between open protocol and commercial value-add.

### ADR-006: Monorepo with shared pure-TS core

**Context:** Web app and browser extension share parser, validator, heuristics code.
**Decision:** pnpm monorepo. `packages/core` = `@hireguard/core` (pure TS, zero DOM dependency). Apps consume via workspace dependency. Core also published to npm for third-party verifier authors.
**Consequences:** Atomic changes across parser + consumers. No version-bump friction. Third parties can build on the protocol.

### ADR-007: Custom Never tokens in v1

**Context:** Schema is open-vocabulary but generator only offers 8 chips.
**Decision:** Generator offers 8 well-known chips + free-text custom token input, validated against `^[a-z][a-z0-9-]*[a-z0-9]$`. UI notes that custom tokens may not be auto-matched by all verifiers. Spec maintains a well-known registry with promotion process.
**Consequences:** Users don't need to hand-edit files. Interoperability preserved via well-known set. Extension path clear.

---

*This specification is read alongside the HireGuard Technical Document and Design System v1.0.*
