import { catalogs } from "@/i18n/catalogs";
import { I18nProvider } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/locales";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { LocaleEffects } from "./LocaleEffects";

export function SiteChrome({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <I18nProvider locale={locale} messages={catalogs[locale]}>
      <LocaleEffects locale={locale} />
      <SiteHeader />
      <main className="page">{children}</main>
      <SiteFooter />
    </I18nProvider>
  );
}
