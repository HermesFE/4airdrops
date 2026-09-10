import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSitemapXml } from "./seo-urls.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data", "giveaways.json");
const OUT = path.join(ROOT, "public", "sitemap.xml");

const raw = JSON.parse(fs.readFileSync(DATA, "utf8"));
const ids = Array.isArray(raw.items) ? raw.items.map((g) => g.id).filter(Boolean) : [];
const lastmod = typeof raw.updatedAt === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw.updatedAt) ? raw.updatedAt : "";

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, buildSitemapXml({ ids, lastmod }));
console.log(`Wrote ${OUT} (${ids.length} giveaways × locales)`);
