import { notFound } from "next/navigation";
import { GiveawayRecord } from "@/components/GiveawayRecord";
import { getAllGiveaways, getGiveaway } from "@/lib/data";

export function generateStaticParams() {
  return getAllGiveaways().map((g) => ({ id: g.id }));
}

export default async function GiveawayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const g = getGiveaway(decodeURIComponent(id));
  if (!g) notFound();
  return <GiveawayRecord g={g} />;
}
