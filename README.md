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

## 每日数据同步

站点只读 `data/giveaways.json`。主表（ops，例如 `/home/box/giveaways/Giveaway主表.csv`）不进 git。

默认只导入 **疑似进行中**（UI 显示为「进行中（待核验）」）。主表里「状态不明」有数千行，不要默认打进静态站。

```bash
npm run import-csv -- /path/to/Giveaway主表.csv
# 可选：抽一部分状态不明（体积大，不建议上生产）
npm run import-csv -- /path/to/Giveaway主表.csv --include-unknown --max 1200
```

然后 `npm run build`（Cloudflare Pages：`npm run build` → `out/`）。

CSV 表头需包含：`id,项目名,平台,分类,主办方,奖品概述,奖项明细,截止时间原文,截止时间(北京),地区限制,参与方式摘要,链接,官方链接,风险备注,活动状态`。可选：`首次发现,开始时间`。

## 状态说明

| 主表 `活动状态` | 站点展示（中 / EN） | 含义 |
| --- | --- | --- |
| 疑似进行中 | 进行中（待核验） / Active (unverified) | 列表页有倒计时或未来日期，但缺可靠绝对截止 |
| 状态不明 | 状态不明 / Unknown | 无法从列表页判断，默认不展示 |
| 已结束/过期 | 已结束 / Ended | 明确过期 |

默认筛选：进行中（待核验）+ 隐藏截止日远于 60 天或「2 months+」倒计时的条目。

## 部署

Cloudflare Pages：build `npm run build`，输出 `out/`。自定义域：`4airdrops.com`。
