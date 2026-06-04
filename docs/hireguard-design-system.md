# HireGuard — Tasarım Sistemi
### `hireguard.org` · v1.0

> Sahte İK dolandırıcılığına karşı açık, domain-köklü doğrulama. Marka dili: **rafine teknik / terminal-config estetiği** — güveni gürültüyle değil, mühendislik netliğiyle ileten karanlık bir arayüz. Bu doküman generator'da kurulan görsel dili tüm `hireguard.org` yüzeylerine (landing, generator, verifier, docs) taşır.

**Durum:** Onaylı temel · **Tema:** Dark-first · **Kaynak referans:** `hiring-txt-generator.html`

---

## 1. Marka Temeli

HireGuard, `hiring.txt` açık konvansiyonunu geliştiren ve doğrulayan organizasyon/araçtır. Markanın taşıması gereken his: **doğrulanmış, sakin, mühendis tarafından mühendis için.** Korku pazarlamayan ama otorite hisseden bir güvenlik aracı.

**Kavramsal yön:** "Terminalde kök salmış yeşil tik." Bir config dosyası kadar dürüst, bir CLI kadar net. Süsleme değil, kanıt.

### Marka Kişiliği
- **Kesin** — belirsizlik yok; her şey ya geçerli ya değil.
- **Sakin** — alarm rengi değil, güven yeşili dominant.
- **Şeffaf** — açık kaynak ruhu; gizli sihir yok, görünür mantık var.
- **Developer-native** — monospace, config dosyaları, well-known yollar markanın dokusudur.

---

## 2. Tasarım İlkeleri

1. **Domain-köklü = görsel otorite.** "Doğrulandı" durumu sayfanın en güçlü görsel anıdır (yeşil, glow, net tik). Otorite görsel olarak hak edilir.
2. **Dominant karanlık + keskin tek aksan.** Dağıtılmış, çekingen paletler yerine near-black zemin üzerinde tek bir yeşil aksan. Aksan nadir kullanılır, bu yüzden güçlüdür.
3. **Sakin, alarmist değil.** Tehdit anlatımı kırmızıyla değil sarı (warn) ve nötr dille. Kırmızı yalnızca gerçek hata/danger için.
4. **Kanıt > dekorasyon.** Her görsel öğe bir bilgi taşır (durum, doğrulama, sözdizimi). Boş süs yok.
5. **Aşamalı netlik.** Sayfa yüklenirken staggered reveal; göz önce başlığa, sonra forma, sonra çıktıya yönlenir.
6. **Developer dokusu.** 44px grid zemin, monospace, well-known yol göstergeleri — markanın imzası.

---

## 3. Renk Sistemi

Dark-first. Aksan disiplinli kullanılır: zeminin %90'ı nötr, aksan yalnızca durum/eylem/vurgu için.

### Çekirdek Token'lar

| Token | Hex | Rol |
|-------|-----|-----|
| `--bg` | `#0a0c10` | Sayfa zemini (near-black, hafif mavi) |
| `--panel` | `#11151c` | Kart zemini (üst) |
| `--panel-2` | `#161b24` | Kart zemini (alt — gradient için) |
| `--line` | `#222a36` | Kenarlık / ayraç |
| `--line-soft` | `#1a212b` | Grid çizgileri, yumuşak ayraç |
| `--text` | `#dfe6f0` | Birincil metin |
| `--muted` | `#79869a` | İkincil metin, etiketler |
| `#586277` | `#586277` | Üçüncül / hint / yorum |

### Semantik Renkler

| Token | Hex | Anlam | Kullanım |
|-------|-----|-------|----------|
| `--accent` | `#4ade80` | Doğrulandı / eylem / marka | Birincil buton, tik, vurgu, glow |
| `--accent-dim` | `#1f5e3a` | Aksan kenarlık (sönük) | Badge border, sönük çerçeve |
| `--warn` | `#fbbf24` | Dikkat / belirsiz | Eksik alan, UNKNOWN/uyarı durumu |
| `--danger` | `#f87171` | Hata / sahte | Geçersiz girdi, SUSPICIOUS durumu |

### Sözdizimi Renklendirme (kod/preview blokları)

| Öğe | Hex |
|-----|-----|
| Anahtar (key) | `#8ab4ff` (mavi) |
| Değer (value) | `#dfe6f0` |
| Yorum / `#` satırı | `#586277` |
| Sayı / aksan vurgu | `#4ade80` |

### Doğrulama Durum Renkleri (verifier için)
- **VERIFIED** → `--accent` (#4ade80) + glow
- **UNKNOWN** → `--warn` (#fbbf24), nötr ton
- **SUSPICIOUS** → `--danger` (#f87171)

**Kural:** Kırmızıyı yalnızca gerçek olumsuz/hata için sakla. Belirsizlik daima sarıdır, yeşil değil. Aksan yeşili büyük dolgu alanlarında kullanma (yalnızca buton, tik, ince vurgu).

---

## 4. Tipografi

İki aile. Display karakter katar, mono dokuyu kurar.

| Rol | Aile | Ağırlıklar |
|-----|------|-----------|
| Display (başlık, etiket, buton) | **Bricolage Grotesque** | 400 / 600 / 800 |
| Body / mono (gövde, input, kod, çıktı) | **JetBrains Mono** | 400 / 500 / 700 |

```
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=JetBrains+Mono:wght@400;500;700&display=swap');
```

### Tip Ölçeği

| Stil | Boyut | Aile / Ağırlık | Not |
|------|-------|----------------|-----|
| H1 / wordmark | `clamp(34px, 6vw, 56px)` | Bricolage 800 | `letter-spacing:-.02em`, line-height 1 |
| H2 / bölüm başlığı | 13px | Bricolage 600 | UPPERCASE, `letter-spacing:.12em`, muted + aksan tik |
| Etiket (label) | 11px | JetBrains 500 | UPPERCASE, `letter-spacing:.06em`, muted |
| Badge / pill | 11px | JetBrains | UPPERCASE, `letter-spacing:.14em`, aksan |
| Gövde | 13–14px | JetBrains 400 | line-height 1.5–1.6 |
| Kod / çıktı | 12.5px | JetBrains 400 | line-height 1.7 |
| Hint | 11px | JetBrains 400 | `#586277` |

**Kural:** Etiket ve bölüm başlıkları daima UPPERCASE + tracked (geniş harf aralığı). Gövde ve kod normal. Generic font (Inter, Roboto, Arial, system) **kullanma**.

---

## 5. Aralık & Yerleşim

- **Container:** max-width `1180px`, yatay padding `24px`.
- **Aralık skalası (px):** `6 · 8 · 10 · 14 · 18 · 22 · 24 · 34 · 38`. Bölüm içi 18, kartlar arası 24, header altı 34.
- **Grid motifi:** Zeminde `44px × 44px` ince grid çizgileri (`--line-soft`), üstte sağ-üstten radyal yeşil glow. Bu markanın imza dokusu — tüm sayfalarda tutarlı.
- **İki kolon → stack:** Generator deseni (form | sticky preview) `880px` altında tek kolona iner. Çıktı/sonuç paneli `position:sticky; top:24px`.
- **Kart deseni:** İçerik kartlarda toplanır — `linear-gradient(180deg, --panel, --panel-2)`, 1px `--line` kenarlık, 14px radius, 22px iç padding.

---

## 6. Köşe, Kenarlık, Yükseklik

| Öğe | Radius |
|-----|--------|
| Kart | 14px |
| Kod/preview blok | 10px |
| Input / textarea / buton | 9–10px |
| Chip | 8px |
| Badge / pill | 999px |

- **Kenarlık:** 1px `--line`; hover'da `#2f3a49`/`#33414f`'e doğru hafif aydınlanır.
- **Elevation:** Düz gölge yerine kenarlık + gradient panel ile derinlik. Gölge yalnızca birincil eylemde: `0 6px 20px rgba(74,222,128,.22)`.
- **Glow:** Aksan glow (`box-shadow`/`text-shadow` ile) yalnızca "doğrulandı" ve marka noktası için.

---

## 7. Zemin & Atmosfer

Düz solid zemin **kullanma**. Her sayfa şu katmanları taşır:
1. Near-black taban (`--bg`).
2. Sağ-üstte radyal yeşil glow: `radial-gradient(900px 500px at 85% -10%, rgba(74,222,128,.07), transparent 60%)`.
3. İnce 44px grid çizgileri (`--line-soft`).

Bu üçlü, terminal-config kimliğini her ekranda taşıyan sabit dokudur.

---

## 8. Bileşenler

### Badge / Pill
Aksan kenarlıklı, sönük yeşil zeminli durum etiketi. Sol başında glow'lu nokta (`--accent`, `box-shadow:0 0 8px`). UPPERCASE tracked metin. Kullanım: bölüm üstü bağlam etiketi.

### Butonlar
- **Primary:** Dolgu `--accent`, metin `#04140a`, hover'da `#5ee894` + yeşil glow. Birincil eylem (indir, doğrula).
- **Secondary:** `#0c0f15` zemin, `--line` kenarlık, metin `--text`; hover'da kenarlık aydınlanır. (kopyala vb.)
- **Disabled:** `opacity:.4`, `not-allowed`. Form geçersizken eylem kilitli.
- Font: Bricolage 600, `letter-spacing:.04em`.

### Input / Textarea
Zemin `#0c0f15`, 1px `--line`, mono 13px. **Focus:** aksan kenarlık + `0 0 0 3px rgba(74,222,128,.13)` ring. **Error:** danger kenarlık + kırmızı ring. Placeholder `#3f4858`. Liste girdileri için "satır başına bir değer" textarea deseni.

### Toggle Chip (Never beyanları)
Pasif: nötr `#0c0f15` + muted metin, başında `+`. Aktif (`aria-pressed=true`): aksan kenarlık + sönük yeşil zemin + aksan metin, başında `✓`. Çoklu seçim için.

### Kod / Preview Blok
En koyu zemin `#06080b`, 1px `--line`, 10px radius. Sözdizimi renklendirmesi (§3). `white-space:pre-wrap`, line-height 1.7. Markanın merkezî öğesi — çıktı daima bu blokta yaşar.

### Durum Satırı (status)
İkon + kısa metin. **ok:** `--accent`, `✓`. **err/uyarı:** `--warn`, `⚠` + eksik sayısı. Verifier'da üç durumlu karara genişler.

### Bölüm Başlığı (H2)
UPPERCASE tracked, `--muted`, **önünde** 14px × 2px aksan tik (`::before`). Her içerik bloğunu işaretler.

---

## 9. Hareket (Motion)

Restraint esas — araç bu, gösteri değil. Yüksek etkili tek an: sayfa yükü.

- **Giriş:** `rise` keyframe — `translateY(10px)` + opacity 0→1, `0.6s ease`. **Staggered:** header `.05s`, form kartı `.12s`, çıktı kartı `.2s`.
- **Geçişler:** kenarlık/box-shadow `.14–.15s`. Focus, hover, chip toggle hep yumuşak.
- **Mikro-etkileşim:** kopyala → "✓ Kopyalandı" geri bildirimi (1.4s). Buton hover'da glow.
- **`prefers-reduced-motion`:** animasyonları kapat (erişilebilirlik — implementasyonda eklenecek).

---

## 10. İkonografi & Semboller

İkon kütüphanesi yerine **monospace glyph** kullan — markanın terminal kimliğine uyar:
`✓` (doğrulandı) · `⚠` (uyarı) · `⧉` (kopyala) · `↓` (indir) · `•`/glow nokta (canlı/marka) · `+` (ekle/pasif chip).

Tutarlılık için ileride ince çizgi (1.5px stroke) bir ikon seti gerekirse Lucide tercih edilir; ama varsayılan glyph.

---

## 11. Logo / Wordmark

- **Wordmark:** `hireguard` — Bricolage Grotesque 800, lowercase, `letter-spacing:-.02em`. Aksan dokunuşu: ya `guard` hecesi `--accent` ile, ya da sonda glow'lu kare imleç/blok (`▍`) ile terminal hissi.
- **Konvansiyon wordmark:** `hiring` + `.txt` (yeşil) — generator'daki H1 deseni. HireGuard ürünü, `hiring.txt` standardını taşır; ikisi tutarlı tipografi paylaşır.
- **Lockup:** Wordmark + sol başında glow'lu nokta (badge'deki gibi) veya minimal kalkan/tik monogram.
- **Favicon:** Near-black kare, yeşil `✓` veya `▍` imleç.

> SVG logo + favicon ayrı bir çıktı olarak üretilebilir.

---

## 12. Ses & İçerik

- **Dil:** UI varsayılan Türkçe; kamuya açık spec/repo İngilizce (uluslararası benimseme için). Site iki dilli sunulabilir.
- **Ton:** Kesin, sakin, teknik açıdan güvenilir. Korku pazarlamak yok ("DOLANDIRILDINIZ MI?!" değil). Kanıt sunan, yönlendiren dil ("Bu firma `hiring.txt` yayınlamıyor; resmî siteden teyit et").
- **Terminoloji:** `hiring.txt`, `.well-known`, canonical domain, Tier 0/1/2, VERIFIED/UNKNOWN/SUSPICIOUS — büyük/küçük harf ve yazımda tutarlı kal.

---

## 13. Erişilebilirlik

- Metin/zemin kontrastı: `--text` üzerine `--bg` yüksek kontrast; `--muted` yalnızca ikincil bilgide.
- Focus daima görünür (aksan ring) — asla `outline:none` tek başına bırakma.
- Dokunma hedefi min ~40px yükseklik (butonlar ~44px).
- `prefers-reduced-motion` desteği zorunlu.
- Renk tek sinyal olmasın: durumlar renk + glyph + metinle birlikte verilir.

---

## 14. Yap / Yapma

**Yap:** Dark-first kal · aksanı nadir ve anlamlı kullan · grid + glow dokusunu her sayfada taşı · monospace çıktı bloğunu merkeze al · UPPERCASE tracked etiketler · staggered yükleme.

**Yapma:** Mor gradient / beyaz zemin · generic font (Inter/Roboto/Arial/system) · büyük yeşil dolgu alanları · kırmızıyı belirsizlik için kullanmak · düz solid zemin · dağıtılmış çok-renkli palet · alarmist dil.

---

## 15. Implementasyon — Hazır Token Bloğu

```css
:root{
  --bg:#0a0c10;
  --panel:#11151c;
  --panel-2:#161b24;
  --line:#222a36;
  --line-soft:#1a212b;
  --text:#dfe6f0;
  --muted:#79869a;
  --subtle:#586277;
  --accent:#4ade80;
  --accent-dim:#1f5e3a;
  --warn:#fbbf24;
  --danger:#f87171;
  /* syntax */
  --syn-key:#8ab4ff;
  --syn-val:#dfe6f0;
  --syn-comment:#586277;
  /* type */
  --disp:'Bricolage Grotesque',sans-serif;
  --mono:'JetBrains Mono',ui-monospace,monospace;
  /* radius */
  --r-card:14px; --r-block:10px; --r-input:9px; --r-chip:8px; --r-pill:999px;
  /* motion */
  --ease:cubic-bezier(.2,.6,.2,1);
}
body{
  background:var(--bg);color:var(--text);font-family:var(--mono);
  background-image:
    radial-gradient(900px 500px at 85% -10%, rgba(74,222,128,.07), transparent 60%),
    linear-gradient(var(--line-soft) 1px, transparent 1px),
    linear-gradient(90deg, var(--line-soft) 1px, transparent 1px);
  background-size:auto, 44px 44px, 44px 44px;
}
```

**Önerilen repo yapısı:** `design/design-system.md` (bu doküman) · `design/tokens.css` · `design/styleguide.html` (canlı örnekler) · marka varlıkları `design/brand/`.
