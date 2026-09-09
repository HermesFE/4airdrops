"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { catalogs, defaultLocale, type Locale, type Messages } from "./messages";

const STORAGE_KEY = "4airdrops.locale";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  m: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function formatMsg(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function statusLabel(m: Messages, raw?: string): string {
  if (!raw) return m.filter.dash;
  return m.status[raw as keyof Messages["status"]] ?? raw;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("lang");
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const next =
      query === "en" || query === "zh" ? query : saved === "en" || saved === "zh" ? saved : defaultLocale;
    setLocaleState(next);
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, m: catalogs[locale] }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
