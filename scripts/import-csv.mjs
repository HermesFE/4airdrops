#!/usr/bin/env node
/**
 * Daily sync stub: map Giveaway主表 CSV -> data/giveaways.json
 *
 * Expected CSV headers (Chinese):
 * id,项目名,平台,分类,主办方,奖品概述,奖项明细,截止时间原文,截止时间(北京),地区限制,参与方式摘要,链接,官方链接,风险备注,活动状态
 *
 * Usage:
 *   node scripts/import-csv.mjs /path/to/Giveaway主表.csv
 *   # writes data/giveaways.json (filter 活动状态 === 疑似进行中 by default)
 */
console.log("import-csv stub: wire this to the daily master CSV when ready.");
process.exit(0);
