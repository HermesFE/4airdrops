import { notFound } from "next/navigation";
import { GiveawayRecord } from "@/components/GiveawayRecord";
import { isLocale } from "@/i18n/locales";
import { getGiveaway } from "@/lib/data";
import { detailMetadata } from "@/lib/seo";
import { localeGiveawayStaticParams } from "@/lib/staticParams";

export const dynamicParams = false;

export function generateStaticParams() {
  return localeGiveawayStaticParams();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const g = getGiveaway(decodeURIComponent(id));
  if (!g) return {};
  return detailMetadata(locale, g);
}

export default async function LocaleGiveawayDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const g = getGiveaway(decodeURIComponent(id));
  if (!g) notFound();
  return <GiveawayRecord g={g} />;
}
