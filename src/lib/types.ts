import type { Locale } from "@/i18n/locales";

/** Ingest-time locale copies. Missing keys fall back to *En then original. */
export type LocalizedText = Partial<Record<Locale, string>>;

export type Giveaway = {
  id: string;
  title: string;
  titleEn?: string;
  titleI18n?: LocalizedText;
  platform: string;
  category: string;
  host?: string;
  prize?: string;
  prizeEn?: string;
  prizeI18n?: LocalizedText;
  prizeDetail?: string;
  prizeDetailEn?: string;
  deadlineRaw?: string;
  deadlineBj?: string;
  region?: string;
  entry?: string;
  entryEn?: string;
  url?: string;
  sourceUrl?: string;
  risk?: string;
  riskEn?: string;
  status?: string;
  firstSeen?: string;
  startedAt?: string;
};

export type GiveawayFile = {
  updatedAt?: string;
  count?: number;
  items: Giveaway[];
  note?: string;
  sync?: {
    mode?: string;
    command?: string;
    defaultStatus?: string;
    masterAsOf?: string;
    masterCounts?: Record<string, number>;
  };
};
