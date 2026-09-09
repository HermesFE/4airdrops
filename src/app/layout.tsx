import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "4Airdrops — Giveaway / airdrop directory",
  description: "Public giveaway and airdrop directory. Includes Binance affiliate links.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
