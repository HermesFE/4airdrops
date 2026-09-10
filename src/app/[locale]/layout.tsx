import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/SiteChrome";
import { isLocale, localeMeta } from "@/i18n/locales";
import { seoCopy } from "@/i18n/seoCopy";
import { SITE_ORIGIN } from "@/i18n/paths";
import { GOOGLE_SITE_VERIFICATION } from "@/lib/seo";
import { localeStaticParams } from "@/lib/staticParams";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return localeStaticParams();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = seoCopy[locale];
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: copy.homeTitle,
    description: copy.homeDescription,
    robots: { index: true, follow: true },
    verification: { google: GOOGLE_SITE_VERIFICATION },
  };
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
