export const DEFAULT_BINANCE_REF_URL =
  "https://www.binance.com/activity/referral-entry/CPA?ref=yke3vhg.fed2xbu6CJZ";

export function binanceUrl(): string {
  return process.env.NEXT_PUBLIC_BINANCE_REF_URL || DEFAULT_BINANCE_REF_URL;
}
