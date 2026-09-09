"use client";

import { BinanceCta } from "./BinanceCta";
import { useI18n } from "@/i18n/I18nProvider";

export function AboutView() {
  const { m } = useI18n();
  return (
    <div className="stack narrow">
      <h1>{m.about.title}</h1>
      <p className="lede">{m.about.body}</p>
      <h2>{m.about.moneyTitle}</h2>
      <p className="lede">{m.about.moneyBody}</p>
      <BinanceCta />
    </div>
  );
}
