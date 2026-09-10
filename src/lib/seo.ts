import type { Metadata } from "next";
import { catalogs } from "@/i18n/catalogs";
import { defaultLocale, detailLocales, isLocale, localeCodes, localeMeta, type Locale } from "@/i18n/locales";
import { absoluteUrl, languageAlternates, SITE_NAME, SITE_ORIGIN, type LocaleRestPath } from "@/i18n/paths";
import { seoCopy } from "@/i18n/seoCopy";
import { displayCategory, displayPlatform } from "@/lib/fieldLabels";
import { displayPrize, displayTitle } from "@/lib/text";
import type { Giveaway } from "@/lib/types";

export { absoluteUrl, languageAlternates, SITE_NAME, SITE_ORIGIN } from "@/i18n/paths";

export function requireLocale(value: string): Locale {
  if (!isLocale(value)) {
    throw new Error(`Invalid locale: ${value}`);
  }
  return value;
}

export function truncateMeta(text: string, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function localeMetadata(
  locale: Locale,
  rest: LocaleRestPath,
  title: string,
  description: string,
  locales: readonly Locale[] = localeCodes,
): Metadata {
  const url = absoluteUrl(locale, rest);
  const desc = truncateMeta(description);
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description: desc,
    robots: { index: true, follow: true },
    alternates: {
      canonical: url,
      languages: languageAlternates(rest, locales),
    },
    openGraph: {
      type: rest.startsWith("/g/") ? "article" : "website",
      url,
      siteName: SITE_NAME,
      title,
      description: desc,
      locale: localeMeta[locale].ogLocale,
      alternateLocale: locales.filter((code) => code !== locale).map((code) => localeMeta[code].ogLocale),
    },
    twitter: {
      card: "summary",
      title,
      description: desc,
    },
  };
}

export function homeMetadata(locale: Locale): Metadata {
  const copy = seoCopy[locale];
  return localeMetadata(locale, "/", copy.homeTitle, copy.homeDescription);
}

export function aboutMetadata(locale: Locale): Metadata {
  const m = catalogs[locale];
  return localeMetadata(locale, "/about", `${m.about.title} — ${SITE_NAME}`, m.about.body);
}

export function detailMetadata(locale: Locale, g: Giveaway): Metadata {
  const m = catalogs[locale];
  const title = displayTitle(g, locale) || m.filter.untitled;
  const prize = displayPrize(g, locale);
  const platform = displayPlatform(g.platform, locale) || g.platform;
  const category = displayCategory(g.category, locale) || g.category;
  const description = [prize, platform, category, m.home.tip].filter(Boolean).join(" · ");
  return localeMetadata(locale, `/g/${encodeURIComponent(g.id)}`, `${title} — ${SITE_NAME}`, description, detailLocales);
}

export function rootAliasMetadata(): Metadata {
  const url = absoluteUrl(defaultLocale);
  const copy = seoCopy[defaultLocale];
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: copy.homeTitle,
    description: copy.homeDescription,
    robots: { index: true, follow: true },
    alternates: {
      canonical: url,
      languages: languageAlternates("/"),
    },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: copy.homeTitle,
      description: copy.homeDescription,
      locale: localeMeta[defaultLocale].ogLocale,
    },
    twitter: {
      card: "summary",
      title: copy.homeTitle,
      description: copy.homeDescription,
    },
  };
}
