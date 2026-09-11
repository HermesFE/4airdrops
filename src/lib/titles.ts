/**
 * Placeholder-title detector + recovery (UI safety net).
 * Keep in sync with scripts/titles.mjs.
 */

const PLACEHOLDERS = new Set(
  [
    "providers",
    "提供商",
    "proveedores",
    "provedores",
    "المزودون",
    "penyedia",
    "провайдеры",
    "プロバイダー",
    "anbieter",
    "fournisseurs",
    "제공처",
    "nhà cung cấp",
    "sağlayıcılar",
    "प्रदाता",
  ].map((s) => s.toLowerCase()),
);

export type TitleFields = {
  title?: string;
  titleEn?: string;
  titleI18n?: Record<string, string | undefined>;
  url?: string;
  sourceUrl?: string;
  host?: string;
  prize?: string;
  prizeEn?: string;
  prizeDetail?: string;
};

export function isPlaceholderTitle(value?: string | null): boolean {
  const s = String(value || "").trim().toLowerCase();
  if (!s) return false;
  return PLACEHOLDERS.has(s);
}

export function titleFromSlug(slug: string): string {
  let s = String(slug || "").trim();
  if (!s) return "";
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep raw */
  }
  s = s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!s || /^a$/i.test(s) || isPlaceholderTitle(s)) return "";
  return s
    .split(" ")
    .map((word) => {
      if (!word) return word;
      if (/^[A-Z0-9]{2,}$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function recoverTitleFromUrl(url?: string): string {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    const parts = u.pathname.split("/").filter(Boolean);
    const host = u.hostname.replace(/^www\./, "");
    if (host.endsWith("giveaway-list.com") && parts[0] === "giveaway" && parts.length >= 3) {
      return titleFromSlug(parts.slice(2).join(" "));
    }
    if (host === "gleam.io" && parts.length >= 2) {
      return titleFromSlug(parts.slice(1).join(" "));
    }
    if (parts.length) return titleFromSlug(parts[parts.length - 1]);
  } catch {
    return "";
  }
  return "";
}

function firstPrizeClause(prize?: string): string {
  const s = String(prize || "")
    .replace(/\s+/g, " ")
    .replace(/\|/g, " ")
    .trim();
  if (!s) return "";
  const cut = s.split(/(?<=[.!?])\s+/)[0] || s;
  return cut.length > 120 ? `${cut.slice(0, 117).trimEnd()}…` : cut;
}

export function recoverTitle(item: TitleFields): string {
  const fromUrl = recoverTitleFromUrl(item.url) || recoverTitleFromUrl(item.sourceUrl);
  if (fromUrl) return fromUrl;
  const host = String(item.host || "").trim();
  const prize = firstPrizeClause(item.prize || item.prizeEn || item.prizeDetail);
  if (host && prize && !isPlaceholderTitle(prize)) return `${host} — ${prize}`;
  if (prize && !isPlaceholderTitle(prize)) return prize;
  if (host) return `${host} giveaway`;
  return "";
}
