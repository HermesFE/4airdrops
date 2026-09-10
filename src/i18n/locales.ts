/**
 * UI locales. English default.
 * Set chosen for maintainable >80% internet-user coverage
 * (English L1/L2 plus major content languages: zh, es, pt, ar, id,
 * ru, ja, de, fr, ko, vi, tr, hi — Statcounter / ethnologue-style mix).
 */
export const localeCodes = ["en", "zh", "es", "pt", "ar", "id", "ru", "ja", "de", "fr", "ko", "vi", "tr", "hi"] as const;

export type Locale = (typeof localeCodes)[number];
export const defaultLocale: Locale = "en";

/**
 * Locales that get pre-rendered giveaway detail pages (`/{locale}/g/{id}`).
 * Cloudflare Pages caps a deployment at 20,000 files. Full 14-locale detail
 * SSG (~945 × 14 HTML + RSC payloads + `_next` assets) exceeds that.
 * Directory homes, about, and chrome stay on all `localeCodes`.
 * Expand this list when the catalog shrinks or hosting no longer has the cap.
 */
export const detailLocales = ["en", "zh", "es", "ja", "ko", "pt"] as const satisfies readonly Locale[];

export type DetailLocale = (typeof detailLocales)[number];

export const LOCALE_STORAGE_KEY = "4airdrops.locale";

export type LocaleMeta = {
  code: Locale;
  native: string;
  htmlLang: string;
  ogLocale: string;
  dir: "ltr" | "rtl";
};

export const localeMeta: Record<Locale, LocaleMeta> = {
  en: { code: "en", native: "English", htmlLang: "en", ogLocale: "en_US", dir: "ltr" },
  zh: { code: "zh", native: "中文", htmlLang: "zh-CN", ogLocale: "zh_CN", dir: "ltr" },
  es: { code: "es", native: "Español", htmlLang: "es", ogLocale: "es_ES", dir: "ltr" },
  pt: { code: "pt", native: "Português", htmlLang: "pt", ogLocale: "pt_BR", dir: "ltr" },
  ar: { code: "ar", native: "العربية", htmlLang: "ar", ogLocale: "ar_AR", dir: "rtl" },
  id: { code: "id", native: "Bahasa Indonesia", htmlLang: "id", ogLocale: "id_ID", dir: "ltr" },
  ru: { code: "ru", native: "Русский", htmlLang: "ru", ogLocale: "ru_RU", dir: "ltr" },
  ja: { code: "ja", native: "日本語", htmlLang: "ja", ogLocale: "ja_JP", dir: "ltr" },
  de: { code: "de", native: "Deutsch", htmlLang: "de", ogLocale: "de_DE", dir: "ltr" },
  fr: { code: "fr", native: "Français", htmlLang: "fr", ogLocale: "fr_FR", dir: "ltr" },
  ko: { code: "ko", native: "한국어", htmlLang: "ko", ogLocale: "ko_KR", dir: "ltr" },
  vi: { code: "vi", native: "Tiếng Việt", htmlLang: "vi", ogLocale: "vi_VN", dir: "ltr" },
  tr: { code: "tr", native: "Türkçe", htmlLang: "tr", ogLocale: "tr_TR", dir: "ltr" },
  hi: { code: "hi", native: "हिन्दी", htmlLang: "hi", ogLocale: "hi_IN", dir: "ltr" },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (localeCodes as readonly string[]).includes(value);
}

export function isDetailLocale(value: string | null | undefined): value is DetailLocale {
  return !!value && (detailLocales as readonly string[]).includes(value);
}

export function applyDocumentLocale(locale: Locale) {
  const meta = localeMeta[locale];
  document.documentElement.lang = meta.htmlLang;
  document.documentElement.dir = meta.dir;
}
