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
 * Parseable absolute datetimes already before now (BJ/CST clock unless the
 * row labels UTC) are marked 已结束/过期 and dropped from that default slice.
 * Relative "N days/months" countdowns are not auto-ended.
 * Placeholder list-scrape titles (Providers / 提供商) are repaired from the
 * campaign URL slug before the ongoing filter (see scripts/titles.mjs).
 * 状态不明 is ~thousands of rows — only include with --include-unknown.
 *
 * Content fields:
 *   Originals stay (title, prize, prizeDetail, entry, risk).
 *   English display (*En) is filled at ingest.
 *   titleI18n / prizeI18n are Partial<Record<Locale,string>> for the 14 UI
 *   locales, filled via Kie Gemini 3.5 Flash. See scripts/content-i18n.mjs.
 *   Previous giveaways.json *En / *I18n values are reused when id + source
 *   text are unchanged.
 *
 * Usage:
 *   KIE_API_KEY=... npm run import-csv -- /path/to/Giveaway主表.csv
 *   npm run import-csv -- ./export.json --include-unknown --max 1200
 *   npm run import-csv -- data/giveaways.json --skip-en --skip-i18n
 *   npm run import-csv -- data/giveaways.json --force-en --force-i18n
 *
 * Writes data/giveaways.json (compact). Cloudflare Pages build: npm run build
 * (build does not call Kie and does not need KIE_API_KEY).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EN_FIELDS,
  assertTranslateMode,
  createTranslator,
  emptyEnStats,
  emptyI18nStats,
  fillEnglishFields,
  fillI18nFields,
  loadDotEnv,
  reuseUnchangedContent,
} from "./content-i18n.mjs";
import {
  MASTER_STATUS_ENDED,
  MASTER_STATUS_ONGOING,
  MASTER_STATUS_UNKNOWN,
  expirePastDeadlines,
  selectSiteItems,
} from "./deadline.mjs";
import { isPlaceholderTitle, repairPlaceholderTitles } from "./titles.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
loadDotEnv(path.join(ROOT, ".env"));

const DEFAULT_OUT = path.join(ROOT, "data", "giveaways.json");

const STATUS_ONGOING = MASTER_STATUS_ONGOING;
const STATUS_ENDED = MASTER_STATUS_ENDED;

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
    skipI18n: false,
    forceI18n: false,
    allowGtxFallback: false,
  };
  for (const a of argv) {
    if (a === "--include-unknown") args.includeUnknown = true;
    else if (a === "--include-ended") args.includeEnded = true;
    else if (a === "--skip-en") args.skipEn = true;
    else if (a === "--force-en") args.forceEn = true;
    else if (a === "--skip-i18n") args.skipI18n = true;
    else if (a === "--force-i18n") args.forceI18n = true;
    else if (a === "--allow-gtx-fallback") args.allowGtxFallback = true;
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

function copyLocaleMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (v != null && String(v).trim()) out[k] = String(v).trim();
  }
  return Object.keys(out).length ? out : undefined;
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
  const titleI18n = copyLocaleMap(obj.titleI18n);
  const prizeI18n = copyLocaleMap(obj.prizeI18n);
  if (titleI18n) item.titleI18n = titleI18n;
  if (prizeI18n) item.prizeI18n = prizeI18n;
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
    if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) continue;
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
    "Usage: npm run import-csv -- /path/to/Giveaway主表.csv [--include-unknown] [--max N] [--skip-en|--force-en] [--skip-i18n|--force-i18n] [--allow-gtx-fallback]",
  );
  process.exit(1);
}
const abs = path.resolve(args.file);
if (!fs.existsSync(abs)) {
  console.error("File not found:", abs);
  process.exit(1);
}

const mode = assertTranslateMode({
  skipEn: args.skipEn,
  allowGtxFallback: args.allowGtxFallback,
});
if (mode === "gtx") {
  console.warn("Using unofficial Google gtx / MyMemory (--allow-gtx-fallback). Prefer KIE_API_KEY.");
}

function reconcileMasterCounts(counted, priorCounts, expiredN, ongoingKept) {
  if (counted[MASTER_STATUS_UNKNOWN] != null) return counted;
  const prior = priorCounts && typeof priorCounts === "object" ? priorCounts : {};
  const priorOngoing = Number(prior[MASTER_STATUS_ONGOING]) || 0;
  const unexplained = Math.max(0, priorOngoing - ongoingKept - expiredN);
  return {
    ...prior,
    ...counted,
    [MASTER_STATUS_UNKNOWN]: prior[MASTER_STATUS_UNKNOWN] ?? counted[MASTER_STATUS_UNKNOWN],
    [MASTER_STATUS_ONGOING]: ongoingKept,
    [MASTER_STATUS_ENDED]: (Number(prior[MASTER_STATUS_ENDED]) || 0) + expiredN + unexplained,
  };
}

const { items: loaded, meta: inputMeta } = loadItems(abs);
const all = loaded;
const titleStats = repairPlaceholderTitles(all);
const expiredN = expirePastDeadlines(all);
const counted = countByStatus(all);
let items = selectSiteItems(all, {
  includeUnknown: args.includeUnknown,
  includeEnded: args.includeEnded,
});
const droppedPlaceholder = items.filter((i) => isPlaceholderTitle(i.title)).length;
items = items.filter((i) => !isPlaceholderTitle(i.title));
if (args.max > 0) items = items.slice(0, args.max);
const ongoingKept = items.filter((i) => i.status === STATUS_ONGOING).length;
const masterCounts = reconcileMasterCounts(counted, inputMeta?.sync?.masterCounts, expiredN, ongoingKept);

const OUT = args.out ? path.resolve(args.out) : DEFAULT_OUT;
const prevById = loadPrevious(OUT);
const enStats = emptyEnStats();
const i18nStats = emptyI18nStats();
const cache = new Map();
const translator = createTranslator({
  mode: mode === "skip" ? "kie" : mode,
  cache,
  allowGtxFallback: args.allowGtxFallback,
});

items = items.map((item) => reuseUnchangedContent(item, prevById.get(item.id)));

if (!args.skipEn) {
  const filled = [];
  for (let i = 0; i < items.length; i++) {
    filled.push(await fillEnglishFields(items[i], { cache, stats: enStats, force: args.forceEn, translator }));
    if ((i + 1) % 100 === 0) {
      console.log(`English display ${i + 1}/${items.length} …`, enStats);
    }
  }
  items = filled;
}

// --skip-en is the offline hatch: no Kie calls unless --force-i18n is explicit.
const skipI18nNetwork = args.skipI18n || (args.skipEn && !args.forceI18n);
if (!skipI18nNetwork) {
  const hasKey = Boolean(process.env.KIE_API_KEY && String(process.env.KIE_API_KEY).trim());
  if (!hasKey && !args.allowGtxFallback) {
    console.warn("Skipping titleI18n/prizeI18n network fill (no KIE_API_KEY).");
  } else {
    const i18nTranslator = createTranslator({
      mode: hasKey ? "kie" : "gtx",
      cache,
      allowGtxFallback: args.allowGtxFallback,
    });
    items = await fillI18nFields(items, {
      cache,
      stats: i18nStats,
      force: args.forceI18n,
      translator: i18nTranslator,
    });
    console.log("Content i18n:", i18nStats);
  }
}

items = items.map(compactItem);

const payload = {
  updatedAt: new Date().toISOString().slice(0, 10),
  count: items.length,
  items,
  note: args.includeUnknown
    ? "Imported with --include-unknown. Prefer default 疑似进行中-only for Cloudflare Pages size."
    : "Daily sync: 活动状态=疑似进行中. UI label: Active (unverified) / 进行中（待核验）. Row content: original + *En + titleI18n/prizeI18n.",
  sync: {
    source: inputMeta?.sync?.source || path.basename(abs),
    defaultStatus: STATUS_ONGOING,
    endedStatus: STATUS_ENDED,
    expiredPastDeadline: expiredN,
    repairedPlaceholderTitles: titleStats.repaired,
    unresolvedPlaceholderTitles: titleStats.unresolved,
    droppedPlaceholderTitles: droppedPlaceholder,
    includeUnknown: args.includeUnknown,
    masterCounts,
    command: "KIE_API_KEY=… npm run import-csv -- /path/to/Giveaway主表.csv",
    enDisplay: {
      method:
        "Kie Gemini 3.5 Flash (POST /gemini-3-5-flash-openai/v1/chat/completions, model gemini-3-5-flash). Latin/English copied through. Optional --allow-gtx-fallback. See scripts/content-i18n.mjs.",
      skipEn: args.skipEn,
      forceEn: args.forceEn,
      skipI18n: args.skipI18n,
      forceI18n: args.forceI18n,
      allowGtxFallback: args.allowGtxFallback,
      provider: skipI18nNetwork ? "skipped" : process.env.KIE_API_KEY ? "kie" : args.allowGtxFallback ? "gtx" : "skipped",
      ...enStats,
    },
    contentI18n: i18nStats,
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload));
console.log(`Wrote ${items.length} / ${all.length} rows -> ${path.relative(ROOT, OUT)}`);
if (expiredN) console.log(`Expired past-deadline rows → ${STATUS_ENDED}:`, expiredN);
if (titleStats.repaired) console.log(`Repaired placeholder titles:`, titleStats.repaired);
if (droppedPlaceholder) console.log(`Dropped unresolved placeholder titles:`, droppedPlaceholder);
console.log("Master status counts:", masterCounts);
console.log("English display:", args.skipEn ? "skipped" : enStats);
console.log("Content i18n:", skipI18nNetwork ? "skipped" : i18nStats);
