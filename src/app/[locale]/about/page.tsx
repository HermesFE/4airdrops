import { AboutView } from "@/components/AboutView";
import { isLocale } from "@/i18n/locales";
import { aboutMetadata } from "@/lib/seo";
import { localeStaticParams } from "@/lib/staticParams";

export const dynamicParams = false;

export function generateStaticParams() {
  return localeStaticParams();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return aboutMetadata(locale);
}

export default function LocaleAboutPage() {
  return <AboutView />;
}
