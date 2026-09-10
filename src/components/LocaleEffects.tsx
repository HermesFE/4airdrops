"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { applyDocumentLocale, isLocale, LOCALE_STORAGE_KEY, type Locale } from "@/i18n/locales";
import { swapLocalePath } from "@/i18n/paths";

/** Persist the URL locale and honor legacy `?lang=` by navigating to that prefix. */
export function LocaleEffects({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    applyDocumentLocale(locale);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore quota / private mode */
    }
    const query = new URLSearchParams(window.location.search).get("lang");
    if (isLocale(query) && query !== locale) {
      router.replace(swapLocalePath(pathname, query));
    }
  }, [locale, pathname, router]);

  return null;
}
