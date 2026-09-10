import type { Metadata } from "next";
import { SiteChrome } from "@/components/SiteChrome";
import { defaultLocale, localeMeta } from "@/i18n/locales";
import { rootAliasMetadata } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = rootAliasMetadata();

/** Unprefixed `/` is the English directory; canonical + hreflang point at `/en`. */
export default function RootAliasLayout({ children }: { children: React.ReactNode }) {
  const meta = localeMeta[defaultLocale];
  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <body>
        <SiteChrome locale={defaultLocale}>{children}</SiteChrome>
      </body>
    </html>
  );
}
