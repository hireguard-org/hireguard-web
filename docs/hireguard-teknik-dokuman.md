# HireGuard — Teknik Doküman
### `hireguard.org` · Frontend-only React SPA · v1.0

> Backend'siz, %100 client-side bir React tek-sayfa uygulaması. Tüm işlem tarayıcıda olur — "veri tarayıcıdan çıkmaz" ilkesi hem gizlilik hem de markanın özü. `hiring.txt` generator, sitenin bir ekranıdır. Asgari 5 dil (i18n) ile uluslararası benimseme kolaylaştırılır.

**Durum:** Mimari onay · **Stack:** Vite + React 18 + TypeScript + react-i18next · **Deploy:** statik (Cloudflare Pages / Netlify / Vercel)

---

## 1. Kısıtlar & İlkeler

- **Backend yok.** Sunucu durumu, veritabanı, API katmanı yok. Tüm mantık tarayıcıda. Sonuç: statik host'a deploy, sıfır sunucu maliyeti, sıfır veri toplama.
- **Gizlilik-by-design.** Generator girdileri ve verifier analizleri asla ağ üzerinden gönderilmez (verifier'ın hedef `hiring.txt`'i çekmesi hariç — o da kullanıcının kendi tarayıcısından).
- **i18n ≥ 5 dil.** UI çevrilir; makine-okur içerik (`hiring.txt` alan adları, `Never` token'ları) çevrilmez.
- **Offline-capable.** Generator internet olmadan da çalışır (PWA / service worker).
- **Tasarım sistemi:** HireGuard Design System v1.0 token'ları (`tokens.css`).

---

## 2. Neden Frontend-only Çalışır (ve Nerede Çalışmaz)

| Yetenek | Frontend-only mümkün mü? | Nasıl |
|---------|--------------------------|-------|
| `hiring.txt` üretme | ✔ Tamamen | Saf string üretimi, Blob indirme |
| Mesaj heuristikleri (ödeme dili, lookalike domain, ücretsiz mail) | ✔ | Client-side string/regex + opsiyonel client-side LLM API çağrısı |
| Yapıştırılan e-posta header'larından DKIM/SPF/DMARC okuma | ✔ | `Authentication-Results` header'ını parse et (kullanıcı yapıştırır) |
| Domain varlığı/yaşı sinyali | ✔ | DoH (DNS-over-HTTPS) JSON API'leri CORS-enabled (Cloudflare/Google) |
| **Rastgele domain'in `hiring.txt`'ini çekme** | ⚠ **Koşullu** | **CORS'a bağlı — aşağıya bak** |
| Canlı e-posta header okuma (kullanıcı yapıştırmadan) | ✘ | Tarayıcı erişemez → eklenti gerekir |

### 2.1 Kritik mesele: CORS

Bir web sayfası, `https://baska-firma.com/.well-known/hiring.txt` dosyasını `fetch` ile çekmeye çalıştığında, hedef sunucu `Access-Control-Allow-Origin` header'ı göndermiyorsa tarayıcı **bloklar**. Çoğu statik host varsayılan olarak göndermez. Yani saf-frontend verifier, rastgele domain'leri güvenilir şekilde çekemez.

**Çözüm (spec'e gömülü):** `hiring.txt` zaten kamuya açık veridir. Konvansiyon, yayıncılara bu yol için izin verici CORS şart koşar:

```
# Sunucu konfigürasyonunda /.well-known/hiring.txt için:
Access-Control-Allow-Origin: *
```

HireGuard generator çıktısı ve yayın rehberi bu satırı **zorunlu adım** olarak gösterir. Böylece uyumlu her `hiring.txt`, herhangi bir frontend tarafından doğrulanabilir — backend'e gerek kalmaz. CORS göndermeyen domain'ler için kullanıcı **tarayıcı eklentisine** yönlendirilir (eklenti host izniyle cross-origin çekebilir). Yani:

- **Web app (frontend-only):** CORS-uyumlu `hiring.txt`'leri doğrular + tüm generator + yapıştırılan header analizi.
- **Eklenti (sonraki faz):** CORS'tan bağımsız evrensel doğrulayıcı.

Bu, "asla CORS proxy/backend ekleme" ilkesini korur (proxy gizlilik ve güven kökünü bozardı).

---

## 3. Mimari & Ekranlar

Client-side routing'li SPA. Locale, path önekinde (`/:lang/...`) — SEO ve paylaşılabilirlik için query param'a tercih edilir.

| Route | Ekran | İçerik |
|-------|-------|--------|
| `/:lang` | **Landing** | Hero, "`hiring.txt` nedir", problem, generator + verifier CTA |
| `/:lang/generator` | **Generator** | Mevcut üretici, React'e port (sitenin bir ekranı) |
| `/:lang/verify` | **Verifier** | Domain/e-posta/mesaj → çek + parse + Tier 0 kararı |
| `/:lang/spec` | **Spec** | Protokol: Tier 0/1/2, alanlar, `.well-known` |
| `/:lang/adopt` | **Adopt** | Firmalar için yayın rehberi (CORS adımı dahil) |
| `/:lang/about` | **About** | Açık kaynak, yönetişim, lisans |

Kök `/` → tarayıcı diline göre tespit edip uygun `/:lang`'a redirect.

### State yönetimi
Ağır kütüphane gereksiz. Çoğu durum yerel component state. Çapraz-ekran ihtiyaç (aktif dil, tema) için tek bir hafif React Context. Backend olmadığı için veri-fetch katmanı yok; verifier'da yalnızca doğrudan `fetch`.

---

## 4. Teknoloji Yığını

| Katman | Seçim | Gerekçe |
|--------|-------|---------|
| Build | **Vite** | Hızlı, statik çıktı, sade |
| UI | **React 18 + TypeScript** | Tip güvenliği, parser/validasyon saf fonksiyonlar |
| Routing | **React Router** (data router) | Path-based locale, SPA fallback |
| i18n | **react-i18next** | Olgun, namespace lazy-load, ICU/plural, RTL uyumlu |
| Stil | **CSS değişkenleri + CSS Modules** | Design System token'ları doğrudan; framework bağımlılığı yok |
| Test | **Vitest + React Testing Library** | Saf fonksiyon + component testi |
| PWA | **vite-plugin-pwa** | Offline generator |

Bağımlılıklar bilinçli olarak minimal — statik, hızlı, gizlilik-dostu.

---

## 5. i18n Stratejisi

### Diller (asgari 5 + RTL doğrulaması)
Çekirdek 5: **English (en), Türkçe (tr), Español (es), Deutsch (de), Français (fr).**
Önerilen 6.: **العربية (ar)** — RTL'yi baştan mimariye dahil etmek için (sonradan eklemek pahalıdır). Sonraki dalga: ru, pt-BR, hi, zh.

### Mimari
- **Kaynak yapısı:** locale başına namespace'li JSON.
  ```
  src/locales/{en,tr,es,de,fr,ar}/{common,landing,generator,verify,spec}.json
  ```
- **Lazy load:** yalnızca aktif locale'in bundle'ı yüklenir (ağırlık düşük kalır).
- **Tespit:** tarayıcı dili → `en` fallback. Manuel switcher path'i değiştirir (`/tr/...`), tercih `localStorage`'a yazılır (bu gerçek uygulama, artifact değil — storage serbest).
- **RTL:** `ar/he/fa` için `<html dir="rtl">`. **Tüm CSS mantıksal özellik kullanır** (`margin-inline`, `padding-inline-start`, `inset-inline`) — fiziksel `left/right` yasak. Design System token'ları buna göre güncellenir.
- **Çevrilmeyen sınır:** `hiring.txt` alan adları (`Canonical-Domains` vb.) ve `Never` token'ları makine formatının parçası → **asla çevrilmez**. Sadece UI chrome, açıklama, hint çevrilir. Generator çıktısı her dilde aynıdır.

### Kurulum (özet)
```ts
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

const SUPPORTED = ['en','tr','es','de','fr','ar'] as const;
const RTL = new Set(['ar','he','fa']);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .use(resourcesToBackend((lng: string, ns: string) =>
    import(`./locales/${lng}/${ns}.json`)))
  .init({
    supportedLngs: SUPPORTED,
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = RTL.has(lng) ? 'rtl' : 'ltr';
});

export { SUPPORTED, RTL };
```

```tsx
// LanguageSwitcher.tsx (öz)
const { i18n } = useTranslation();
return SUPPORTED.map(l => (
  <button key={l} aria-pressed={i18n.language===l}
    onClick={() => { i18n.changeLanguage(l); navigate(`/${l}${rest}`); }}>
    {LABELS[l]}
  </button>
));
```

---

## 6. Generator Ekranı (React'e Port)

Mevcut HTML mantığı React component'lerine taşınır. Validasyon ve string üretimi **saf fonksiyonlar** (test edilebilir, UI'dan bağımsız).

```ts
// lib/hiringTxt.ts  (saf, test edilebilir)
export interface Tier0 {
  canonicalDomains: string[]; recruitingChannels: string[];
  applicationUrls: string[]; never: string[];
  verifyContact: string; reportAbuse: string;
  policy?: string; verifiedRecruiters?: string[];
  expires: string; lastUpdated?: string;
}
export function validate(d: Tier0): string[] { /* kurallar → hata listesi */ }
export function serialize(d: Tier0): string { /* Tier0 → hiring.txt metni */ }
```

```tsx
// screens/Generator.tsx (öz)
const [data, setData] = useState<Tier0>(DEFAULTS);
const text = useMemo(() => serialize(data), [data]);
const errors = useMemo(() => validate(data), [data]);
// sol: form + Never chip'leri | sağ: <CodeBlock text={text}/> (sticky)
// Kopyala: navigator.clipboard | İndir: Blob + a[download="hiring.txt"]
```

- Form alanları çevrili (label/hint), **çıktı çevrilmez**.
- İndirme + kopyalama tamamen client-side; offline çalışır.
- Çıktıya CORS hatırlatması: "Sunucunda bu yola `Access-Control-Allow-Origin: *` ekle."

---

## 7. Verifier Ekranı (Backend'siz)

```
Girdi: firma adı + gönderen e-posta/handle + ilan linki + (ops.) yapıştırılan e-posta header'ı
1. Kanonik domain'i çöz:
   a. Bundlanmış statik registry (companies.json) ile eşle
   b. Yoksa kullanıcıdan resmî domain iste (uyarıyla)
2. <canonical>/.well-known/hiring.txt fetch (CORS varsa)
   - CORS yoksa: "Eklentiyle doğrula" yönlendirmesi
3. Parse + JSON Schema (Tier 0) doğrula; Expires geçmişse "unverifiable"
4. Karşılaştır: gönderen domain ∈ Canonical-Domains? kanal ∈ Recruiting-Channels?
5. Heuristikler (client-side): lookalike (Levenshtein/homograph), ücretsiz mail,
   ödeme/kripto/aciliyet dili, başvurmadığın işe davet
6. Yapıştırılan header'dan Authentication-Results → DKIM/SPF/DMARC pass
7. Karar: VERIFIED | UNKNOWN | SUSPICIOUS + gerekçe + "ne yapmalı"
```

- **Kanonik domain registry:** `public/data/companies.json` — açık kaynak, topluluk PR'larıyla güncellenen statik liste. Backend yok; build'e dahil veya CORS-enabled statik CDN'den çekilir.
- **Scam-intelligence:** raporlanan domain/profil havuzunun statik snapshot'ı aynı şekilde bundlanır/çekilir. (Dinamik katman ileride değer katmanında.)
- **DoH:** domain yaşı/varlığı için `https://cloudflare-dns.com/dns-query` (JSON, CORS-enabled).

---

## 8. Proje Yapısı

```
hireguard/
├─ public/
│  ├─ .well-known/hiring.txt        # dogfooding: HireGuard kendi dosyasını yayınlar
│  └─ data/companies.json           # kanonik domain registry (statik)
├─ src/
│  ├─ design/tokens.css             # Design System v1.0
│  ├─ i18n.ts
│  ├─ locales/{en,tr,es,de,fr,ar}/*.json
│  ├─ lib/
│  │  ├─ hiringTxt.ts               # serialize + validate (saf)
│  │  ├─ parser.ts                  # hiring.txt → Tier0 (saf)
│  │  ├─ heuristics.ts              # lookalike, free-mail, scam-dili (saf)
│  │  └─ emailAuth.ts               # Authentication-Results parse (saf)
│  ├─ components/  (CodeBlock, Chip, Button, Field, StatusLine, LanguageSwitcher…)
│  ├─ screens/     (Landing, Generator, Verify, Spec, Adopt, About)
│  ├─ router.tsx
│  └─ main.tsx
├─ tests/          (vitest: lib/*.test.ts, component testleri)
├─ vite.config.ts
└─ index.html
```

---

## 9. Build & Deploy

- `vite build` → statik `dist/`. Cloudflare Pages / Netlify / Vercel / GitHub Pages.
- **SPA fallback:** tüm route'lar `index.html`'e (Netlify `_redirects: /* /index.html 200`, Cloudflare Pages otomatik).
- **CORS header'ları:** kendi `/.well-known/hiring.txt` ve `/data/*.json` için `Access-Control-Allow-Origin: *` (Netlify `_headers` / CF rules).
- **Dogfooding:** hireguard.org kendi `hiring.txt`'ini yayınlar — yaşayan örnek + güven sinyali.

```
# public/_headers (Netlify/Cloudflare)
/.well-known/hiring.txt
  Access-Control-Allow-Origin: *
/data/*
  Access-Control-Allow-Origin: *
```

---

## 10. Gizlilik & Güvenlik

- Backend yok → veri toplama yok. Bunu UI'da açıkça beyan et (marka sesi).
- Analytics yoksa en iyisi; gerekirse gizlilik-dostu (cookieless, self-host).
- **CSP** sıkı: `connect-src` yalnızca DoH endpoint'i + aynı origin. SRI tüm CDN varlıklarında.
- Verifier yapıştırılan header'ı yalnızca bellekte işler, asla yollamaz.

---

## 11. Test

- **Saf çekirdek (en kritik):** `serialize`, `validate`, `parser`, `heuristics`, `emailAuth` → Vitest birim testleri. Bu fonksiyonlar UI'dan bağımsız; protokol davranışının kanıtı bunlardır.
- **Component:** RTL render, dil değişimi, RTL yön kontrolü.
- **i18n bütünlük testi:** her locale aynı anahtar setini içeriyor mu (eksik çeviri CI'da fail).

---

## 12. PWA / Offline

`vite-plugin-pwa` ile service worker. Generator ve Spec ekranları tam offline çalışır (statik). Verifier offline'da yalnızca yapıştırılan-içerik analizini yapar, uzak fetch'i devre dışı bırakır. "No backend" felsefesinin doğal uzantısı.

---

## 13. Riskler & Açık Sorular

- **Arbitrary-domain CORS:** Spec-CORS şartıyla çözüldü; uyumsuz domain'ler eklentiye düşer. Eklenti, web app'in tamamlayıcısı olarak yol haritasında net konumlanmalı.
- **Kanonik registry bakımı:** Statik liste topluluk katkısıyla büyür; ölçek arttıkça güncelleme süreci (PR + doğrulama) tanımlanmalı.
- **Çeviri kaynağı:** İlk 5 dil için profesyonel/topluluk çeviri; i18n bütünlük testi eksikleri yakalar.
- **Lookalike tespiti** client-side; homograph/IDN saldırıları için Unicode confusable tablosu bundlanmalı (boyut etkisi).

---

## 14. Faz Planı

| Faz | Çıktı |
|-----|-------|
| 0 | Vite+React+TS iskelet, tokens.css, i18n (6 dil scaffold), router |
| 1 | **Generator ekranı** (saf lib + UI) + Landing — ilk yayın |
| 2 | Spec + Adopt ekranları (CORS yayın rehberi) |
| 3 | Verifier (registry + heuristik + header parse) |
| 4 | PWA/offline + i18n çeviri tamamlama |
| 5 | Tarayıcı eklentisi (CORS-bağımsız evrensel doğrulama) |

---

*Bu doküman, HireGuard Design System v1.0 ve `hiring.txt` Protokol Dokümanı v0.1 ile birlikte okunur.*
