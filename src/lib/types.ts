export type Giveaway = {
  id: string;
  title: string;
  platform: string;
  category: string;
  host?: string;
  prize?: string;
  prizeDetail?: string;
  deadlineRaw?: string;
  deadlineBj?: string;
  region?: string;
  entry?: string;
  url?: string;
  sourceUrl?: string;
  risk?: string;
  status?: string;
};

export type GiveawayFile = {
  updatedAt?: string;
  count?: number;
  items: Giveaway[];
};
