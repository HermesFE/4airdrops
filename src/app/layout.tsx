import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "4Airdrops — Giveaway / 空投活动目录",
  description: "多平台 Giveaway 与空投活动聚合。含 Binance 联盟推广。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <I18nProvider>
          <SiteHeader />
          <main className="page">{children}</main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
