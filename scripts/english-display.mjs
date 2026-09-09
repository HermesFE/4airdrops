/**
 * Ingest-time English display fields for row content.
 *
 * Daily sync does NOT translate into 14 UI locales. Chrome stays i18n;
 * row body is original + one English display copy.
 *
 * Method (no paid API keys):
 *  1. Clean scraped fragments (same rules as src/lib/text.ts).
 *  2. If the text is already primarily Latin / English, copy it to *En.
 *  3. Otherwise machine-translate to English:
 *       primary: Google Translate unofficial web endpoint
 *         GET translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en
 *       fallback: MyMemory free API
 *         GET api.mymemory.translated.net/get?langpair=autodetect|en
 *  4. Cache by exact source string for the rest of the run.
 *  5. Reuse *En from the previous giveaways.json when id + source text match
 *     so a daily import only hits the network for new/changed non-Latin fields.
 *
 * Offline / CI: existing *En on disk are reused. --skip-en writes originals
 * only. --force-en re-translates everything.
 */

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

function detectSourceLang(text) {
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\u0400-\u04ff]/.test(text)) return "ru";
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  if (/[\u4e00-\u9fff]/.test(text)) return "zh-CN";
  return "auto";
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isBadTranslation(out) {
  if (!out) return true;
  if (/PLEASE SELECT TWO DISTINCT|MYMEMORY WARNING|QUERY LENGTH LIMIT|ERROR:/i.test(out)) return true;
  if (/^!{2,}/.test(out)) return true;
  if ((out.match(/404/g) || []).length >= 3) return true;
  return false;
}

async function translateGtx(text, sl = "auto") {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
    encodeURIComponent(sl) +
    "&tl=en&dt=t&q=" +
    encodeURIComponent(text);
  const res = await fetch(url, { headers: { "User-Agent": "4airdrops-ingest/1.0" } });
  if (!res.ok) throw new Error(`gtx ${res.status}`);
  const data = await res.json();
  const out = (data?.[0] || []).map((part) => part?.[0] || "").join("").trim();
  if (isBadTranslation(out)) throw new Error("gtx empty");
  return out;
}

async function translateMyMemory(text) {
  const pair = CJK_OR_NON_LATIN.test(text) ? "zh-CN|en" : "autodetect|en";
  const url = "https://api.mymemory.translated.net/get?langpair=" + pair + "&q=" + encodeURIComponent(text);
  const res = await fetch(url, { headers: { "User-Agent": "4airdrops-ingest/1.0" } });
  if (!res.ok) throw new Error(`mymemory ${res.status}`);
  const data = await res.json();
  const out = String(data?.responseData?.translatedText || "").trim();
  if (isBadTranslation(out)) throw new Error("mymemory empty");
  return out;
}

async function translateChunk(chunk) {
  const sl = detectSourceLang(chunk);
  if (sl !== "auto") {
    try {
      return await translateGtx(chunk, sl);
    } catch {
      /* try auto */
    }
  }
  try {
    return await translateGtx(chunk, "auto");
  } catch {
    return await translateMyMemory(chunk);
  }
}

async function translateOnce(text) {
  const chunks = splitForUrl(text);
  const parts = [];
  for (const chunk of chunks) {
    parts.push(await translateChunk(chunk));
  }
  const out = parts.join(" ").replace(/\s+/g, " ").trim();
  if (isBadTranslation(out)) throw new Error("translate empty");
  return out;
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

export async function toEnglish(text, cache, stats) {
  const src = cleanDisplayText(text);
  if (!src) return "";
  if (MANUAL_EN.has(src) || MANUAL_EN.has(text.trim())) {
    stats.translated += 1;
    return MANUAL_EN.get(src) || MANUAL_EN.get(text.trim());
  }
  if (isPrimarilyLatin(src)) {
    stats.copied += 1;
    return src;
  }
  if (cache.has(src)) {
    stats.cache += 1;
    return cache.get(src);
  }
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const en = await translateOnce(src);
      if (enLooksBad(src, en)) throw new Error("low-quality translation");
      cache.set(src, en);
      stats.translated += 1;
      await sleep(80);
      return en;
    } catch (err) {
      lastErr = err;
      await sleep(400 * (attempt + 1));
    }
  }
  stats.failed += 1;
  console.warn("translate failed, leaving En empty:", src.slice(0, 60), lastErr?.message || lastErr);
  return "";
}

export async function fillEnglishFields(item, { cache, stats, force = false }) {
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
    const en = await toEnglish(raw, cache, stats);
    if (en) out[destKey] = en;
    else delete out[destKey];
  }
  return out;
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

export function emptyEnStats() {
  return { copied: 0, translated: 0, cache: 0, reused: 0, failed: 0 };
}
