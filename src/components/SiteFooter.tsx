"use client";

import { binanceUrl } from "@/lib/data";
import { useI18n } from "@/i18n/I18nProvider";

export function SiteFooter() {
  const { m } = useI18n();
  const link = (
    <a href={binanceUrl()} target="_blank" rel="noopener noreferrer sponsored">
      {m.footer.link}
    </a>
  );
  const parts = m.footer.body.split("{link}");
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <h2>{m.footer.title}</h2>
        <p>
          {parts[0]}
          {link}
          {parts[1] ?? ""}
        </p>
      </div>
    </footer>
  );
}
