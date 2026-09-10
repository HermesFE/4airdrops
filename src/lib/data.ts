import raw from "../../data/giveaways.json";
import { localeCodes, type Locale } from "@/i18n/locales";
import type { Giveaway, GiveawayFile, LocalizedText } from "./types";
import { cleanDisplayText } from "./text";
import { statusCode } from "./fieldLabels";

const data = raw as GiveawayFile;

function sanitizeI18n(map?: LocalizedText): LocalizedText | undefined {
  if (!map || typeof map !== "object") return undefined;
  const out: LocalizedText = {};
  for (const code of localeCodes) {
    const v = cleanDisplayText(map[code as Locale]);
    if (v) out[code] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function sanitizeGiveaway(g: Giveaway): Giveaway {
  const prize = cleanDisplayText(g.prize) || undefined;
  const prizeDetail = cleanDisplayText(g.prizeDetail) || undefined;
  const prizeEn = cleanDisplayText(g.prizeEn) || undefined;
  const prizeDetailEn = cleanDisplayText(g.prizeDetailEn) || undefined;
  return {
    ...g,
    titleEn: cleanDisplayText(g.titleEn) || undefined,
    titleI18n: sanitizeI18n(g.titleI18n),
    prize,
    prizeEn,
    prizeI18n: sanitizeI18n(g.prizeI18n),
    prizeDetail: prizeDetail && prizeDetail !== prize ? prizeDetail : undefined,
    prizeDetailEn: prizeDetailEn && prizeDetailEn !== prizeEn ? prizeDetailEn : prizeDetailEn,
    entry: cleanDisplayText(g.entry) || undefined,
    entryEn: cleanDisplayText(g.entryEn) || undefined,
    risk: cleanDisplayText(g.risk) || undefined,
    riskEn: cleanDisplayText(g.riskEn) || undefined,
    status: statusCode(g.status) || undefined,
  };
}

export function getAllGiveaways(): Giveaway[] {
  return Array.isArray(data.items) ? data.items.map(sanitizeGiveaway) : [];
}

export function getGiveaway(id: string): Giveaway | undefined {
  return getAllGiveaways().find((g) => g.id === id);
}

export function getUpdatedAt(): string {
  return data.updatedAt || "";
}

export function platformsOf(items: Giveaway[]): string[] {
  return [...new Set(items.map((i) => i.platform).filter(Boolean))].sort();
}

export function categoriesOf(items: Giveaway[]): string[] {
  return [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
}

export function regionsOf(items: Giveaway[]): string[] {
  return [...new Set(items.map((i) => i.region).filter((v): v is string => Boolean(v)))].sort();
}

export function statusesOf(items: Giveaway[]): string[] {
  return [...new Set(items.map((i) => i.status).filter((v): v is string => Boolean(v)))].sort();
}

export function getSyncMeta(): { note?: string; masterCounts?: Record<string, number> } {
  const extra = data as GiveawayFile & {
    note?: string;
    sync?: { masterCounts?: Record<string, number> };
  };
  return { note: extra.note, masterCounts: extra.sync?.masterCounts };
}

export { DEFAULT_BINANCE_REF_URL, binanceUrl } from "./binance";
