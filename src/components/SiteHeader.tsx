import Link from "next/link";
import { BinanceCta } from "./BinanceCta";

export function SiteHeader() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="sitename">
          4Airdrops
          <span className="tag">活动目录</span>
        </Link>
        <nav className="nav">
          <Link href="/">目录</Link>
          <span className="sep">|</span>
          <Link href="/about">关于</Link>
          <span className="sep">|</span>
          <BinanceCta compact />
        </nav>
      </div>
    </header>
  );
}
