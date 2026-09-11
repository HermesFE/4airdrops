/**
 * Placeholder-title detector + recovery for ingest.
 * Keep in sync with src/lib/titles.ts.
 *
 * List scrapes sometimes store the Gleam/KingSumo/SweepWidget chrome label
 * "Providers" / 「提供商」 as the campaign title. The giveaway-list.com URL
 * slug is the real name (`/giveaway/{id}/{slug}`).
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

export function isPlaceholderTitle(value) {
  const s = String(value || "").trim().toLowerCase();
  if (!s) return false;
  return PLACEHOLDERS.has(s);
}

export function titleFromSlug(slug) {
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

export function recoverTitleFromUrl(url) {
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

function firstPrizeClause(prize) {
  const s = String(prize || "")
    .replace(/\s+/g, " ")
    .replace(/\|/g, " ")
    .trim();
  if (!s) return "";
  const cut = s.split(/(?<=[.!?])\s+/)[0] || s;
  return cut.length > 120 ? `${cut.slice(0, 117).trimEnd()}…` : cut;
}

export function recoverTitle(item) {
  const fromUrl = recoverTitleFromUrl(item?.url) || recoverTitleFromUrl(item?.sourceUrl);
  if (fromUrl) return fromUrl;
  const host = String(item?.host || "").trim();
  const prize = firstPrizeClause(item?.prize || item?.prizeEn || item?.prizeDetail);
  if (host && prize && !isPlaceholderTitle(prize)) return `${host} — ${prize}`;
  if (prize && !isPlaceholderTitle(prize)) return prize;
  if (host) return `${host} giveaway`;
  return "";
}

function stripPlaceholderI18n(map, recovered) {
  const next = {};
  if (map && typeof map === "object" && !Array.isArray(map)) {
    for (const [k, v] of Object.entries(map)) {
      if (v != null && String(v).trim() && !isPlaceholderTitle(v)) next[k] = String(v).trim();
    }
  }
  if (recovered) next.en = recovered;
  return Object.keys(next).length ? next : undefined;
}

export function itemHasPlaceholderTitle(item) {
  if (!item) return false;
  if (isPlaceholderTitle(item.title) || isPlaceholderTitle(item.titleEn)) return true;
  const map = item.titleI18n;
  if (map && typeof map === "object") {
    return Object.values(map).some((v) => isPlaceholderTitle(v));
  }
  return false;
}

/** Repair in place. Returns { repaired, unresolved }. */
export function repairPlaceholderTitles(items) {
  let repaired = 0;
  let unresolved = 0;
  for (const item of items) {
    if (!item || !itemHasPlaceholderTitle(item)) continue;
    const recovered = recoverTitle(item);
    if (!recovered || isPlaceholderTitle(recovered)) {
      unresolved += 1;
      continue;
    }
    item.title = recovered;
    item.titleEn = recovered;
    const next = stripPlaceholderI18n(item.titleI18n, recovered);
    if (next) item.titleI18n = next;
    else delete item.titleI18n;
    repaired += 1;
  }
  return { repaired, unresolved };
}
