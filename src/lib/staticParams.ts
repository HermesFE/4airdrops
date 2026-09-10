import { detailLocales, localeCodes } from "@/i18n/locales";
import { getAllGiveaways } from "./data";

export function localeStaticParams() {
  return localeCodes.map((locale) => ({ locale }));
}

export function localeGiveawayStaticParams() {
  const items = getAllGiveaways();
  return detailLocales.flatMap((locale) => items.map((g) => ({ locale, id: g.id })));
}

export function giveawayStaticParams() {
  return getAllGiveaways().map((g) => ({ id: g.id }));
}
