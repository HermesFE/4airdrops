import { defaultLocale, isDetailLocale, isLocale, localeCodes, localeMeta, type Locale } from "./locales";

export const SITE_ORIGIN = "https://4airdrops.com";
export const SITE_NAME = "4Airdrops";

/** Path after the locale prefix. `"/"` means the directory home. */
export type LocaleRestPath = string;

export function localePath(locale: Locale, rest: LocaleRestPath = "/"): string {
  const suffix = !rest || rest === "/" ? "" : rest.startsWith("/") ? rest : `/${rest}`;
  return `/${locale}${suffix}`;
}

export function absoluteUrl(locale: Locale, rest: LocaleRestPath = "/"): string {
  return `${SITE_ORIGIN}${localePath(locale, rest)}`;
}

export function splitLocalePath(pathname: string): { locale: Locale | null; rest: string } {
  const clean = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const parts = clean.split("/").filter(Boolean);
  const head = parts[0];
  if (isLocale(head)) {
    const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "/";
    return { locale: head, rest };
  }
  return { locale: null, rest: clean.startsWith("/") ? clean : `/${clean}` };
}

export function isGiveawayDetailRest(rest: string): boolean {
  return rest.startsWith("/g/");
}

/**
 * Same path in `next`, except giveaway details that were not SSG'd for that
 * locale: those land on the locale directory home instead of a 404.
 */
export function swapLocalePath(pathname: string, next: Locale): string {
  const { rest } = splitLocalePath(pathname);
  if (isGiveawayDetailRest(rest) && !isDetailLocale(next)) {
    return localePath(next);
  }
  return localePath(next, rest);
}

export function languageAlternates(
  rest: LocaleRestPath = "/",
  locales: readonly Locale[] = localeCodes,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const code of locales) {
    languages[localeMeta[code].htmlLang] = absoluteUrl(code, rest);
  }
  languages["x-default"] = absoluteUrl(defaultLocale, rest);
  return languages;
}

export function giveawayRestPath(id: string): string {
  return `/g/${encodeURIComponent(id)}`;
}

/** Detail href: non-SSG locales open the English detail so the row still works. */
export function giveawayPath(locale: Locale, id: string): string {
  const dest = isDetailLocale(locale) ? locale : defaultLocale;
  return localePath(dest, giveawayRestPath(id));
}
