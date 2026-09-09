"use client";

import { useI18n } from "@/i18n/I18nProvider";

export function LocaleSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <span className="lang-switch">
      <button type="button" className={locale === "zh" ? "on" : ""} onClick={() => setLocale("zh")}>
        中文
      </button>
      <span className="sep">|</span>
      <button type="button" className={locale === "en" ? "on" : ""} onClick={() => setLocale("en")}>
        EN
      </button>
    </span>
  );
}
