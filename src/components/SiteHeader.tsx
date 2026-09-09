"use client";

import Link from "next/link";
import { BinanceCta } from "./BinanceCta";
import { LocaleSwitch } from "./LocaleSwitch";
import { useI18n } from "@/i18n/I18nProvider";

export function SiteHeader() {
  const { m } = useI18n();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="sitename">
          4Airdrops
          <span className="tag">{m.nav.tagline}</span>
        </Link>
        <nav className="nav">
          <Link href="/">{m.nav.directory}</Link>
          <span className="sep">|</span>
          <Link href="/about">{m.nav.about}</Link>
          <span className="sep">|</span>
          <LocaleSwitch />
          <span className="sep">|</span>
          <BinanceCta compact />
        </nav>
      </div>
    </header>
  );
}
