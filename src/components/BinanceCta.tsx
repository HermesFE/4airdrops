"use client";

import { binanceUrl } from "@/lib/data";
import { useI18n } from "@/i18n/I18nProvider";

export function BinanceCta({ compact = false }: { compact?: boolean }) {
  const href = binanceUrl();
  const { m } = useI18n();
  if (compact) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer sponsored">
        {m.binance.compact}
      </a>
    );
  }
  return (
    <p className="promo-row">
      <span className="k">{m.binance.k}</span>
      <a href={href} target="_blank" rel="noopener noreferrer sponsored">
        {m.binance.line}
      </a>
      <span className="promo-suffix"> · {m.binance.suffix}</span>
    </p>
  );
}
