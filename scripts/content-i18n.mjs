import fs from "node:fs";

/**
 * Ingest-time English + locale-matched title/prize fields.
 *
 * Kept on every row:
 *   originals: title, prize, prizeDetail, entry, risk
 *   English:   titleEn, prizeEn, prizeDetailEn, entryEn, riskEn
 *   i18n maps: titleI18n, prizeI18n  (Partial<Record<Locale, string>>)
 *
 * UI locales (src/i18n/locales.ts):
 *   en zh es pt ar id ru ja de fr ko vi tr hi
 *
 * Translation provider: Kie Gemini 3.5 Flash (OpenAI-compatible).
 *   POST ${KIE_API_BASE||https://api.kie.ai}/gemini-3-5-flash-openai/v1/chat/completions
 *   model gemini-3-5-flash
 *   Authorization: Bearer ${KIE_API_KEY}
 *
 * Cache key is (source, targetLang). Previous giveaways.json *En / *I18n
 * are reused when id + source text are unchanged.
 *
 * Non-en locales are translated in batches of ~20–40 unique strings.
 *
 * Missing KIE_API_KEY without --skip-en → hard error (import-csv exits).
 * --allow-gtx-fallback uses unofficial Google gtx / MyMemory if Kie is
 * unavailable. Do not use that path for production ingest.
 */

export const LOCALE_CODES = [
  "en",
  "zh",
  "es",
  "pt",
  "ar",
  "id",
  "ru",
  "ja",
  "de",
  "fr",
  "ko",
  "vi",
  "tr",
  "hi",
];

export const NON_EN_LOCALES = LOCALE_CODES.filter((l) => l !== "en");

export const LANG_NAMES = {
  en: "English",
  zh: "Simplified Chinese",
  es: "Spanish",
  pt: "Portuguese",
  ar: "Arabic",
  id: "Indonesian",
  ru: "Russian",
  ja: "Japanese",
  de: "German",
  fr: "French",
  ko: "Korean",
  vi: "Vietnamese",
  tr: "Turkish",
  hi: "Hindi",
};

export const KIE_DEFAULT_BASE = "https://api.kie.ai";
export const KIE_MODEL = "gemini-3-5-flash";
export const KIE_PATH = "/gemini-3-5-flash-openai/v1/chat/completions";
export const I18N_BATCH_SIZE = 32;

const CJK_OR_NON_LATIN =
  /[\u0400-\u04ff\u0600-\u06ff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uf900-\ufaff]/;

/** Stubborn strings the free endpoints mangle; used after cleanDisplayText. */
const MANUAL_EN = new Map([
  [
    "《404호실의 비밀 마사지》 푸짐한 경품 세트 증정 이벤트!",
    "Secret Massage in Room 404 — prize-set giveaway",
  ],
  ["Всемирное октябрьское событие  Часть I", "Global October Event Part I"],
  ["Всемирное октябрьское событие Часть I", "Global October Event Part I"],
  [
    "栃木レザー使用 本革 小さいドット ラウンド型長財布 プレゼント企画",
    "Tochigi-leather genuine-leather small-dot round wallet giveaway",
  ],
]);

export const EN_FIELDS = [
  ["title", "titleEn"],
  ["prize", "prizeEn"],
  ["prizeDetail", "prizeDetailEn"],
  ["entry", "entryEn"],
  ["risk", "riskEn"],
];

export const I18N_FIELDS = [
  { original: "title", en: "titleEn", i18n: "titleI18n" },
  { original: "prize", en: "prizeEn", i18n: "prizeI18n", altOriginal: "prizeDetail", altEn: "prizeDetailEn" },
];

export function cleanDisplayText(raw) {
  if (!raw) return "";
  let s = String(raw).trim();
  const meta = s.match(/content="([^"]+)"/i) || s.match(/content='([^']+)'/i);
  if (meta?.[1]) s = meta[1].trim();
  const js = s.search(/\(\(a,b,c,d/);
  if (js >= 0) s = s.slice(0, js).trim();
  s = s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^"+|"+$/g, "").trim();
  return s;
}

export function isPrimarilyLatin(text) {
  const s = (text || "").trim();
  if (!s) return true;
  return !CJK_OR_NON_LATIN.test(s);
}

export function detectSourceLang(text) {
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\u0400-\u04ff]/.test(text)) return "ru";
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  if (isPrimarilyLatin(text)) return "en";
  return "auto";
}

export function cacheKey(source, targetLang) {
  return `${targetLang}\0${source}`;
}

export function kieChatCompletionsUrl(base = process.env.KIE_API_BASE) {
  const root = String(base || KIE_DEFAULT_BASE).replace(/\/+$/, "");
  return `${root}${KIE_PATH}`;
}

export function loadDotEnv(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] == null || process.env[k] === "") process.env[k] = v;
  }
}

export function resolveTranslateMode({
  skipEn = false,
  allowGtxFallback = false,
  apiKey = process.env.KIE_API_KEY,
} = {}) {
  if (skipEn) return "skip";
  if (apiKey && String(apiKey).trim()) return "kie";
  if (allowGtxFallback) return "gtx";
  return "error";
}

export function assertTranslateMode(args = {}) {
  const mode = resolveTranslateMode(args);
  if (mode === "error") {
    console.error(
      "KIE_API_KEY is required for ingest translation. Set it in the environment or .env, or pass --skip-en (offline) or --allow-gtx-fallback.",
    );
    process.exit(1);
  }
  return mode;
}

function enLooksBad(src, en) {
  const s = cleanDisplayText(src);
  const e = (en || "").trim();
  if (!e) return true;
  if (/PLEASE SELECT TWO DISTINCT|MYMEMORY WARNING|"404" "404"|QUERY LENGTH LIMIT/i.test(e)) return true;
  if (/^!{2,}/.test(e)) return true;
  if ((e.match(/404/g) || []).length >= 3) return true;
  if (!isPrimarilyLatin(e) && !isPrimarilyLatin(s)) return true;
  if (s.length > 20 && e.length < Math.max(10, s.length * 0.28)) return true;
  return false;
}

function isBadTranslation(out) {
  if (!out) return true;
  if (/PLEASE SELECT TWO DISTINCT|MYMEMORY WARNING|QUERY LENGTH LIMIT|ERROR:/i.test(out)) return true;
  if (/^!{2,}/.test(out)) return true;
  if ((out.match(/404/g) || []).length >= 3) return true;
  return false;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function chunkStrings(list, size = I18N_BATCH_SIZE) {
  const n = Math.max(1, Number(size) || I18N_BATCH_SIZE);
  const out = [];
  for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
  return out;
}

export function extractKieMessageContent(data) {
  const msg = data?.choices?.[0]?.message;
  let content = msg?.content;
  if (Array.isArray(content)) {
    content = content
      .map((part) => {
        if (typeof part === "string") return part;
        return part?.text || part?.content || "";
      })
      .join("");
  }
  return String(content || "").trim();
}

export function parseKieTranslations(content, expected) {
  let s = String(content || "").trim();
  if (!s) throw new Error("kie empty content");
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(s);
  } catch {
    const start = s.indexOf("[");
    const end = s.lastIndexOf("]");
    if (start >= 0 && end > start) {
      parsed = JSON.parse(s.slice(start, end + 1));
    } else {
      const objStart = s.indexOf("{");
      const objEnd = s.lastIndexOf("}");
      if (objStart >= 0 && objEnd > objStart) {
        parsed = JSON.parse(s.slice(objStart, objEnd + 1));
      }
    }
  }
  if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
    parsed = parsed.translations || parsed.items || parsed.results || Object.values(parsed);
  }
  if (!Array.isArray(parsed)) throw new Error("kie parse: not an array");
  const rows = parsed.map((x) => (x == null ? "" : String(x).trim()));
  if (typeof expected === "number" && rows.length !== expected) {
    throw new Error(`kie parse: expected ${expected} strings, got ${rows.length}`);
  }
  return rows;
}

function splitForUrl(text) {
  if (encodeURIComponent(text).length <= 1600) return [text];
  const pieces = text.split(/(?<=[。！？.!?\n|])/);
  const out = [];
  let buf = "";
  for (const p of pieces) {
    const next = buf + p;
    if (encodeURIComponent(next).length > 1600 && buf) {
      out.push(buf);
      buf = p;
    } else buf = next;
  }
  if (buf) out.push(buf);
  return out.filter(Boolean);
}

function gtxLang(code) {
  if (code === "zh") return "zh-CN";
  if (code === "auto") return "auto";
  return code;
}

async function translateGtx(text, sl = "auto", tl = "en", fetchImpl = fetch) {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
    encodeURIComponent(gtxLang(sl)) +
    "&tl=" +
    encodeURIComponent(gtxLang(tl)) +
    "&dt=t&q=" +
    encodeURIComponent(text);
  const res = await fetchImpl(url, { headers: { "User-Agent": "4airdrops-ingest/1.0" } });
  if (!res.ok) throw new Error(`gtx ${res.status}`);
  const data = await res.json();
  const out = (data?.[0] || []).map((part) => part?.[0] || "").join("").trim();
  if (isBadTranslation(out)) throw new Error("gtx empty");
  return out;
}

async function translateMyMemory(text, tl = "en", fetchImpl = fetch) {
  const pair = `${CJK_OR_NON_LATIN.test(text) ? "zh-CN" : "autodetect"}|${gtxLang(tl)}`;
  const url = "https://api.mymemory.translated.net/get?langpair=" + pair + "&q=" + encodeURIComponent(text);
  const res = await fetchImpl(url, { headers: { "User-Agent": "4airdrops-ingest/1.0" } });
  if (!res.ok) throw new Error(`mymemory ${res.status}`);
  const data = await res.json();
  const out = String(data?.responseData?.translatedText || "").trim();
  if (isBadTranslation(out)) throw new Error("mymemory empty");
  return out;
}

export function buildKieTranslateBody(texts, targetLang) {
  const name = LANG_NAMES[targetLang] || targetLang;
  return {
    model: KIE_MODEL,
    stream: false,
    messages: [
      {
        role: "system",
        content:
          "You are a professional translator for a public giveaway / airdrop directory. Translate faithfully. Keep ticker symbols, token names, amounts, brand names, URLs, and campaign codes unchanged. Return ONLY a JSON array of strings with the same length and order as the input. No markdown, no commentary.",
      },
      {
        role: "user",
        content: `Translate each string into ${name} (${targetLang}).\n${JSON.stringify(texts)}`,
      },
    ],
  };
}

export async function kieTranslateBatch(texts, targetLang, { fetchImpl = fetch, apiKey = process.env.KIE_API_KEY, apiBase } = {}) {
  const key = String(apiKey || "").trim();
  if (!key) throw new Error("KIE_API_KEY missing");
  const res = await fetchImpl(kieChatCompletionsUrl(apiBase), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildKieTranslateBody(texts, targetLang)),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`kie ${res.status} ${raw.slice(0, 180)}`);
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("kie non-JSON response");
  }
  return parseKieTranslations(extractKieMessageContent(data), texts.length);
}

async function gtxTranslateOne(text, targetLang, fetchImpl) {
  const sl = detectSourceLang(text);
  const chunks = splitForUrl(text);
  const parts = [];
  for (const chunk of chunks) {
    let out;
    if (sl !== "auto") {
      try {
        out = await translateGtx(chunk, sl, targetLang, fetchImpl);
      } catch {
        out = undefined;
      }
    }
    if (!out) {
      try {
        out = await translateGtx(chunk, "auto", targetLang, fetchImpl);
      } catch {
        out = await translateMyMemory(chunk, targetLang, fetchImpl);
      }
    }
    parts.push(out);
  }
  const joined = parts.join(" ").replace(/\s+/g, " ").trim();
  if (isBadTranslation(joined)) throw new Error("gtx empty");
  return joined;
}

export function createTranslator({
  mode = "kie",
  cache = new Map(),
  fetchImpl = fetch,
  batchSize = I18N_BATCH_SIZE,
  allowGtxFallback = false,
  apiKey = process.env.KIE_API_KEY,
  apiBase = process.env.KIE_API_BASE,
} = {}) {
  return {
    mode,
    cache,
    fetchImpl,
    batchSize,
    allowGtxFallback,
    apiKey,
    apiBase,
  };
}

export async function translateMany(translator, sources, targetLang, stats) {
  const unique = [];
  const seen = new Set();
  const result = new Map();
  for (const src of sources) {
    const text = cleanDisplayText(src);
    if (!text) {
      result.set(src, "");
      continue;
    }
    if (targetLang === "en" && MANUAL_EN.has(text)) {
      result.set(text, MANUAL_EN.get(text));
      if (stats) stats.copied += 1;
      continue;
    }
    if (detectSourceLang(text) === targetLang) {
      result.set(text, text);
      if (stats) stats.copied += 1;
      continue;
    }
    const hit = translator.cache.get(cacheKey(text, targetLang));
    if (hit) {
      result.set(text, hit);
      if (stats) stats.cache += 1;
      continue;
    }
    if (!seen.has(text)) {
      seen.add(text);
      unique.push(text);
    }
  }
  if (!unique.length) {
    return sources.map((s) => result.get(cleanDisplayText(s)) || "");
  }

  const batches = translator.mode === "gtx" ? unique.map((s) => [s]) : chunkStrings(unique, translator.batchSize);
  for (const batch of batches) {
    let translated;
    try {
      translated = await translateBatchWithRetry(translator, batch, targetLang);
    } catch (err) {
      if (translator.mode === "kie" && translator.allowGtxFallback) {
        console.warn("Kie batch failed, gtx fallback:", err?.message || err);
        translated = [];
        for (const item of batch) {
          try {
            translated.push(await gtxTranslateOne(item, targetLang, translator.fetchImpl));
          } catch {
            translated.push("");
          }
        }
      } else {
        throw err;
      }
    }
    for (let i = 0; i < batch.length; i++) {
      const src = batch[i];
      const out = cleanDisplayText(translated[i] || "");
      if (out) {
        translator.cache.set(cacheKey(src, targetLang), out);
        result.set(src, out);
        if (stats) stats.translated += 1;
      } else {
        if (stats) stats.failed += 1;
        result.set(src, "");
      }
    }
    if (translator.mode === "kie") await sleep(80);
  }
  return sources.map((s) => result.get(cleanDisplayText(s)) || "");
}

async function translateBatchWithRetry(translator, batch, targetLang) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (translator.mode === "gtx") {
        return [await gtxTranslateOne(batch[0], targetLang, translator.fetchImpl)];
      }
      return await kieTranslateBatch(batch, targetLang, {
        fetchImpl: translator.fetchImpl,
        apiKey: translator.apiKey,
        apiBase: translator.apiBase,
      });
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err);
      if (translator.mode === "kie" && batch.length > 1 && /parse|length/i.test(msg)) {
        const mid = Math.ceil(batch.length / 2);
        const left = await translateBatchWithRetry(translator, batch.slice(0, mid), targetLang);
        const right = await translateBatchWithRetry(translator, batch.slice(mid), targetLang);
        return left.concat(right);
      }
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastErr || new Error("translate failed");
}

export async function toEnglish(text, cache, stats, translator) {
  const src = cleanDisplayText(text);
  if (!src) return "";
  if (MANUAL_EN.has(src) || MANUAL_EN.has(String(text).trim())) {
    stats.translated += 1;
    return MANUAL_EN.get(src) || MANUAL_EN.get(String(text).trim());
  }
  if (isPrimarilyLatin(src)) {
    stats.copied += 1;
    return src;
  }
  const tx = translator || createTranslator({ mode: "kie", cache });
  tx.cache = cache;
  const [en] = await translateMany(tx, [src], "en", stats);
  if (en && !enLooksBad(src, en)) return en;
  stats.failed += 1;
  console.warn("translate failed, leaving En empty:", src.slice(0, 60));
  return "";
}

export async function fillEnglishFields(item, { cache, stats, force = false, translator } = {}) {
  const out = { ...item };
  for (const [srcKey, destKey] of EN_FIELDS) {
    const raw = item[srcKey];
    if (!raw || !String(raw).trim()) {
      delete out[destKey];
      continue;
    }
    if (!force && item[destKey] && !enLooksBad(raw, item[destKey])) {
      out[destKey] = String(item[destKey]).trim();
      stats.reused += 1;
      continue;
    }
    const en = await toEnglish(raw, cache, stats, translator);
    if (en) out[destKey] = en;
    else delete out[destKey];
  }
  return out;
}

function fieldSources(item, spec) {
  const original = cleanDisplayText(item[spec.original]) || (spec.altOriginal ? cleanDisplayText(item[spec.altOriginal]) : "");
  const en = cleanDisplayText(item[spec.en]) || (spec.altEn ? cleanDisplayText(item[spec.altEn]) : "");
  return { original, en, pivot: en || original };
}

function sourceUnchanged(item, prev, spec) {
  if (!prev) return false;
  if (String(prev[spec.original] || "") !== String(item[spec.original] || "")) return false;
  if (spec.altOriginal && String(prev[spec.altOriginal] || "") !== String(item[spec.altOriginal] || "")) {
    return false;
  }
  return true;
}

export function reuseUnchangedEn(item, prev) {
  if (!prev) return item;
  const out = { ...item };
  for (const [srcKey, destKey] of EN_FIELDS) {
    if (out[destKey]) continue;
    if (prev[destKey] && String(prev[srcKey] || "") === String(item[srcKey] || "")) {
      out[destKey] = prev[destKey];
    }
  }
  return out;
}

export function reuseUnchangedI18n(item, prev) {
  if (!prev) return item;
  const out = { ...item };
  for (const spec of I18N_FIELDS) {
    if (out[spec.i18n] && Object.keys(out[spec.i18n]).length) {
      if (sourceUnchanged(item, prev, spec) && prev[spec.i18n]) {
        out[spec.i18n] = { ...prev[spec.i18n], ...out[spec.i18n] };
      }
      continue;
    }
    if (sourceUnchanged(item, prev, spec) && prev[spec.i18n]) {
      out[spec.i18n] = { ...prev[spec.i18n] };
    }
  }
  return out;
}

export function reuseUnchangedContent(item, prev) {
  return reuseUnchangedI18n(reuseUnchangedEn(item, prev), prev);
}

function compactLocaleMap(map) {
  if (!map || typeof map !== "object") return undefined;
  const out = {};
  for (const code of LOCALE_CODES) {
    const v = cleanDisplayText(map[code]);
    if (v) out[code] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function fillI18nFields(items, { cache, stats, force = false, translator } = {}) {
  const out = items.map((item) => ({ ...item }));
  const queued = new Map();
  for (const lang of NON_EN_LOCALES) queued.set(lang, new Map());

  for (const item of out) {
    for (const spec of I18N_FIELDS) {
      const { original, en, pivot } = fieldSources(item, spec);
      const map = { ...(item[spec.i18n] || {}) };
      if (force) {
        for (const k of Object.keys(map)) delete map[k];
      }
      if (en) map.en = en;
      else if (pivot) map.en = pivot;
      if (!pivot) {
        item[spec.i18n] = compactLocaleMap(map);
        continue;
      }
      for (const lang of NON_EN_LOCALES) {
        if (!force && cleanDisplayText(map[lang])) {
          stats.reused += 1;
          continue;
        }
        const detected = detectSourceLang(original || pivot);
        if (detected === lang) {
          map[lang] = original || pivot;
          stats.copied += 1;
          continue;
        }
        const cached = cache.get(cacheKey(pivot, lang));
        if (cached) {
          map[lang] = cached;
          stats.cache += 1;
          continue;
        }
        const bucket = queued.get(lang);
        if (!bucket.has(pivot)) bucket.set(pivot, []);
        bucket.get(pivot).push({ item, spec, map });
      }
      item[spec.i18n] = map;
    }
  }

  for (const lang of NON_EN_LOCALES) {
    const bucket = queued.get(lang);
    const sources = [...bucket.keys()];
    if (!sources.length) continue;
    const batches = chunkStrings(sources, translator.batchSize);
    for (const batch of batches) {
      let translated = [];
      try {
        translated = await translateMany(translator, batch, lang, stats);
      } catch (err) {
        console.warn(`i18n ${lang} batch failed:`, err?.message || err);
        translated = batch.map(() => "");
        stats.failed += batch.length;
      }
      for (let i = 0; i < batch.length; i++) {
        const src = batch[i];
        const text = cleanDisplayText(translated[i] || "");
        for (const ref of bucket.get(src) || []) {
          if (text) ref.map[lang] = text;
          ref.item[ref.spec.i18n] = compactLocaleMap(ref.map);
        }
      }
    }
  }

  for (const item of out) {
    for (const spec of I18N_FIELDS) {
      item[spec.i18n] = compactLocaleMap(item[spec.i18n]);
      if (!item[spec.i18n]) delete item[spec.i18n];
    }
  }
  return out;
}

export function emptyEnStats() {
  return { copied: 0, translated: 0, cache: 0, reused: 0, failed: 0 };
}

export function emptyI18nStats() {
  return { copied: 0, translated: 0, cache: 0, reused: 0, failed: 0 };
}
