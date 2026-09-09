import type { Giveaway } from "./types";

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

export function displayTitle(g: Pick<Giveaway, "title" | "titleEn">): string {
  return pickContent(g.title, g.titleEn);
}

export function displayPrize(
  g: Pick<Giveaway, "prize" | "prizeEn" | "prizeDetail" | "prizeDetailEn">,
): string {
  return pickContent(g.prize, g.prizeEn) || pickContent(g.prizeDetail, g.prizeDetailEn);
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

export function contentSearchBlob(g: Giveaway): string {
  return [
    displayTitle(g),
    g.title,
    g.titleEn,
    g.host,
    displayPrize(g),
    g.prize,
    g.prizeEn,
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
