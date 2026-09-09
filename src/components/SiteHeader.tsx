import Link from "next/link";
import { BinanceCta } from "./BinanceCta";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#1e2a3c]/bg-[#070b12]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-bold tracking-tight">
          <span className="text-[#f0b90b]">4</span>Airdrops
          <span className="ml-2 text-xs font-normal text-[#8b9bb4]">活动目录</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-[#8b9bb4]">
          <Link href="/" className="hover:text-white">目录</Link>
          <Link href="/about" className="hover:text-white">关于</Link>
          <BinanceCta compact />
        </nav>
      </div>
    </header>
  );
}
