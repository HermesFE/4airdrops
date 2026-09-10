import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/SiteChrome";
import { isLocale, localeMeta } from "@/i18n/locales";
import { brandViewport, homeMetadata } from "@/lib/seo";
import { localeStaticParams } from "@/lib/staticParams";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return localeStaticParams();
}

export function generateViewport() {
  return brandViewport();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return homeMetadata(locale);
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const meta = localeMeta[locale];
  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <body>
        <SiteChrome locale={locale}>{children}</SiteChrome>
      </body>
    </html>
  );
}
