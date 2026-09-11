import type { Giveaway } from "./types";

const MONTH_RE = /(\d+)\s*months?\b/i;
const DAY_RE = /(\d+)\s*days?\b/i;
const ISO_RE = /(\d{4})-(\d{2})-(\d{2})/;

export type DeadlineFields = Pick<Giveaway, "deadlineBj" | "deadlineRaw">;

function utcDayMs(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function parseDeadlineMs(g: DeadlineFields, now = Date.now()): number | null {
  const bj = g.deadlineBj || "";
  const iso = bj.match(ISO_RE);
  if (iso) {
    const ms = Date.parse(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00Z`);
    if (!Number.isNaN(ms)) return ms;
  }

  const raw = g.deadlineRaw || "";
  const rawIso = raw.match(ISO_RE);
  if (rawIso) {
    const ms = Date.parse(`${rawIso[1]}-${rawIso[2]}-${rawIso[3]}T00:00:00Z`);
    if (!Number.isNaN(ms)) return ms;
  }

  const parsed = Date.parse(raw.replace(/\(.*$/, "").trim());
  if (!Number.isNaN(parsed)) return parsed;

  const months = raw.match(MONTH_RE);
  if (months) return now + Number(months[1]) * 30 * 86400000;

  const days = raw.match(DAY_RE);
  if (days) return now + Number(days[1]) * 86400000;

  return null;
}

export function daysUntil(g: DeadlineFields, now = Date.now()): number | null {
  const ms = parseDeadlineMs(g, now);
  if (ms == null) return null;
  return Math.round((ms - now) / 86400000);
}

export function hasClearDeadline(g: DeadlineFields): boolean {
  if (ISO_RE.test(g.deadlineBj || "")) return true;
  if (ISO_RE.test(g.deadlineRaw || "")) return true;
  if (DAY_RE.test(g.deadlineRaw || "")) return true;
  const raw = (g.deadlineRaw || "").replace(/\(.*$/, "").trim();
  if (raw && !Number.isNaN(Date.parse(raw)) && !MONTH_RE.test(raw)) return true;
  return false;
}

export function monthCountdown(g: DeadlineFields): number | null {
  const m = (g.deadlineRaw || "").match(MONTH_RE);
  return m ? Number(m[1]) : null;
}

/** Far-future or multi-month countdown — likely a stale/zombie campaign. */
export function isLongHorizon(g: DeadlineFields, horizonDays: number, now = Date.now()): boolean {
  const months = monthCountdown(g);
  if (months != null && months >= 2) return true;
  const days = daysUntil(g, now);
  if (days != null && days > horizonDays) return true;
  return false;
}

export function sortDeadlineMs(g: DeadlineFields, now = Date.now()): number {
  return parseDeadlineMs(g, now) ?? Number.MAX_SAFE_INTEGER;
}

/**
 * Absolute calendar/datetime deadline is on a UTC day before today.
 * Relative "N days/months" countdowns are never treated as already ended.
 * Keep in sync with scripts/deadline.mjs.
 */
export function isPastDeadline(g: DeadlineFields, now = Date.now()): boolean {
  const bj = g.deadlineBj || "";
  const raw = g.deadlineRaw || "";
  const hasIso = ISO_RE.test(bj) || ISO_RE.test(raw);
  const rawTrim = raw.replace(/\(.*$/, "").trim();
  const hasAbsParse = Boolean(rawTrim) && !Number.isNaN(Date.parse(rawTrim)) && !MONTH_RE.test(rawTrim);
  if (!hasIso && !hasAbsParse) return false;
  const ms = parseDeadlineMs(g, now);
  if (ms == null) return false;
  return utcDayMs(ms) < utcDayMs(now);
}

const DT_RE = /(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/;
const EST_RE = /约|相对推算|estimated|推算/i;
const DATE_ONLY_RE = /日期级/;
const ZH_DAY_RE = /(\d+)\s*天/;
const ZH_MONTH_RE = /(\d+)\s*个?月/;

export type FormattedDeadline = {
  /** Short cell / primary display */
  text: string;
  /** Full raw strings for tooltip / detail */
  title: string;
};

function rawDeadlineTitle(g: DeadlineFields): string {
  const bj = (g.deadlineBj || "").trim();
  const raw = (g.deadlineRaw || "").trim();
  if (bj && raw && bj !== raw) return `${bj} · ${raw}`;
  return bj || raw;
}

function relativeShort(raw: string): string {
  const months = raw.match(MONTH_RE) || raw.match(ZH_MONTH_RE);
  if (months) return `~${months[1]}mo`;
  const days = raw.match(DAY_RE) || raw.match(ZH_DAY_RE);
  if (days) return `~${days[1]}d`;
  return "";
}

/** View-layer deadline: scannable YYYY-MM-DD[ HH:mm], or ~25d / ~2mo. */
export function formatDeadline(g: DeadlineFields): FormattedDeadline {
  const bj = (g.deadlineBj || "").trim();
  const raw = (g.deadlineRaw || "").trim();
  const title = rawDeadlineTitle(g);
  const source = bj || raw;
  if (!source) return { text: "", title: "" };

  const estimated = EST_RE.test(source) || EST_RE.test(raw);
  const dateOnlyNote = DATE_ONLY_RE.test(source);
  const match = source.match(DT_RE);
  if (match) {
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    const time = match[4] && match[5] && !dateOnlyNote ? `${match[4]}:${match[5]}` : "";
    let text = time ? `${date} ${time}` : date;
    if (estimated) text = `~${text}`;
    return { text, title };
  }

  const rel = relativeShort(raw) || relativeShort(bj);
  if (rel) return { text: rel, title };

  return { text: source.length > 16 ? `${source.slice(0, 15)}…` : source, title };
}
