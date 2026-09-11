import type { Locale } from "@/i18n/locales";
import { isPastDeadline } from "./deadline";
import { displayPrize, displayRisk, displayTitle, originalIfDifferent } from "./text";
import type { Giveaway } from "./types";

/** Rows per page on the directory sheet (Excel-like pager, not full-table DOM). */
export const SHEET_PAGE_SIZE = 80;

/**
 * Homepage list payload: current-locale display strings only.
 * Full titleI18n/prizeI18n maps stay in giveaways.json for ingest + detail SSG.
 */
export type SheetRow = {
  id: string;
  platform: string;
  category: string;
  region?: string;
  status?: string;
  hasRisk: boolean;
  riskTitle?: string;
  title: string;
  titleOrig?: string;
  prize: string;
  prizeOrig?: string;
  deadlineBj?: string;
  deadlineRaw?: string;
  search: string;
};

function sheetSearchBlob(g: Giveaway, locale: Locale, title: string, prize: string): string {
  return [title, g.title, g.titleEn, prize, g.prize, g.prizeEn, g.host, g.platform, g.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function toSheetRow(g: Giveaway, locale: Locale): SheetRow {
  const title = displayTitle(g, locale);
  const prize = displayPrize(g, locale);
  const titleOrig = originalIfDifferent(title, g.title);
  const prizeOrig = originalIfDifferent(prize, g.prize) || originalIfDifferent(prize, g.prizeDetail);
  const riskTitle = displayRisk(g);
  return {
    id: g.id,
    platform: g.platform,
    category: g.category,
    region: g.region,
    status: g.status,
    hasRisk: Boolean(g.risk),
    riskTitle: riskTitle || undefined,
    title,
    titleOrig: titleOrig || undefined,
    prize,
    prizeOrig: prizeOrig || undefined,
    deadlineBj: g.deadlineBj,
    deadlineRaw: g.deadlineRaw,
    search: sheetSearchBlob(g, locale, title, prize),
  };
}

export function toSheetRows(items: Giveaway[], locale: Locale): SheetRow[] {
  return items.map((g) => toSheetRow(g, locale));
}

/** Default directory slice: hide past-deadline rows (import should have marked them ended). */
export function hideFromDefaultSheet(row: Pick<SheetRow, "deadlineBj" | "deadlineRaw" | "status">, now = Date.now()): boolean {
  return isPastDeadline(row, now);
}
