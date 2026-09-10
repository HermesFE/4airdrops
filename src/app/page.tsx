import { defaultLocale, localeMeta } from "@/i18n/locales";
import { localePath } from "@/i18n/paths";
import { GOOGLE_SITE_VERIFICATION, rootAliasMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata = rootAliasMetadata();

/**
 * Static-export-friendly `/` → `/en`. Cloudflare also 301s via `public/_redirects`.
 * This page must not use `useI18n` (it is outside the `[locale]` provider tree).
 */
export default function RootRedirectPage() {
  const href = localePath(defaultLocale);
  const meta = localeMeta[defaultLocale];
  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <head>
        <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
        <meta httpEquiv="refresh" content={`0; url=${href}`} />
      </head>
      <body>
        <p>
          <a href={href}>4Airdrops</a>
        </p>
      </body>
    </html>
  );
}
