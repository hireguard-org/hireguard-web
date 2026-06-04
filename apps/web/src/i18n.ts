import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LANGUAGES = ['en', 'tr', 'es', 'de', 'fr', 'ar'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const RTL_LANGUAGES = new Set<string>(['ar', 'he', 'fa']);

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  tr: 'Türkçe',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  ar: 'العربية',
};

// ── Eager imports — all locales bundled statically ──
// Total footprint ~60 KB uncompressed across 6 languages × 6 namespaces.
// This eliminates async loading race conditions on language switch.

import enCommon from './locales/en/common.json';
import enLanding from './locales/en/landing.json';
import enGenerator from './locales/en/generator.json';
import enSpec from './locales/en/spec.json';
import enAdopt from './locales/en/adopt.json';
import enVerify from './locales/en/verify.json';

import trCommon from './locales/tr/common.json';
import trLanding from './locales/tr/landing.json';
import trGenerator from './locales/tr/generator.json';
import trSpec from './locales/tr/spec.json';
import trAdopt from './locales/tr/adopt.json';
import trVerify from './locales/tr/verify.json';

import esCommon from './locales/es/common.json';
import esLanding from './locales/es/landing.json';
import esGenerator from './locales/es/generator.json';
import esSpec from './locales/es/spec.json';
import esAdopt from './locales/es/adopt.json';
import esVerify from './locales/es/verify.json';

import deCommon from './locales/de/common.json';
import deLanding from './locales/de/landing.json';
import deGenerator from './locales/de/generator.json';
import deSpec from './locales/de/spec.json';
import deAdopt from './locales/de/adopt.json';
import deVerify from './locales/de/verify.json';

import frCommon from './locales/fr/common.json';
import frLanding from './locales/fr/landing.json';
import frGenerator from './locales/fr/generator.json';
import frSpec from './locales/fr/spec.json';
import frAdopt from './locales/fr/adopt.json';
import frVerify from './locales/fr/verify.json';

import arCommon from './locales/ar/common.json';
import arLanding from './locales/ar/landing.json';
import arGenerator from './locales/ar/generator.json';
import arSpec from './locales/ar/spec.json';
import arAdopt from './locales/ar/adopt.json';
import arVerify from './locales/ar/verify.json';

const resources = {
  en: { common: enCommon, landing: enLanding, generator: enGenerator, spec: enSpec, adopt: enAdopt, verify: enVerify },
  tr: { common: trCommon, landing: trLanding, generator: trGenerator, spec: trSpec, adopt: trAdopt, verify: trVerify },
  es: { common: esCommon, landing: esLanding, generator: esGenerator, spec: esSpec, adopt: esAdopt, verify: esVerify },
  de: { common: deCommon, landing: deLanding, generator: deGenerator, spec: deSpec, adopt: deAdopt, verify: deVerify },
  fr: { common: frCommon, landing: frLanding, generator: frGenerator, spec: frSpec, adopt: frAdopt, verify: frVerify },
  ar: { common: arCommon, landing: arLanding, generator: arGenerator, spec: arSpec, adopt: arAdopt, verify: arVerify },
};

/**
 * Detect initial language from URL path (/:lang/...) or localStorage.
 */
function detectInitialLanguage(): string {
  const pathLang = window.location.pathname.split('/')[1];
  if (pathLang && (SUPPORTED_LANGUAGES as readonly string[]).includes(pathLang)) {
    return pathLang;
  }
  const stored = localStorage.getItem('i18nextLng');
  if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
    return stored;
  }
  // Default to English — users can switch via the language selector
  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectInitialLanguage(),
    supportedLngs: [...SUPPORTED_LANGUAGES],
    fallbackLng: 'en',
    ns: ['common', 'landing', 'generator', 'spec', 'adopt', 'verify'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng: string) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = RTL_LANGUAGES.has(lng) ? 'rtl' : 'ltr';
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;
