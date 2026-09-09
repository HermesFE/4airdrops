"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { localeCodes, localeMeta, type Locale } from "@/i18n/locales";

export function LocaleSwitch() {
  const { locale, setLocale, m } = useI18n();
  return (
    <span className="lang-switch">
      <label>
        <span className="visually-hidden">{m.nav.language}</span>
        <select
          value={locale}
          aria-label={m.nav.language}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
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
