/** Shared URL helpers for the static sitemap (keep in sync with src/i18n/paths.ts). */

export const SITE_ORIGIN = "https://4airdrops.com";

export const LOCALE_CODES = [
  "en",
  "zh",
  "es",
  "pt",
  "ar",
  "id",
  "ru",
  "ja",
  "de",
  "fr",
  "ko",
  "vi",
  "tr",
  "hi",
];

export const DEFAULT_LOCALE = "en";

/** Must match `detailLocales` in src/i18n/locales.ts (Cloudflare 20k-file cap). */
export const SSG_DETAIL_LOCALES = ["en", "zh", "es", "ja", "ko", "pt"];

/** Must match `localeMeta[code].htmlLang` in src/i18n/locales.ts */
export const HTML_LANG = {
  en: "en",
  zh: "zh-CN",
  es: "es",
  pt: "pt",
  ar: "ar",
  id: "id",
  ru: "ru",
  ja: "ja",
  de: "de",
  fr: "fr",
  ko: "ko",
  vi: "vi",
  tr: "tr",
  hi: "hi",
};

export function localePath(locale, rest = "/") {
  const suffix = !rest || rest === "/" ? "" : rest.startsWith("/") ? rest : `/${rest}`;
  return `/${locale}${suffix}`;
}

export function absoluteUrl(locale, rest = "/") {
  return `${SITE_ORIGIN}${localePath(locale, rest)}`;
}

export function giveawayRestPath(id) {
  return `/g/${encodeURIComponent(id)}`;
}

export function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isGiveawayDetailRest(rest) {
  return typeof rest === "string" && rest.startsWith("/g/");
}

export function xhtmlLinks(rest = "/", locales = isGiveawayDetailRest(rest) ? SSG_DETAIL_LOCALES : LOCALE_CODES) {
  const links = locales.map(
    (code) =>
      `    <xhtml:link rel="alternate" hreflang="${xmlEscape(HTML_LANG[code])}" href="${xmlEscape(absoluteUrl(code, rest))}"/>`,
  );
  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(absoluteUrl(DEFAULT_LOCALE, rest))}"/>`,
  );
  return links.join("\n");
}

function urlEntry(locale, rest, lastmodTag, locales) {
  return `  <url>
    <loc>${xmlEscape(absoluteUrl(locale, rest))}</loc>${lastmodTag}
${xhtmlLinks(rest, locales)}
  </url>`;
}

export function sitemapPaths(ids) {
  const chrome = ["/", "/about"].flatMap((rest) =>
    LOCALE_CODES.map((locale) => ({ locale, rest, loc: absoluteUrl(locale, rest) })),
  );
  const details = ids.flatMap((id) => {
    const rest = giveawayRestPath(id);
    return SSG_DETAIL_LOCALES.map((locale) => ({ locale, rest, loc: absoluteUrl(locale, rest) }));
  });
  return [...chrome, ...details];
}

export function buildSitemapXml({ ids, lastmod }) {
  const lastmodTag = lastmod ? `\n    <lastmod>${xmlEscape(lastmod)}</lastmod>` : "";
  const chromeUrls = ["/", "/about"].flatMap((rest) =>
    LOCALE_CODES.map((locale) => urlEntry(locale, rest, lastmodTag, LOCALE_CODES)),
  );
  const detailUrls = ids.flatMap((id) => {
    const rest = giveawayRestPath(id);
    return SSG_DETAIL_LOCALES.map((locale) => urlEntry(locale, rest, lastmodTag, SSG_DETAIL_LOCALES));
  });
  const urls = [...chromeUrls, ...detailUrls].join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}
