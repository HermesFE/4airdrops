"use client";

import { createContext, useContext, useMemo } from "react";
import type { Messages } from "./en";
import type { Locale } from "./locales";
import { statusCode } from "@/lib/fieldLabels";

type I18nContextValue = {
  locale: Locale;
  m: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function formatMsg(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function statusLabel(m: Messages, raw?: string): string {
  const code = statusCode(raw);
  if (!code) return m.filter.dash;
  return m.status[code];
}

/** Locale + messages come from the server so the client bundle holds one catalog. */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, m: messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
