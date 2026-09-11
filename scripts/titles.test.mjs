import assert from "node:assert/strict";
import test from "node:test";
import {
  isPlaceholderTitle,
  recoverTitle,
  recoverTitleFromUrl,
  repairPlaceholderTitles,
  titleFromSlug,
} from "./titles.mjs";

test("isPlaceholderTitle detects Providers and locale leftovers", () => {
  assert.equal(isPlaceholderTitle("Providers"), true);
  assert.equal(isPlaceholderTitle("  提供商  "), true);
  assert.equal(isPlaceholderTitle("Proveedores"), true);
  assert.equal(isPlaceholderTitle("プロバイダー"), true);
  assert.equal(isPlaceholderTitle("Anbieter"), true);
  assert.equal(isPlaceholderTitle("Win a keyboard"), false);
  assert.equal(isPlaceholderTitle(""), false);
  assert.equal(isPlaceholderTitle("Provider"), false);
});

test("titleFromSlug title-cases giveaway-list slugs", () => {
  assert.equal(titleFromSlug("win-apple-iphone-18-pro-and-pitaka-phone-accessories"), "Win Apple Iphone 18 Pro And Pitaka Phone Accessories");
  assert.equal(titleFromSlug("a"), "");
  assert.equal(titleFromSlug("providers"), "");
});

test("recoverTitleFromUrl reads giveaway-list.com slug, ignores gleam /a", () => {
  assert.equal(
    recoverTitleFromUrl("https://giveaway-list.com/giveaway/gleam-pNtrC/win-apple-iphone-18-pro-and-pitaka-phone-accessories"),
    "Win Apple Iphone 18 Pro And Pitaka Phone Accessories",
  );
  assert.equal(recoverTitleFromUrl("https://gleam.io/pNtrC/a"), "");
  assert.equal(
    recoverTitleFromUrl("https://gleam.io/pNtrC/real-campaign-name"),
    "Real Campaign Name",
  );
});

test("recoverTitle prefers URL slug, then host/prize", () => {
  assert.equal(
    recoverTitle({
      title: "Providers",
      url: "https://giveaway-list.com/giveaway/ks-1/emilia-roses-smutember-superfan-giveaway",
      host: "Emilia Rose",
      prize: "Books",
    }),
    "Emilia Roses Smutember Superfan Giveaway",
  );
  assert.equal(
    recoverTitle({ title: "Providers", host: "Cubot", prize: "6 lucky winners get a watch." }),
    "Cubot — 6 lucky winners get a watch.",
  );
  assert.equal(recoverTitle({ title: "Providers" }), "");
});

test("repairPlaceholderTitles rewrites title/titleEn and strips leftover i18n", () => {
  const items = [
    {
      id: "ok",
      title: "Real title",
      titleEn: "Real title",
      titleI18n: { en: "Real title", zh: "真标题" },
    },
    {
      id: "bad",
      title: "Providers",
      titleEn: "Providers",
      titleI18n: { en: "Providers", zh: "提供商", de: "Anbieter" },
      url: "https://giveaway-list.com/giveaway/gleam-xx/courtside-giveaway",
    },
    {
      id: "stuck",
      title: "提供商",
      titleEn: "Providers",
    },
  ];
  const stats = repairPlaceholderTitles(items);
  assert.equal(stats.repaired, 1);
  assert.equal(stats.unresolved, 1);
  assert.equal(items[0].title, "Real title");
  assert.equal(items[1].title, "Courtside Giveaway");
  assert.equal(items[1].titleEn, "Courtside Giveaway");
  assert.equal(items[1].titleI18n.en, "Courtside Giveaway");
  assert.equal(items[1].titleI18n.zh, undefined);
  assert.equal(items[2].title, "提供商");
});
