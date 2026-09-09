# 4Airdrops

多平台 Giveaway / 空投活动目录。MVP：免费公开列表 + Binance 注册返佣 CTA。

## 本地运行

```bash
npm install
npm run dev
```

环境变量：

```bash
NEXT_PUBLIC_BINANCE_REF_URL=https://www.binance.com/activity/referral-entry/CPA?ref=YOUR_CODE
```

## 每日数据

替换 `data/giveaways.json`（由主表「疑似进行中」导出）。可选：`npm run import-csv`（脚本占位）。

## 部署

可部署到 Vercel / Cloudflare Pages。自定义域：`4airdrops.com`。
