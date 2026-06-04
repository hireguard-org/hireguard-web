# HireGuard — Architecture Document
### `hireguard.org` · Frontend-only React SPA · v1.0

> A backend-less, 100% client-side React single-page application. All processing happens in the browser — the "data never leaves the browser" principle is both a privacy guarantee and the brand's core identity.

**Status:** Production · **Stack:** Vite + React 18 + TypeScript + react-i18next · **Deploy:** Docker (Nginx Alpine) on DigitalOcean App Platform

---

## 1. Constraints & Principles

- **No backend.** No server state, no database, no API layer. All logic runs in the browser. Result: static hosting, zero server cost, zero data collection.
- **Privacy-by-design.** Generator inputs and verifier analyses are never sent over the network (except the verifier's fetch of the target `hiring.txt` — which happens from the user's own browser).
- **i18n: 6 languages.** UI is translated; machine-readable content (`hiring.txt` field names, `Never` tokens) is never translated.
- **Design system:** HireGuard Design System v1.0 tokens (`tokens.css` + `base.css`).

---

## 2. Why Frontend-only Works (and Where It Doesn't)

| Capability | Frontend-only? | How |
|------------|---------------|-----|
| `hiring.txt` generation | ✔ Fully | Pure string generation, Blob download |
| Message heuristics (payment language, lookalike domain, free email) | ✔ | Client-side string/regex |
| DKIM/SPF/DMARC from pasted email headers | ✔ | Parse `Authentication-Results` header (user pastes it) |
| **Fetching arbitrary domain's `hiring.txt`** | ⚠ **Conditional** | **Depends on CORS — see below** |
| Live email header reading (without user pasting) | ✘ | Browser can't access — requires extension |

### 2.1 The CORS Challenge

When the web app tries to `fetch("https://other-company.com/.well-known/hiring.txt")`, the target server must send `Access-Control-Allow-Origin` headers — otherwise the browser blocks the request.

**Solution (embedded in spec):** `hiring.txt` is public data. The convention requires publishers to serve this path with permissive CORS:

```
Access-Control-Allow-Origin: *
```

The generator output and adoption guide include this as a **mandatory deployment step**. Non-compliant domains fall back to the browser extension (which bypasses CORS via host permissions).

---

## 3. Architecture & Screens

Client-side routed SPA. Locale is a path prefix (`/:lang/...`) for SEO and shareability.

| Route | Screen | Content |
|-------|--------|---------|
| `/:lang` | **Landing** | Hero, "what is hiring.txt", problem stats, generator + verifier CTAs |
| `/:lang/generator` | **Generator** | Interactive form → live `hiring.txt` preview with syntax highlighting |
| `/:lang/verify` | **Verifier** | Company + email + message → fetch + parse + heuristic verdict |
| `/:lang/spec` | **Spec** | Protocol specification: fields, wire format, verdicts, CORS |
| `/:lang/adopt` | **Adopt** | Step-by-step publishing guide with server configs (Nginx, Apache, Caddy) |

Root `/` → redirects to `/en` (default English, user switches explicitly).

### State Management

No heavy state library needed. Most state is local component state. Cross-screen needs (active language, theme) use a lightweight React Context. No data-fetch layer since there's no backend; the verifier uses direct `fetch` only.

---

## 4. Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Build | **Vite** | Fast, static output, minimal config |
| UI | **React 18 + TypeScript** | Type safety; parser/validator are pure functions |
| Routing | **React Router v7** | Path-based locale, `NavLink` active states, SPA fallback |
| i18n | **react-i18next** | Mature, namespace support, ICU/plural, RTL-compatible |
| Styling | **CSS Variables + CSS Modules** | Design System tokens directly; no framework dependency |
| Test | **Vitest** | Pure function + integration tests |
| Deploy | **Docker (Nginx Alpine)** | Multi-stage build, ~25MB production image |

Dependencies are intentionally minimal — static, fast, privacy-friendly.

---

## 5. Monorepo Structure

pnpm workspace monorepo. `@hireguard/core` contains all protocol logic as pure TypeScript with zero DOM dependencies — shared between web app and future browser extension.

```
hireguard/
├─ packages/core/                   # @hireguard/core — pure TS library
│  ├─ src/
│  │  ├─ parser.ts                  # hiring.txt → Tier0 (pure)
│  │  ├─ serializer.ts              # Tier0 → hiring.txt text (pure)
│  │  ├─ validator.ts               # Tier0 → ValidationError[] (pure)
│  │  ├─ heuristics.ts              # lookalike, free-mail, scam language (pure)
│  │  ├─ email-auth.ts              # Authentication-Results parse (pure)
│  │  ├─ verifier.ts                # orchestrator: fetch + parse + verdict
│  │  ├─ constants.ts               # Never tokens, patterns
│  │  └─ types.ts                   # Tier0, VerifyResult, etc.
│  └─ tests/                        # 52 unit tests
│
├─ apps/web/                        # @hireguard/web — React SPA
│  ├─ public/
│  │  ├─ .well-known/hiring.txt     # dogfooding: HireGuard publishes its own file
│  │  ├─ data/companies.json        # canonical domain registry (static)
│  │  ├─ favicon.svg                # shield + checkmark logo
│  │  └─ logo.png                   # full-size logo (OG image)
│  ├─ src/
│  │  ├─ design/
│  │  │  ├─ tokens.css              # Design System v1.0 color/spacing/motion tokens
│  │  │  └─ base.css                # Reset, typography, focus, accessibility
│  │  ├─ hooks/useDocumentTitle.ts   # Per-page SEO title
│  │  ├─ i18n.ts                    # 6 languages, static eager loading
│  │  ├─ locales/{en,tr,es,de,fr,ar}/
│  │  │  └─ {common,landing,generator,verify,spec,adopt}.json
│  │  ├─ components/LanguageSwitcher/
│  │  ├─ layouts/AppLayout.tsx       # Header, nav, mobile menu, footer
│  │  ├─ screens/{Landing,Generator,Verify,Spec,Adopt}/
│  │  ├─ router.tsx
│  │  └─ main.tsx
│  └─ index.html                    # SEO meta, OG tags, JSON-LD
│
├─ docs/
│  ├─ architecture.md               # this document
│  ├─ hiring-txt-spec.md            # protocol specification
│  └─ hiring-txt-tier0.schema.json  # JSON Schema for Tier 0
│
├─ Dockerfile                       # multi-stage: Node 22 → Nginx Alpine
├─ nginx.conf                       # gzip, SPA fallback, CORS, security headers
└─ pnpm-workspace.yaml
```

---

## 6. i18n Strategy

### Languages
**6 languages:** English (en), Türkçe (tr), Español (es), Deutsch (de), Français (fr), العربية (ar).

Arabic provides RTL validation from day one.

### Architecture
- **Source structure:** Per-locale namespaced JSON files.
- **Loading:** Static eager loading — all 6 languages × 6 namespaces bundled. Total ~60KB.
- **Detection:** No browser language sniffing. Default is `en`. User switches explicitly via dropdown; preference saved to `localStorage`.
- **RTL:** `ar/he/fa` set `<html dir="rtl">`. All CSS uses logical properties (`margin-inline`, `padding-inline-start`, `inset-inline`) — physical `left/right` is prohibited.
- **Translation boundary:** `hiring.txt` field names and `Never` tokens are machine-format — **never translated**. Only UI chrome, labels, and hints are translated.

---

## 7. Verifier Engine

```
Input: company name + sender email + job listing URL + (opt.) pasted email headers + (opt.) message text

1. Resolve canonical domain
   a. Match against companies.json (curated registry)
   b. If no match → ask user for official domain (with warning)

2. Fetch <canonical>/.well-known/hiring.txt (CORS required)
   - CORS blocked → show "try browser extension" fallback
   - 404/timeout → verdict: UNKNOWN

3. Parse + Tier 0 schema validate
   - Expires in past → verdict: UNKNOWN ("expired file")

4. Authoritative match:
   - Sender domain ∈ Canonical-Domains?
   - Channel ∈ Recruiting-Channels?
   - Application URL ∈ Application-URLs?

5. Email authentication (if headers pasted):
   - Parse Authentication-Results → DKIM/SPF/DMARC pass?

6. Never contradiction check:
   - Does message content violate any Never token?

7. Heuristics (client-side):
   - Lookalike domain (Levenshtein + homograph/IDN)
   - Free email provider detection
   - Payment/urgency/crypto language patterns

8. Verdict: VERIFIED | VERIFIED_CONTRADICTION | UNKNOWN | SUSPICIOUS
   + reasoning trace + actionable guidance
```

---

## 8. Build & Deploy

- **Build:** `pnpm build` → builds `@hireguard/core` first, then `@hireguard/web` → static `dist/`.
- **Docker:** Multi-stage Dockerfile. Stage 1: Node 22 Alpine + pnpm (monorepo-aware build). Stage 2: Nginx Alpine (~25MB final image).
- **Port:** 8080 (DigitalOcean App Platform default).
- **Nginx config:** Gzip, security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`), aggressive static asset caching (1 year, immutable), CORS for `hiring.txt`, SPA fallback (`try_files $uri /index.html`).
- **Dogfooding:** hireguard.org publishes its own `hiring.txt` — a living example and trust signal.

---

## 9. SEO

- **Meta tags:** Title, description, keywords, canonical URL, robots.
- **Open Graph:** Type, title, description, URL, site name, image, 6 locale alternates.
- **Twitter Card:** Summary large image with title, description, image.
- **Structured data:** JSON-LD `WebApplication` schema (free pricing, 6 languages).
- **Per-page titles:** `useDocumentTitle` hook sets `<title>` per screen.
- **Semantic HTML:** Single `<h1>` per page, proper heading hierarchy, `<nav>`, `<header>`, `<section>`.

---

## 10. Privacy & Security

- No backend → no data collection. This is explicitly stated in the UI (brand voice).
- No analytics, no cookies, no tracking.
- **CSP:** Strict `connect-src` — only same-origin + target domain fetches.
- Verifier processes pasted headers in memory only, never transmits them.

---

## 11. Testing

- **Pure core (most critical):** `serialize`, `validate`, `parser`, `heuristics`, `emailAuth` → 52 Vitest unit tests. These functions are UI-independent; they are the proof of protocol behavior.
- **i18n integrity:** All locales must contain the same key sets (CI check via `check-i18n.mjs`).

---

## 12. Roadmap

| Phase | Status | Deliverable |
|-------|--------|-------------|
| 0 | ✅ Done | Vite+React+TS scaffold, tokens.css, i18n (6 languages), router |
| 1 | ✅ Done | Generator screen (pure lib + UI) + Landing |
| 2 | ✅ Done | Spec + Adopt screens (CORS publishing guide) |
| 3 | ✅ Done | Verifier (registry + heuristics + email-auth + header parse) |
| 4 | 🔜 Next | PWA/offline + browser extension (CORS-independent universal verifier) |

---

*This document is read alongside the [Protocol Specification](./hiring-txt-spec.md) and [Tier 0 Schema](./hiring-txt-tier0.schema.json).*
