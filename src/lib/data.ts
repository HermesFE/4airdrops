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

export function binanceUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BINANCE_REF_URL ||
    "https://www.binance.com/activity/referral-entry/CPA?ref=PLACEHOLDER"
  );
}
