import raw from "../../data/giveaways.json";
import type { Giveaway, GiveawayFile } from "./types";

const data = raw as GiveawayFile;

export function getAllGiveaways(): Giveaway[] {
  return Array.isArray(data.items) ? data.items : [];
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
