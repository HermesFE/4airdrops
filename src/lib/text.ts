import type { Locale } from "@/i18n/locales";
import { isPlaceholderTitle, recoverTitle } from "./titles";
import type { Giveaway, LocalizedText } from "./types";

/** Display-only cleanup for scraped HTML/JS fragments. Does not change source JSON. */
export function cleanDisplayText(raw?: string): string {
  if (!raw) return "";
  let s = raw.trim();
  const meta = s.match(/content="([^"]+)"/i) || s.match(/content='([^']+)'/i);
  if (meta?.[1]) s = meta[1].trim();
  const js = s.search(/\(\(a,b,c,d/);
  if (js >= 0) s = s.slice(0, js).trim();
  s = s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^"+|"+$/g, "").trim();
  return s;
}

/** Prefer ingest-time English display; fall back to the stored original. */
export function pickContent(original?: string, en?: string): string {
  return cleanDisplayText(en) || cleanDisplayText(original) || "";
}

/** titleI18n[L] || titleEn || title (same pattern for any localized field). */
export function pickLocalized(
  i18n: LocalizedText | undefined,
  en: string | undefined,
  original: string | undefined,
  locale?: Locale,
): string {
  if (locale) {
    const hit = cleanDisplayText(i18n?.[locale]);
    if (hit) return hit;
  }
  return pickContent(original, en);
}

export function displayTitle(
  g: Pick<Giveaway, "title" | "titleEn" | "titleI18n" | "url" | "sourceUrl" | "host" | "prize" | "prizeEn" | "prizeDetail">,
  locale?: Locale,
): string {
  if (locale) {
    const hit = cleanDisplayText(g.titleI18n?.[locale]);
    if (hit && !isPlaceholderTitle(hit)) return hit;
  }
  const en = cleanDisplayText(g.titleEn);
  if (en && !isPlaceholderTitle(en)) return en;
  const original = cleanDisplayText(g.title);
  if (original && !isPlaceholderTitle(original)) return original;
  return recoverTitle(g);
}

export function displayPrize(
  g: Pick<Giveaway, "prize" | "prizeEn" | "prizeI18n" | "prizeDetail" | "prizeDetailEn">,
  locale?: Locale,
): string {
  return (
    pickLocalized(g.prizeI18n, g.prizeEn, g.prize, locale) ||
    pickContent(g.prizeDetail, g.prizeDetailEn)
  );
}

export function displayEntry(g: Pick<Giveaway, "entry" | "entryEn">): string {
  return pickContent(g.entry, g.entryEn);
}

export function displayRisk(g: Pick<Giveaway, "risk" | "riskEn">): string {
  return pickContent(g.risk, g.riskEn);
}

export function originalIfDifferent(displayed: string, original?: string): string {
  const o = cleanDisplayText(original);
  if (!o || o === displayed) return "";
  return o;
}

function i18nValues(map?: LocalizedText): string[] {
  return map ? Object.values(map).filter((v): v is string => Boolean(v)) : [];
}

export function contentSearchBlob(g: Giveaway): string {
  return [
    displayTitle(g),
    g.title,
    g.titleEn,
    ...i18nValues(g.titleI18n),
    g.host,
    displayPrize(g),
    g.prize,
    g.prizeEn,
    ...i18nValues(g.prizeI18n),
    g.prizeDetail,
    g.prizeDetailEn,
    displayEntry(g),
    g.entry,
    g.entryEn,
    g.platform,
    g.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
