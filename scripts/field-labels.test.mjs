import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = fs.readFileSync(path.join(ROOT, "src/lib/fieldLabels.ts"), "utf8");

test("fieldLabels maps common EN category/region tokens for zh UI", () => {
  const pairs = [
    ["Gaming", "游戏"],
    ["Books", "图书"],
    ["Other", "其他"],
    ["Worldwide", "全球"],
    ["WW", "全球"],
    ["United States", "美国"],
    ["CA", "加拿大"],
    ["GB", "英国"],
  ];
  for (const [en, zh] of pairs) {
    assert.match(SRC, new RegExp(`${en}[\\s\\S]{0,80}${zh}`), `${en} → ${zh}`);
  }
  assert.match(SRC, /locale === "zh"/);
  assert.match(SRC, /REGION_ZH_TOKENS/);
  assert.match(SRC, /CATEGORY_ZH/);
});

test("coverage copy no longer interpolates a stale master count", () => {
  const en = fs.readFileSync(path.join(ROOT, "src/i18n/en.ts"), "utf8");
  const catalogs = fs.readFileSync(path.join(ROOT, "src/i18n/catalogs.ts"), "utf8");
  assert.match(en, /coverage: "\{n\} rows on site"/);
  assert.equal(en.includes("{master}"), false);
  assert.equal(catalogs.includes("{master}"), false);
  assert.equal(catalogs.includes("主表进行中约"), false);
  assert.equal(catalogs.includes("993"), false);
});
