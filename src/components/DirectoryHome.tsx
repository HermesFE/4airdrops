import { GiveawaySheet } from "./GiveawaySheet";
import type { Locale } from "@/i18n/locales";
import { categoriesOf, getAllGiveaways, getSyncMeta, getUpdatedAt, platformsOf, regionsOf } from "@/lib/data";
import { toSheetRows } from "@/lib/sheet";
import { MASTER_STATUS_ONGOING } from "@/lib/status";

export function DirectoryHome({ locale }: { locale: Locale }) {
  const items = getAllGiveaways();
  const rows = toSheetRows(items, locale);
  const masterOngoing = getSyncMeta().masterCounts?.[MASTER_STATUS_ONGOING];
  return (
    <GiveawaySheet
      items={rows}
      platforms={platformsOf(items)}
      categories={categoriesOf(items)}
      regions={regionsOf(items)}
      updatedAt={getUpdatedAt()}
      masterOngoing={masterOngoing}
    />
  );
}
