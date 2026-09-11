import { GiveawaySheet } from "./GiveawaySheet";
import type { Locale } from "@/i18n/locales";
import { categoriesOf, getAllGiveaways, getUpdatedAt, platformsOf, regionsOf } from "@/lib/data";
import { toSheetRows } from "@/lib/sheet";

export function DirectoryHome({ locale }: { locale: Locale }) {
  const items = getAllGiveaways();
  const rows = toSheetRows(items, locale);
  return (
    <GiveawaySheet
      items={rows}
      platforms={platformsOf(items)}
      categories={categoriesOf(items)}
      regions={regionsOf(items)}
      updatedAt={getUpdatedAt()}
    />
  );
}
