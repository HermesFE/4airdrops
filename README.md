# 4Airdrops

Public giveaway / airdrop directory. Free table + Binance referral CTA.

Default UI language is **English**. Chrome is translated for: `en`, `zh`, `es`, `pt`, `ar`, `id`, `ru`, `ja`, `de`, `fr`, `ko`, `vi`, `tr`, `hi` (lightweight catalogs).

Each locale has its own URL so crawlers see translated chrome and locale-matched `titleI18n` / `prizeI18n` in the HTML (not only a client switch):

| Page | Path |
| --- | --- |
| Directory | `/{locale}` (`/` redirects to `/en`) |
| Detail | `/{locale}/g/{id}` |
| About | `/{locale}/about` |

The language switcher navigates to the same path in the other locale. Legacy unprefixed URLs (`/about`, `/g/:id`) 301 to `/en/...` on Cloudflare Pages (`public/_redirects`). `?lang=` still jumps to that prefix. The current locale is stored in `localStorage` (`4airdrops.locale`) but the **path** is the source of truth.

Build emits `robots.txt` and a sitemap of every locale URL (`public/sitemap.xml`, generated on `prebuild`). Submit `https://4airdrops.com/sitemap.xml` in [Google Search Console](https://search.google.com/search-console) (Sitemaps) after deploy.

Row **content** follows the selected UI locale when ingest has filled maps. Each row keeps the scraped original (`title`, `prize`, `prizeDetail`, `entry`, `risk`) plus English display fields (`titleEn`, `prizeEn`, `prizeDetailEn`, `entryEn`, `riskEn`) and `titleI18n` / `prizeI18n` (`Partial<Record<Locale, string>>` for `en zh es pt ar id ru ja de fr ko vi tr hi`). The sheet and detail view show `titleI18n[L] || titleEn || title` (same fallback for prize) and expose the original via a cell `title` tooltip or a compact **Original** block on the detail page. Search matches originals, `*En`, and all i18n values.

## Local run

```bash
npm install
npm run dev
# open http://localhost:3000/en  (http://localhost:3000/ is the English alias)
```

Binance referral (env wins when set; otherwise the same URL is the code fallback):

```bash
NEXT_PUBLIC_BINANCE_REF_URL=https://www.binance.com/activity/referral-entry/CPA?ref=yke3vhg.fed2xbu6CJZ
```

See `.env.example`.

## Daily data sync

The site reads `data/giveaways.json`. The master table (ops, e.g. `/home/box/giveaways/Giveaway主表.csv`) is not in git.

Default import keeps **疑似进行中** (UI: Active (unverified) / 进行中（待核验）). Do not dump thousands of 状态不明 rows into Pages.

`KIE_API_KEY` is required for a live ingest (or pass `--skip-en` to stay offline). Optional `KIE_API_BASE` defaults to `https://api.kie.ai`. See `.env.example`. `npm run build` does **not** call Kie.

```bash
# production ingest — fills *En plus titleI18n/prizeI18n via Kie Gemini 3.5 Flash
KIE_API_KEY=your_key npm run import-csv -- /path/to/Giveaway主表.csv

# optional sample of unknown status (large; not for production)
KIE_API_KEY=your_key npm run import-csv -- /path/to/Giveaway主表.csv --include-unknown --max 1200

# offline / CI: keep originals and reuse whatever *En/*I18n are already on disk
npm run import-csv -- data/giveaways.json --skip-en --skip-i18n

# rebuild English and all locale maps
KIE_API_KEY=your_key npm run import-csv -- data/giveaways.json --force-en --force-i18n
```

Content fields are filled during this import (see `scripts/content-i18n.mjs`):

- Already Latin/English → copied to `*En`. Locale maps: `en` gets the English display; a source language that matches the target locale is copied (e.g. Chinese prize → `prizeI18n.zh`).
- Otherwise translated with Kie: `POST ${KIE_API_BASE}/gemini-3-5-flash-openai/v1/chat/completions`, model `gemini-3-5-flash`, `Authorization: Bearer ${KIE_API_KEY}`. Non-English locales are batched (~32 unique strings).
- Cache key is `(source, targetLang)`. Previous `data/giveaways.json` `*En` / `*I18n` values are reused when `id` + source text are unchanged.
- `--skip-en` skips network translation (offline emergency; also skips i18n unless `--force-i18n`). `--force-en` / `--force-i18n` re-translate. `--allow-gtx-fallback` is an emergency unofficial Google gtx / MyMemory path — not for production.

Then `npm run build` (Cloudflare Pages: `npm run build` → `out/`).

CSV headers: `id,项目名,平台,分类,主办方,奖品概述,奖项明细,截止时间原文,截止时间(北京),地区限制,参与方式摘要,链接,官方链接,风险备注,活动状态`. Optional: `首次发现,开始时间`.

## Status

| Master `活动状态` | UI (en / zh) | Meaning |
| --- | --- | --- |
| 疑似进行中 | Active (unverified) / 进行中（待核验） | Countdown or future date on a list page; no reliable absolute deadline |
| 状态不明 | Unknown / 状态不明 | Hidden by default |
| 已结束/过期 | Ended / 已结束 | Clearly expired |

Default filters: active (unverified) + hide deadlines farther than 60 days or “2 months+” countdowns.

## Deploy

Cloudflare Pages: build `npm run build`, output `out/`. Domain: `4airdrops.com`.

After a production deploy, add the sitemap in Search Console if it is not there yet:

1. Open [Google Search Console](https://search.google.com/search-console) for `4airdrops.com`
2. Sitemaps → add `https://4airdrops.com/sitemap.xml`
3. Optional: Bing Webmaster Tools → Sitemaps → same URL
