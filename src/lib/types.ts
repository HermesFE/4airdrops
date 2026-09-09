export type Giveaway = {
  id: string;
  title: string;
  titleEn?: string;
  platform: string;
  category: string;
  host?: string;
  prize?: string;
  prizeEn?: string;
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
