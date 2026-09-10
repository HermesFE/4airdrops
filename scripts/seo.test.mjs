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
  SSG_DETAIL_LOCALES,
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

test("SSG detail locales match src/i18n/locales.ts and stay a subset of UI locales", () => {
  assert.deepEqual(SSG_DETAIL_LOCALES, ["en", "zh", "es", "ja", "ko", "pt"]);
  for (const code of SSG_DETAIL_LOCALES) {
    assert.ok(LOCALE_CODES.includes(code), code);
  }
  const src = fs.readFileSync(path.join(ROOT, "src/i18n/locales.ts"), "utf8");
  const m = src.match(/export const detailLocales = \[([^\]]+)\]/);
  assert.ok(m, "detailLocales export");
  const fromSrc = m[1]
    .split(",")
    .map((s) => s.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
  assert.deepEqual(fromSrc, SSG_DETAIL_LOCALES);
});

test("sitemap lists every locale home/about; details only for SSG locales", () => {
  const xml = buildSitemapXml({ ids: ["ext-af7da96f88"], lastmod: "2026-09-10" });
  assert.match(xml, /xmlns:xhtml="http:\/\/www.w3.org\/1999\/xhtml"/);
  for (const code of LOCALE_CODES) {
    assert.match(xml, new RegExp(`<loc>${SITE_ORIGIN}/${code}</loc>`));
    assert.match(xml, new RegExp(`<loc>${SITE_ORIGIN}/${code}/about</loc>`));
    assert.match(xml, new RegExp(`hreflang="${HTML_LANG[code]}" href="${SITE_ORIGIN}/${code}"`));
  }
  for (const code of SSG_DETAIL_LOCALES) {
    assert.match(xml, new RegExp(`<loc>${SITE_ORIGIN}/${code}/g/ext-af7da96f88</loc>`));
    assert.match(xml, new RegExp(`hreflang="${HTML_LANG[code]}" href="${SITE_ORIGIN}/${code}/g/ext-af7da96f88"`));
  }
  const chromeOnly = LOCALE_CODES.filter((code) => !SSG_DETAIL_LOCALES.includes(code));
  for (const code of chromeOnly) {
    assert.doesNotMatch(xml, new RegExp(`<loc>${SITE_ORIGIN}/${code}/g/ext-af7da96f88</loc>`));
    assert.doesNotMatch(xml, new RegExp(`hreflang="${HTML_LANG[code]}" href="${SITE_ORIGIN}/${code}/g/`));
  }
  assert.match(xml, /hreflang="x-default" href="https:\/\/4airdrops.com\/en"/);
  assert.match(xml, /hreflang="x-default" href="https:\/\/4airdrops.com\/en\/g\/ext-af7da96f88"/);
  assert.match(xml, /<lastmod>2026-09-10<\/lastmod>/);
  assert.equal(sitemapPaths(["a", "b"]).length, LOCALE_CODES.length * 2 + SSG_DETAIL_LOCALES.length * 2);
});

const BRAND_FILES = [
  "favicon.ico",
  "icon.svg",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "og.png",
  "site.webmanifest",
];

test("brand kit files exist and are non-empty", () => {
  for (const name of BRAND_FILES) {
    const p = path.join(ROOT, "public", name);
    assert.ok(fs.existsSync(p), p);
    assert.ok(fs.statSync(p).size > 0, `${name} size`);
  }
});

test("PNG brand assets have PNG signatures and expected pixel sizes", () => {
  const sizes = {
    "favicon-16x16.png": [16, 16],
    "favicon-32x32.png": [32, 32],
    "apple-touch-icon.png": [180, 180],
    "og.png": [1200, 630],
  };
  for (const [name, [w, h]] of Object.entries(sizes)) {
    const buf = fs.readFileSync(path.join(ROOT, "public", name));
    assert.equal(buf[0], 0x89);
    assert.equal(buf.toString("ascii", 1, 4), "PNG");
    assert.equal(buf.readUInt32BE(16), w, `${name} width`);
    assert.equal(buf.readUInt32BE(20), h, `${name} height`);
  }
});

test("favicon.ico is an ICO container", () => {
  const buf = fs.readFileSync(path.join(ROOT, "public", "favicon.ico"));
  assert.equal(buf.readUInt16LE(0), 0);
  assert.equal(buf.readUInt16LE(2), 1);
  assert.ok(buf.readUInt16LE(4) >= 1);
});

test("icon.svg and webmanifest use Excel green #217346 and 4A", () => {
  const svg = fs.readFileSync(path.join(ROOT, "public", "icon.svg"), "utf8");
  assert.match(svg, /#217346/);
  assert.match(svg, />4A</);
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "site.webmanifest"), "utf8"));
  assert.equal(manifest.theme_color, "#217346");
  assert.equal(manifest.short_name, "4A");
  assert.equal(manifest.name, "4Airdrops");
  assert.ok(manifest.icons.some((i) => i.src === "/icon.svg"));
  assert.ok(manifest.icons.some((i) => i.src === "/apple-touch-icon.png"));
});

test("localeMetadata source wires icons, themeColor, OG/twitter, manifest", () => {
  const src = fs.readFileSync(path.join(ROOT, "src/lib/seo.ts"), "utf8");
  assert.match(src, /THEME_COLOR = "#217346"/);
  assert.match(src, /themeColor: THEME_COLOR/);
  assert.match(src, /manifest: MANIFEST_PATH/);
  assert.match(src, /\/favicon\.ico/);
  assert.match(src, /\/icon\.svg/);
  assert.match(src, /\/apple-touch-icon\.png/);
  assert.match(src, /card: "summary_large_image"/);
  assert.match(src, /OG_IMAGE_PATH = "\/og\.png"/);
  const layout = fs.readFileSync(path.join(ROOT, "src/app/[locale]/layout.tsx"), "utf8");
  assert.match(layout, /homeMetadata/);
});
