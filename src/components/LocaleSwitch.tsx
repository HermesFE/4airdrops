"use client";

import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { localeCodes, localeMeta, LOCALE_STORAGE_KEY, type Locale } from "@/i18n/locales";
import { swapLocalePath } from "@/i18n/paths";

export function LocaleSwitch() {
  const { locale, m } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  function onChange(next: Locale) {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    router.push(swapLocalePath(pathname, next));
  }

  return (
    <span className="lang-switch">
      <label>
        <span className="visually-hidden">{m.nav.language}</span>
        <select value={locale} aria-label={m.nav.language} onChange={(e) => onChange(e.target.value as Locale)}>
          {localeCodes.map((code) => (
            <option key={code} value={code}>
              {localeMeta[code].native}
            </option>
          ))}
        </select>
      </label>
    </span>
  );
}
