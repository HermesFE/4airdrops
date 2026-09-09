# 4Airdrops

Public giveaway / airdrop directory. Free table + Binance referral CTA.

Default UI language is **English**. Chrome is translated for: `en`, `zh`, `es`, `pt`, `ar`, `id`, `ru`, `ja`, `de`, `fr`, `ko`, `vi`, `tr`, `hi` (lightweight catalogs; table data stays as stored). Preference is saved in `localStorage` (`4airdrops.locale`).

## Local run

```bash
npm install
npm run dev
```

Binance referral (env wins when set; otherwise the same URL is the code fallback):

```bash
NEXT_PUBLIC_BINANCE_REF_URL=https://www.binance.com/activity/referral-entry/CPA?ref=yke3vhg.fed2xbu6CJZ
```

See `.env.example`.

## Daily data sync

The site reads `data/giveaways.json`. The master table (ops, e.g. `/home/box/giveaways/Giveaway主表.csv`) is not in git.

Default import keeps **疑似进行中** (UI: Active (unverified) / 进行中（待核验）). Do not dump thousands of 状态不明 rows into Pages.

```bash
npm run import-csv -- /path/to/Giveaway主表.csv
# optional sample of unknown status (large; not for production)
npm run import-csv -- /path/to/Giveaway主表.csv --include-unknown --max 1200
```

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
