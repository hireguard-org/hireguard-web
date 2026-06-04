<p align="center">
  <img src="apps/web/public/favicon.svg" width="64" height="64" alt="HireGuard">
</p>

<h1 align="center">HireGuard</h1>

<p align="center">
  Open recruiter verification protocol.<br>
  Generate, publish, and verify <code>hiring.txt</code> files to protect candidates from recruitment fraud.
</p>

<p align="center">
  <a href="https://hireguard.org">Website</a> ·
  <a href="docs/hiring-txt-spec.md">Protocol Spec</a> ·
  <a href="docs/architecture.md">Architecture</a>
</p>

---

## What is `hiring.txt`?

A plain text file that companies publish at `/.well-known/hiring.txt` to declare their legitimate recruitment practices — official domains, channels, application URLs, and things they'll **never** ask candidates to do.

```
# https://acme.com/.well-known/hiring.txt
Canonical-Domains: acme.com, careers.acme.com
Recruiting-Channels: https://linkedin.com/company/acme
Application-URLs: https://careers.acme.com/jobs
Never: payment, crypto, gift-cards, whatsapp-first-contact
Verify-Contact: mailto:verify@acme.com
Report-Abuse: mailto:abuse@acme.com
Expires: 2027-06-01T00:00:00Z
```

Think `robots.txt` for crawlers, `security.txt` for vulnerabilities, `ads.txt` for ad fraud — `hiring.txt` for recruitment.

## Why

- **$501M** lost to job scams in the US in 2024 (FTC)
- Job scam reports **doubled** in 2025 (BBB)
- CrowdStrike's recruitment team was impersonated to install crypto miners
- North Korea's Lazarus Group runs fake developer interviews to deploy malware

There is no standard way for candidates to verify whether a recruiter actually represents a company. `hiring.txt` fixes that.

## Features

| Feature | Description |
|---------|-------------|
| **Generator** | Interactive form → live `hiring.txt` preview with syntax highlighting |
| **Verifier** | Enter company + recruiter email → VERIFIED / UNKNOWN / SUSPICIOUS verdict |
| **Heuristics** | Detects payment requests, crypto language, lookalike domains, free email providers |
| **Email Auth** | Paste `Authentication-Results` headers → DKIM/SPF/DMARC verification |
| **6 Languages** | English, Türkçe, Español, Deutsch, Français, العربية (RTL supported) |
| **Zero Tracking** | No backend, no analytics, no cookies. Everything runs in the browser. |

## Project Structure

```
hireguard/
├─ packages/core/        # @hireguard/core — pure TS: parser, serializer, validator, heuristics, verifier
├─ apps/web/             # @hireguard/web — React SPA (Vite + TypeScript + CSS Modules)
├─ docs/                 # Protocol spec, architecture, JSON schema
├─ Dockerfile            # Multi-stage: Node 22 → Nginx Alpine (~25MB)
└─ nginx.conf            # Gzip, CORS, security headers, SPA fallback
```

## Quick Start

```bash
# Prerequisites: Node ≥18, pnpm

# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run tests (52 unit tests)
pnpm test

# Production build
pnpm build
```

## Docker

```bash
docker build -t hireguard .
docker run -p 8080:8080 hireguard
```

The production image is ~25MB (Nginx Alpine) and listens on port 8080.

## Publishing a `hiring.txt`

1. **Generate** your file at [hireguard.org](https://hireguard.org)
2. **Place** it at `/.well-known/hiring.txt` on your domain
3. **Add CORS header** — required for browser-based verification:

```
Access-Control-Allow-Origin: *
```

Server configs for Nginx, Apache, Caddy, and static hosts are available in the [Adopt](https://hireguard.org/en/adopt) guide.

## Documentation

| Document | Description |
|----------|-------------|
| [Protocol Spec](docs/hiring-txt-spec.md) | Wire format, parsing rules, verification logic, Never tokens, ADRs |
| [Architecture](docs/architecture.md) | Technical architecture, i18n strategy, verifier engine, deploy |
| [Tier 0 Schema](docs/hiring-txt-tier0.schema.json) | JSON Schema for the `hiring.txt` data model |

## Tech Stack

- **Build:** Vite
- **UI:** React 18 + TypeScript
- **Routing:** React Router v7
- **i18n:** react-i18next (6 languages × 6 namespaces)
- **Styling:** CSS Variables + CSS Modules
- **Testing:** Vitest (52 tests)
- **Deploy:** Docker (Nginx Alpine) on DigitalOcean

## Contributing

`hiring.txt` is an open protocol. Contributions welcome:

- **Company registry:** Add companies to `apps/web/public/data/companies.json`
- **Translations:** Add or improve translations in `apps/web/src/locales/`
- **Never tokens:** Propose new well-known tokens via PR
- **Heuristics:** Improve scam detection patterns in `packages/core/src/heuristics.ts`

## License

MIT

---

<p align="center">
  <sub>hiring.txt is an open protocol. HireGuard provides the tooling. There is no paid plan. There never will be.</sub>
</p>
