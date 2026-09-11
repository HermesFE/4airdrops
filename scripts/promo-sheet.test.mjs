import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test("visible promo / about / footer chrome does not say 返佣", () => {
  const catalogs = fs.readFileSync(path.join(ROOT, "src/i18n/catalogs.ts"), "utf8");
  const en = fs.readFileSync(path.join(ROOT, "src/i18n/en.ts"), "utf8");
  assert.equal(catalogs.includes("返佣"), false);
  assert.equal(en.includes("返佣"), false);
  assert.match(catalogs, /binance: \{ compact: "Binance", k: "推广", line: "Binance"/);
  assert.match(en, /compact: "Binance"/);
  assert.match(en, /line: "Binance"/);
});

test("directory sheet rows keep current-locale strings only", () => {
  const src = fs.readFileSync(path.join(ROOT, "src/lib/sheet.ts"), "utf8");
  assert.match(src, /current-locale display strings only/);
  assert.match(src, /export type SheetRow/);
  assert.doesNotMatch(src, /titleI18n\?:/);
  assert.doesNotMatch(src, /prizeI18n\?:/);
  const sheet = fs.readFileSync(path.join(ROOT, "src/components/GiveawaySheet.tsx"), "utf8");
  assert.match(sheet, /SHEET_PAGE_SIZE/);
  assert.match(sheet, /SEARCH_DEBOUNCE_MS/);
  assert.match(sheet, /hideFromDefaultSheet/);
});
