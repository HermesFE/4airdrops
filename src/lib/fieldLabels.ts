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

/** English (and mixed) category tokens → zh. Exact match only; do not invent. */
const CATEGORY_ZH: Record<string, string> = {
  Gaming: "游戏",
  Books: "图书",
  Other: "其他",
  Crypto: "加密",
  "Crypto/NFT": "加密/NFT",
  "Crypto/USDT": "加密/USDT",
  "Tech/Electronics": "科技/数码",
  "Travel/Tickets": "出行/票务",
  "Sports/Outdoor": "运动/户外",
  Pet: "宠物",
  "Cash/Gift Card": "现金礼卡",
  "Home/Lifestyle": "家居/生活",
  "Food/Drink": "食品饮料",
  "Fashion/Merch": "时尚/周边",
  "Food/Consumer": "食品",
  "Food/Beverage": "食品饮料",
  "Automotive/Sports": "汽车/运动",
  "Travel/Lifestyle": "出行/生活",
  "Consumer/Lifestyle": "消费/生活",
  "Consumer/Beauty": "美妆",
  Hardware: "硬件",
  Travel: "出行旅游",
  Merch: "周边/潮玩",
};

/** Whole-string English region → zh. Longer keys win via applyTokens. */
const REGION_ZH_EXACT: Record<string, string> = {
  WW: "全球",
  Worldwide: "全球",
  US: "美国",
  "United States": "美国",
  "United States of America": "美国",
  CA: "加拿大",
  Canada: "加拿大",
  GB: "英国",
  "United Kingdom": "英国",
  PR: "波多黎各",
  "Puerto Rico": "波多黎各",
  France: "法国",
  Australia: "澳大利亚",
  Japan: "日本",
  "California, 18+": "加州，18+",
  "US 50 states & DC, 18+": "美国50州及D.C.，18+",
  "US / Canada (excl. Quebec) per rules": "美国 / 加拿大（不含魁北克；以规则为准）",
};

const REGION_ZH_TOKENS: Record<string, string> = {
  "United States of America": "美国",
  "United States Minor Outlying Islands": "美国本土外小岛屿",
  "United States": "美国",
  "United Kingdom": "英国",
  "Puerto Rico": "波多黎各",
  Worldwide: "全球",
  California: "加州",
  Canada: "加拿大",
  Australia: "澳大利亚",
  Austria: "奥地利",
  Switzerland: "瑞士",
  Japan: "日本",
  France: "法国",
  Albania: "阿尔巴尼亚",
  Andorra: "安道尔",
  Aruba: "阿鲁巴",
  Anguilla: "安圭拉",
  Guam: "关岛",
  Fiji: "斐济",
  WW: "全球",
  US: "美国",
  CA: "加拿大",
  GB: "英国",
  PR: "波多黎各",
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
  if (s === "已结束/过期" || s === "已结束" || s === "ended") return "ended";
  return "unknown";
}

function translateCrumbs(raw: string): string {
  let out = raw;
  for (const [zh, en] of HAN_TOKENS) out = out.split(zh).join(en);
  return out.replace(/\s+/g, " ").trim();
}

function applyTokens(raw: string, map: Record<string, string>): string {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  let out = raw;
  for (const key of keys) {
    const dest = map[key];
    if (key.length <= 3 && /^[A-Z]+$/.test(key)) {
      const re = new RegExp(`(^|[^A-Za-z])${key}(?=[^A-Za-z]|$)`, "g");
      out = out.replace(re, `$1${dest}`);
    } else if (out.includes(key)) {
      out = out.split(key).join(dest);
    }
  }
  return out;
}

function localizeCoded(
  raw: string | undefined,
  locale: Locale,
  toEn: Record<string, string>,
  toZh?: Record<string, string>,
  zhTokens?: Record<string, string>,
): string {
  const s = (raw || "").trim();
  if (!s) return "";
  if (locale === "zh") {
    if (toZh?.[s]) return toZh[s];
    if (toEn[s]) return s;
    if (zhTokens) {
      const mapped = applyTokens(s, zhTokens);
      if (mapped !== s) return mapped;
    }
    return s;
  }
  if (toEn[s]) return toEn[s];
  if (HAN.test(s)) return translateCrumbs(s);
  return s;
}

export function displayPlatform(raw: string | undefined, locale: Locale): string {
  return localizeCoded(raw, locale, PLATFORM_EN);
}

export function displayCategory(raw: string | undefined, locale: Locale): string {
  return localizeCoded(raw, locale, CATEGORY_EN, CATEGORY_ZH);
}

export function displayRegion(raw: string | undefined, locale: Locale): string {
  return localizeCoded(raw, locale, REGION_EN, REGION_ZH_EXACT, REGION_ZH_TOKENS);
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
