#!/usr/bin/env node
/**
 * Daily sync: Giveaway主表 CSV/JSON -> data/giveaways.json
 *
 * Expected CSV headers (Chinese, extra columns ignored):
 *   id, 项目名, 平台, 分类, 主办方, 奖品概述, 奖项明细,
 *   截止时间原文, 截止时间(北京), 地区限制, 参与方式摘要,
 *   链接, 官方链接, 风险备注, 活动状态,
 *   首次发现, 开始时间   (optional)
 *
 * Default: keep 活动状态 === 疑似进行中 (the "ongoing / unverified" set).
 * 状态不明 is ~thousands of rows — only include with --include-unknown.
 *
 * English display fields (titleEn, prizeEn, prizeDetailEn, entryEn, riskEn):
 *   Filled at ingest. Originals are kept. UI chrome is the 14-locale i18n
 *   layer; we do NOT translate every row into 14 languages.
 *   Latin/English source → copy through. Otherwise machine-translate to
 *   English (Google gtx unofficial endpoint, MyMemory fallback). See
 *   scripts/english-display.mjs. Previous giveaways.json *En values are
 *   reused when id + source text are unchanged.
 *
 * Usage:
 *   npm run import-csv -- /path/to/Giveaway主表.csv
 *   npm run import-csv -- ./export.json --include-unknown --max 1200
 *   npm run import-csv -- data/giveaways.json --skip-en
 *   npm run import-csv -- data/giveaways.json --force-en
 *
 * Writes data/giveaways.json (compact). Cloudflare Pages build: npm run build.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EN_FIELDS, emptyEnStats, fillEnglishFields, reuseUnchangedEn } from "./english-display.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEFAULT_OUT = path.join(ROOT, "data", "giveaways.json");

const STATUS_ONGOING = "疑似进行中";
const STATUS_UNKNOWN = "状态不明";

const COL = {
  id: ["id"],
  title: ["项目名", "title"],
  platform: ["平台", "platform"],
  category: ["分类", "category"],
  host: ["主办方", "host"],
  prize: ["奖品概述", "prize"],
  prizeDetail: ["奖项明细", "prizeDetail"],
  deadlineRaw: ["截止时间原文", "deadlineRaw"],
  deadlineBj: ["截止时间(北京)", "截止时间（北京）", "deadlineBj"],
  region: ["地区限制", "region"],
  entry: ["参与方式摘要", "entry"],
  url: ["链接", "url"],
  sourceUrl: ["官方链接", "sourceUrl"],
  risk: ["风险备注", "risk"],
  status: ["活动状态", "status"],
  firstSeen: ["首次发现", "firstSeen"],
  startedAt: ["开始时间", "startedAt"],
};

function parseArgs(argv) {
  const args = {
    file: "",
    includeUnknown: false,
    includeEnded: false,
    max: 0,
    out: "",
    skipEn: false,
    forceEn: false,
  };
  for (const a of argv) {
    if (a === "--include-unknown") args.includeUnknown = true;
    else if (a === "--include-ended") args.includeEnded = true;
    else if (a === "--skip-en") args.skipEn = true;
    else if (a === "--force-en") args.forceEn = true;
    else if (a.startsWith("--max=")) args.max = Number(a.slice(6)) || 0;
    else if (a.startsWith("--out=")) args.out = a.slice(6);
    else if (a === "--max") args._maxNext = true;
    else if (a === "--out") args._outNext = true;
    else if (args._maxNext) {
      args.max = Number(a) || 0;
      delete args._maxNext;
    } else if (args._outNext) {
      args.out = a;
      delete args._outNext;
    } else if (!a.startsWith("-")) args.file = a;
  }
  return args;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, "");
  while (i < s.length) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
      cell = "";
      i += 1;
      continue;
    }
    cell += c;
    i += 1;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    if (row.some((x) => x !== "")) rows.push(row);
  }
  return rows;
}

function pick(obj, aliases) {
  for (const k of aliases) {
    if (obj[k] != null && String(obj[k]).trim() !== "") return String(obj[k]).trim();
  }
  return "";
}

function rowToItem(obj) {
  const id = pick(obj, COL.id);
  const title = pick(obj, COL.title);
  if (!id && !title) return null;
  const item = {
    id: id || `row-${Math.random().toString(16).slice(2)}`,
    title,
    platform: pick(obj, COL.platform),
    category: pick(obj, COL.category),
    host: pick(obj, COL.host),
    prize: pick(obj, COL.prize),
    prizeDetail: pick(obj, COL.prizeDetail),
    deadlineRaw: pick(obj, COL.deadlineRaw),
    deadlineBj: pick(obj, COL.deadlineBj),
    region: pick(obj, COL.region),
    entry: pick(obj, COL.entry),
    url: pick(obj, COL.url),
    sourceUrl: pick(obj, COL.sourceUrl),
    risk: pick(obj, COL.risk),
    status: pick(obj, COL.status),
    firstSeen: pick(obj, COL.firstSeen) || undefined,
    startedAt: pick(obj, COL.startedAt) || undefined,
  };
  for (const [, dest] of EN_FIELDS) {
    const v = pick(obj, [dest]);
    if (v) item[dest] = v;
  }
  return item;
}

function loadPrevious(outFile) {
  try {
    if (!fs.existsSync(outFile)) return new Map();
    const data = JSON.parse(fs.readFileSync(outFile, "utf8"));
    const list = Array.isArray(data) ? data : data.items || [];
    return new Map(list.filter((i) => i && i.id).map((i) => [i.id, i]));
  } catch {
    return new Map();
  }
}

function loadItems(file) {
  const raw = fs.readFileSync(file, "utf8");
  if (file.endsWith(".json")) {
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : data.items || [];
    return { items: list.map((row) => rowToItem(row)).filter(Boolean), meta: data };
  }
  const rows = parseCsv(raw);
  if (!rows.length) return { items: [], meta: null };
  const headers = rows[0].map((h) => h.trim());
  return {
    items: rows
      .slice(1)
      .map((cells) => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = cells[i] ?? "";
        });
        return rowToItem(obj);
      })
      .filter(Boolean),
    meta: null,
  };
}

function compactItem(item) {
  const out = {};
  for (const [k, v] of Object.entries(item)) {
    if (v == null || v === "") continue;
    out[k] = v;
  }
  return out;
}

function countByStatus(items) {
  const out = {};
  for (const i of items) {
    const k = i.status || "(empty)";
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.file) {
  console.error(
    "Usage: npm run import-csv -- /path/to/Giveaway主表.csv [--include-unknown] [--max N] [--skip-en|--force-en]",
  );
  process.exit(1);
}
const abs = path.resolve(args.file);
if (!fs.existsSync(abs)) {
  console.error("File not found:", abs);
  process.exit(1);
}

const { items: loaded, meta: inputMeta } = loadItems(abs);
const all = loaded;
const counted = countByStatus(all);
const priorCounts = inputMeta?.sync?.masterCounts;
const masterCounts =
  priorCounts && Object.keys(priorCounts).length > Object.keys(counted).length ? priorCounts : counted;
let items = all.filter((i) => {
  if (i.status === STATUS_ONGOING) return true;
  if (args.includeUnknown && i.status === STATUS_UNKNOWN) return true;
  if (args.includeEnded) return true;
  return false;
});
if (args.max > 0) items = items.slice(0, args.max);

const OUT = args.out ? path.resolve(args.out) : DEFAULT_OUT;
const prevById = loadPrevious(OUT);
const enStats = emptyEnStats();
if (!args.skipEn) {
  const cache = new Map();
  const filled = [];
  for (let i = 0; i < items.length; i++) {
    const merged = reuseUnchangedEn(items[i], prevById.get(items[i].id));
    filled.push(await fillEnglishFields(merged, { cache, stats: enStats, force: args.forceEn }));
    if ((i + 1) % 100 === 0) {
      console.log(`English display ${i + 1}/${items.length} …`, enStats);
    }
  }
  items = filled.map(compactItem);
} else {
  items = items.map(compactItem);
}

const payload = {
  updatedAt: new Date().toISOString().slice(0, 10),
  count: items.length,
  items,
  note: args.includeUnknown
    ? "Imported with --include-unknown. Prefer default 疑似进行中-only for Cloudflare Pages size."
    : "Daily sync: 活动状态=疑似进行中. UI label: Active (unverified) / 进行中（待核验）. Row content: original + titleEn/prizeEn/entryEn.",
  sync: {
    source: inputMeta?.sync?.source || path.basename(abs),
    defaultStatus: STATUS_ONGOING,
    includeUnknown: args.includeUnknown,
    masterCounts,
    command: "npm run import-csv -- /path/to/Giveaway主表.csv",
    enDisplay: {
      method:
        "Latin/English copied through. Else Google translate.googleapis.com/translate_a/single?client=gtx (no key), MyMemory fallback. See scripts/english-display.mjs.",
      skipEn: args.skipEn,
      forceEn: args.forceEn,
      ...enStats,
    },
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload));
console.log(`Wrote ${items.length} / ${all.length} rows -> ${path.relative(ROOT, OUT)}`);
console.log("Master status counts:", masterCounts);
console.log("English display:", args.skipEn ? "skipped" : enStats);
