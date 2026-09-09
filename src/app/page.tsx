import { GiveawaySheet } from "@/components/GiveawaySheet";
import { categoriesOf, getAllGiveaways, getSyncMeta, getUpdatedAt, platformsOf, regionsOf } from "@/lib/data";
import { STATUS_ONGOING } from "@/lib/status";

export default function HomePage() {
  const items = getAllGiveaways();
  const masterOngoing = getSyncMeta().masterCounts?.[STATUS_ONGOING];
  return (
    <GiveawaySheet
      items={items}
      platforms={platformsOf(items)}
      categories={categoriesOf(items)}
      regions={regionsOf(items)}
      updatedAt={getUpdatedAt()}
      masterOngoing={masterOngoing}
    />
  );
}
