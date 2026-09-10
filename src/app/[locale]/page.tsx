import { DirectoryHome } from "@/components/DirectoryHome";
import { isLocale } from "@/i18n/locales";
import { homeMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return homeMetadata(locale);
}

export default function LocaleHomePage() {
  return <DirectoryHome />;
}
