import raw from "../../data/giveaways.json";
import type { Giveaway, GiveawayFile } from "./types";
import { cleanDisplayText } from "./text";

const data = raw as GiveawayFile;

function sanitizeGiveaway(g: Giveaway): Giveaway {
  const prize = cleanDisplayText(g.prize) || undefined;
  const prizeDetail = cleanDisplayText(g.prizeDetail) || undefined;
  return {
    ...g,
    prize,
    prizeDetail: prizeDetail && prizeDetail !== prize ? prizeDetail : undefined,
    entry: cleanDisplayText(g.entry) || undefined,
    risk: cleanDisplayText(g.risk) || undefined,
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

export const DEFAULT_BINANCE_REF_URL =
  "https://www.binance.com/activity/referral-entry/CPA?ref=yke3vhg.fed2xbu6CJZ";

export function binanceUrl(): string {
  return process.env.NEXT_PUBLIC_BINANCE_REF_URL || DEFAULT_BINANCE_REF_URL;
}
