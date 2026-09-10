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

export function xhtmlLinks(rest = "/") {
  const links = LOCALE_CODES.map(
    (code) =>
      `    <xhtml:link rel="alternate" hreflang="${xmlEscape(HTML_LANG[code])}" href="${xmlEscape(absoluteUrl(code, rest))}"/>`,
  );
  links.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(absoluteUrl(DEFAULT_LOCALE, rest))}"/>`,
  );
  return links.join("\n");
}

export function sitemapPaths(ids) {
  const rests = ["/", "/about", ...ids.map((id) => giveawayRestPath(id))];
  return rests.flatMap((rest) => LOCALE_CODES.map((locale) => ({ locale, rest, loc: absoluteUrl(locale, rest) })));
}

export function buildSitemapXml({ ids, lastmod }) {
  const restList = ["/", "/about", ...ids.map((id) => giveawayRestPath(id))];
  const lastmodTag = lastmod ? `\n    <lastmod>${xmlEscape(lastmod)}</lastmod>` : "";
  const urls = restList
    .map((rest) => {
      return LOCALE_CODES.map((locale) => {
        return `  <url>
    <loc>${xmlEscape(absoluteUrl(locale, rest))}</loc>${lastmodTag}
${xhtmlLinks(rest)}
  </url>`;
      }).join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}
