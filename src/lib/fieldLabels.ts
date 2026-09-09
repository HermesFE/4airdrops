import type { Locale } from "@/i18n/locales";

const HAN = /[\u4e00-\u9fff]/;

const PLATFORM_EN: Record<string, string> = {
  Gate交易所: "Gate",
  MEXC交易所: "MEXC",
  Bitget交易所: "Bitget",
  KuCoin交易所: "KuCoin",
  "Brand官方/Web": "Brand / Web",
  "Brand官方/App": "Brand / App",
  "Brand官方/Instagram": "Brand / Instagram",
  "Brand官方/Social Ads": "Brand / Social Ads",
  官方Sweepstakes: "Official sweepstakes",
};

const CATEGORY_EN: Record<string, string> = {
  加密: "Crypto",
  其他: "Other",
  "加密/USDT": "Crypto/USDT",
  现金礼卡: "Cash/Gift Card",
  硬件: "Hardware",
  家居音响: "Home audio",
  "硬件/整机": "Hardware/PC",
  户外武器: "Outdoor/weapons",
  游戏: "Gaming",
  出行旅游: "Travel",
  "周边/潮玩": "Merch",
  宠物: "Pet",
  图书: "Books",
};

const REGION_EN: Record<string, string> = {
  全球: "Worldwide",
  以页面条款为准: "Per page terms",
  "以官方规则为准（美国为主）": "Per official rules (mainly US)",
  仅KuCoinWeb3Wallet用户: "KuCoin Web3 Wallet only",
  "仅KuCoin Web3 Wallet用户": "KuCoin Web3 Wallet only",
  "仅KuCoin Web3 Wallet用户；一地址一用户": "KuCoin Web3 Wallet only (1 address / 1 user)",
  "部分子任务仅新用户": "Some tasks: new users only",
  "英国及其他受限地区/禁止预测市场地区不可参与；需KYC": "UK and other restricted / prediction-market regions excluded; KYC",
  "仅MENA地区（不含迪拜KYC）；含巴林/卡塔尔/阿联酋/沙特/埃及等": "MENA only (ex-Dubai KYC); BH/QA/AE/SA/EG etc.",
  "美国50州及D.C.餐饮从业者（不含FL/NY居民；不含K-12与供应商等）": "US 50 states & DC foodservice (excl. FL/NY; excl. K-12 & vendors)",
  "美国50州及D.C.，21+且持有效驾照/政府证件；酒精行业从业人员不可参与": "US 50 states & DC, 21+ with ID; alcohol-industry workers excluded",
  "美国50州及D.C.，18+/法定成年，持有效驾照入场；大奖兑奖需驾照与保险": "US 50 states & DC, 18+ with license; grand prize needs license & insurance",
  "英国及其他受限地区可能无法参与（公告注明）": "UK and other restricted regions may be excluded",
  "英国及其他Restricted Locations不可参与": "UK and other restricted locations excluded",
  "美国及D.C.合法居民，达到所在州成年年龄": "Legal US & DC residents of age",
  "美国50州及D.C.（不含波多黎各），18+/法定成年": "US 50 states & DC (excl. PR), 18+",
  "仅美国本土48州+DC，18+": "Contiguous US + DC, 18+",
};

const DEADLINE_NOTES: [string, string][] = [
  ["来源时区未标", "TZ unmarked"],
  ["相对推算", "estimated"],
  ["日期级，UTC精确时刻未标明", "date only, UTC time unmarked"],
  ["日期级", "date only"],
  ["9月档", "September window"],
  ["页Ends 9/10 08:00，时区未标清", "page ends 9/10 08:00, TZ unclear"],
  ["来源未标时区，按UTC估；建议提前", "TZ unmarked, UTC estimate; enter early"],
];

const HAN_TOKENS: [string, string][] = [
  ["交易所", " Exchange"],
  ["官方", "Official "],
  ["Sweepstakes", "sweepstakes"],
];

export type StatusCode = "ongoing" | "unknown" | "ended";

export function statusCode(raw?: string): StatusCode | "" {
  const s = (raw || "").trim();
  if (!s) return "";
  if (s === "疑似进行中" || s === "ongoing") return "ongoing";
  if (s === "状态不明" || s === "unknown") return "unknown";
  if (s === "已结束/过期" || s === "ended") return "ended";
  return "unknown";
}

function translateCrumbs(raw: string): string {
  let out = raw;
  for (const [zh, en] of HAN_TOKENS) out = out.split(zh).join(en);
  return out.replace(/\s+/g, " ").trim();
}

function localizeCoded(raw: string | undefined, locale: Locale, exact: Record<string, string>): string {
  const s = (raw || "").trim();
  if (!s) return "";
  if (locale === "zh") return s;
  if (exact[s]) return exact[s];
  if (HAN.test(s)) return translateCrumbs(s);
  return s;
}

export function displayPlatform(raw: string | undefined, locale: Locale): string {
  return localizeCoded(raw, locale, PLATFORM_EN);
}

export function displayCategory(raw: string | undefined, locale: Locale): string {
  return localizeCoded(raw, locale, CATEGORY_EN);
}

export function displayRegion(raw: string | undefined, locale: Locale): string {
  return localizeCoded(raw, locale, REGION_EN);
}

export function displayDeadline(raw: string | undefined, locale: Locale): string {
  const s = (raw || "").trim();
  if (!s) return "";
  if (locale === "zh") return s;
  let out = s;
  for (const [zh, en] of DEADLINE_NOTES) out = out.split(zh).join(en);
  return out;
}

export function sortByLabel(values: string[], labelOf: (value: string) => string, locale: string): string[] {
  return [...values].sort((a, b) => labelOf(a).localeCompare(labelOf(b), locale));
}
