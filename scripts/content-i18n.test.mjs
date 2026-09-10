import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  I18N_BATCH_SIZE,
  KIE_MODEL,
  LOCALE_CODES,
  NON_EN_LOCALES,
  assertTranslateMode,
  buildKieTranslateBody,
  cacheKey,
  chunkStrings,
  cleanDisplayText,
  createTranslator,
  detectSourceLang,
  emptyEnStats,
  emptyI18nStats,
  extractKieMessageContent,
  fillEnglishFields,
  fillI18nFields,
  kieChatCompletionsUrl,
  parseKieTranslations,
  resolveTranslateMode,
  reuseUnchangedContent,
} from "./content-i18n.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test("locale list matches UI locales", () => {
  assert.deepEqual(LOCALE_CODES, [
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
  ]);
  assert.equal(NON_EN_LOCALES.length, 13);
  assert.equal(I18N_BATCH_SIZE >= 20 && I18N_BATCH_SIZE <= 40, true);
});

test("cache key is (source, targetLang)", () => {
  assert.equal(cacheKey("hello", "zh"), "zh\0hello");
  assert.notEqual(cacheKey("hello", "zh"), cacheKey("hello", "es"));
  assert.notEqual(cacheKey("hello", "zh"), cacheKey("Hello", "zh"));
});

test("kie endpoint and request body", () => {
  assert.equal(
    kieChatCompletionsUrl(),
    "https://api.kie.ai/gemini-3-5-flash-openai/v1/chat/completions",
  );
  assert.equal(
    kieChatCompletionsUrl("https://api.kie.ai/"),
    "https://api.kie.ai/gemini-3-5-flash-openai/v1/chat/completions",
  );
  const body = buildKieTranslateBody(["a", "b"], "es");
  assert.equal(body.model, KIE_MODEL);
  assert.equal(body.model, "gemini-3-5-flash");
  assert.equal(body.stream, false);
  assert.equal(body.messages[0].role, "system");
  assert.match(body.messages[1].content, /Spanish \(es\)/);
  assert.match(body.messages[1].content, /\["a","b"\]/);
});

test("parse Kie OpenAI-style content", () => {
  assert.deepEqual(parseKieTranslations('["uno","dos"]', 2), ["uno", "dos"]);
  assert.deepEqual(
    parseKieTranslations('```json\n["uno","dos"]\n```', 2),
    ["uno", "dos"],
  );
  assert.deepEqual(
    parseKieTranslations(JSON.stringify({ translations: ["uno", "dos"] }), 2),
    ["uno", "dos"],
  );
  const content = extractKieMessageContent({
    choices: [{ message: { content: '["x"]' } }],
  });
  assert.equal(content, '["x"]');
  assert.throws(() => parseKieTranslations('["only-one"]', 2));
});

test("chunkStrings batches 20–40", () => {
  const chunks = chunkStrings(Array.from({ length: 70 }, (_, i) => String(i)), 32);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 32);
  assert.equal(chunks[1].length, 32);
  assert.equal(chunks[2].length, 6);
});

test("resolveTranslateMode requires key unless skip-en or gtx fallback", () => {
  assert.equal(resolveTranslateMode({ skipEn: false, apiKey: "" }), "error");
  assert.equal(resolveTranslateMode({ skipEn: true, apiKey: "" }), "skip");
  assert.equal(resolveTranslateMode({ skipEn: false, apiKey: "k" }), "kie");
  assert.equal(resolveTranslateMode({ skipEn: false, apiKey: "", allowGtxFallback: true }), "gtx");
  const prev = process.exit;
  let code;
  process.exit = (c) => {
    code = c;
    throw new Error("exited");
  };
  try {
    assert.throws(() => assertTranslateMode({ skipEn: false, apiKey: "" }));
    assert.equal(code, 1);
  } finally {
    process.exit = prev;
  }
});

test("reuse *En and *I18n when id+source unchanged", () => {
  const prev = {
    id: "x",
    title: "你好",
    titleEn: "Hello",
    titleI18n: { en: "Hello", zh: "你好", es: "Hola" },
    prize: "奖品",
    prizeEn: "Prize",
    prizeI18n: { en: "Prize", zh: "奖品" },
  };
  const same = reuseUnchangedContent({ id: "x", title: "你好", prize: "奖品" }, prev);
  assert.equal(same.titleEn, "Hello");
  assert.deepEqual(same.titleI18n, prev.titleI18n);
  assert.equal(same.prizeEn, "Prize");
  const changed = reuseUnchangedContent({ id: "x", title: "新标题", prize: "奖品" }, prev);
  assert.equal(changed.titleEn, undefined);
  assert.equal(changed.titleI18n, undefined);
  assert.equal(changed.prizeEn, "Prize");
});

test("fillEnglishFields copies Latin and reuses good *En", async () => {
  const stats = emptyEnStats();
  const cache = new Map();
  const out = await fillEnglishFields(
    { title: "Bitget CandyBomb", titleEn: "Bitget CandyBomb", prize: "Share 75,000 USDC" },
    { cache, stats, translator: createTranslator({ mode: "kie", cache, fetchImpl: async () => {
      throw new Error("network should not run");
    } }) },
  );
  assert.equal(out.titleEn, "Bitget CandyBomb");
  assert.equal(out.prizeEn, "Share 75,000 USDC");
  assert.equal(stats.reused + stats.copied > 0, true);
});

test("fillI18nFields copies matching source lang and batches the rest via Kie", async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    assert.match(url, /\/gemini-3-5-flash-openai\/v1\/chat\/completions$/);
    assert.equal(opts.headers.Authorization, "Bearer test-key");
    const body = JSON.parse(opts.body);
    assert.equal(body.model, "gemini-3-5-flash");
    assert.equal(body.stream, false);
    calls.push(body);
    const user = body.messages.find((m) => m.role === "user").content;
    const jsonLine = user.slice(user.indexOf("["));
    const inputs = JSON.parse(jsonLine);
    const lang = (user.match(/\(([a-z]{2})\)/) || [])[1];
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(inputs.map((s) => `${lang}:${s}`)) } }],
        }),
    };
  };
  const cache = new Map();
  const stats = emptyI18nStats();
  const [item] = await fillI18nFields(
    [
      {
        id: "demo",
        title: "Bitget CandyBomb x CNPY — Trade to share 75,000 USDC",
        titleEn: "Bitget CandyBomb x CNPY — Trade to share 75,000 USDC",
        prize: "CNPY现货+合约交易瓜分75,000 USDC",
        prizeEn: "CNPY Spot + Contract Transaction Split 75,000 USDC",
      },
    ],
    {
      cache,
      stats,
      translator: createTranslator({ mode: "kie", cache, fetchImpl, apiKey: "test-key", batchSize: 32 }),
    },
  );
  assert.equal(item.titleI18n.en, item.titleEn);
  assert.equal(item.prizeI18n.en, item.prizeEn);
  assert.equal(item.prizeI18n.zh, "CNPY现货+合约交易瓜分75,000 USDC");
  assert.equal(item.titleI18n.es.startsWith("es:"), true);
  assert.equal(item.prizeI18n.es.startsWith("es:"), true);
  assert.equal(calls.length > 0, true);
  assert.equal(calls.every((c) => JSON.parse(c.messages[1].content.slice(c.messages[1].content.indexOf("["))).length <= 40), true);
  assert.equal(cache.has(cacheKey(item.titleEn, "es")), true);
});

test("import-csv without KIE_API_KEY and without --skip-en exits", () => {
  const env = { ...process.env };
  delete env.KIE_API_KEY;
  const tmp = path.join(os.tmpdir(), `giveaways-i18n-${process.pid}.json`);
  const r = spawnSync(
    process.execPath,
    [path.join(ROOT, "scripts/import-csv.mjs"), path.join(ROOT, "data/giveaways.json"), "--max=1", `--out=${tmp}`],
    { env, encoding: "utf8" },
  );
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /KIE_API_KEY/);
});

test("import-csv --skip-en works without KIE_API_KEY and does not call network", () => {
  const env = { ...process.env };
  delete env.KIE_API_KEY;
  const tmp = path.join(os.tmpdir(), `giveaways-skip-${process.pid}.json`);
  const r = spawnSync(
    process.execPath,
    [
      path.join(ROOT, "scripts/import-csv.mjs"),
      path.join(ROOT, "data/giveaways.json"),
      "--skip-en",
      "--skip-i18n",
      "--max=2",
      `--out=${tmp}`,
    ],
    { env, encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const data = JSON.parse(fs.readFileSync(tmp, "utf8"));
  assert.equal(data.items.length, 2);
  assert.equal(Boolean(data.items[0].title), true);
  fs.unlinkSync(tmp);
});

test("cleanDisplayText strips scraped junk", () => {
  assert.equal(cleanDisplayText('  "hello"  '), "hello");
  assert.equal(detectSourceLang("CNPY现货+合约"), "zh");
  assert.equal(detectSourceLang("Hello prize"), "en");
});
