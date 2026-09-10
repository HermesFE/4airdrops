import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { LOCALE_CODES as INGEST_LOCALES } from "./content-i18n.mjs";
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALE_CODES,
  SITE_ORIGIN,
  absoluteUrl,
  buildSitemapXml,
  giveawayRestPath,
  localePath,
  sitemapPaths,
} from "./seo-urls.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test("locale list matches ingest and UI locales", () => {
  assert.deepEqual(LOCALE_CODES, INGEST_LOCALES);
  assert.equal(LOCALE_CODES.length, 14);
  assert.equal(DEFAULT_LOCALE, "en");
});

test("htmlLang map matches src/i18n/locales.ts", () => {
  const src = fs.readFileSync(path.join(ROOT, "src/i18n/locales.ts"), "utf8");
  for (const code of LOCALE_CODES) {
    const re = new RegExp(`${code}: \\{ code: "${code}", native: "[^"]+", htmlLang: "([^"]+)"`);
    const m = src.match(re);
    assert.ok(m, `htmlLang for ${code}`);
    assert.equal(HTML_LANG[code], m[1]);
  }
});

test("SITE_ORIGIN matches src/i18n/paths.ts", () => {
  const src = fs.readFileSync(path.join(ROOT, "src/i18n/paths.ts"), "utf8");
  assert.match(src, new RegExp(`SITE_ORIGIN = "${SITE_ORIGIN}"`));
});

test("locale paths and absolute URLs", () => {
  assert.equal(localePath("en"), "/en");
  assert.equal(localePath("zh", "/"), "/zh");
  assert.equal(localePath("zh", "/about"), "/zh/about");
  assert.equal(localePath("en", giveawayRestPath("gleam-jYELA")), "/en/g/gleam-jYELA");
  assert.equal(absoluteUrl("ar", "/about"), `${SITE_ORIGIN}/ar/about`);
  assert.equal(SITE_ORIGIN, "https://4airdrops.com");
});

test("sitemap lists every locale home, about, and detail plus xhtml hreflang", () => {
  const xml = buildSitemapXml({ ids: ["ext-af7da96f88"], lastmod: "2026-09-10" });
  assert.match(xml, /xmlns:xhtml="http:\/\/www.w3.org\/1999\/xhtml"/);
  for (const code of LOCALE_CODES) {
    assert.match(xml, new RegExp(`<loc>${SITE_ORIGIN}/${code}</loc>`));
    assert.match(xml, new RegExp(`<loc>${SITE_ORIGIN}/${code}/about</loc>`));
    assert.match(xml, new RegExp(`<loc>${SITE_ORIGIN}/${code}/g/ext-af7da96f88</loc>`));
    assert.match(xml, new RegExp(`hreflang="${HTML_LANG[code]}" href="${SITE_ORIGIN}/${code}"`));
  }
  assert.match(xml, /hreflang="x-default" href="https:\/\/4airdrops.com\/en"/);
  assert.match(xml, /<lastmod>2026-09-10<\/lastmod>/);
  assert.equal(sitemapPaths(["a", "b"]).length, LOCALE_CODES.length * 4);
});
