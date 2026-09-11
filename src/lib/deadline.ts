import type { Giveaway } from "./types";

const MONTH_RE = /(\d+)\s*months?\b/i;
const DAY_RE = /(\d+)\s*days?\b/i;
const ISO_RE = /(\d{4})-(\d{2})-(\d{2})/;
const ISO_DT_RE = /(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/;

/** deadlineBj is a Beijing/CST display clock unless the row labels UTC. */
export const BJ_OFFSET_HOURS = 8;

export type DeadlineFields = Pick<Giveaway, "deadlineBj" | "deadlineRaw">;

export type ParsedDeadline = {
  ms: number;
  hasTime: boolean;
  absolute: boolean;
  offsetHours: number;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function offsetSuffix(hours: number): string {
  const sign = hours >= 0 ? "+" : "-";
  return `${sign}${pad2(Math.abs(hours))}:00`;
}

/** Offset for a deadlineBj clock. `（UTC 9/14 22:59）` is a conversion footnote. */
export function bjClockOffsetHours(bj: string): number {
  const s = bj || "";
  const utcOff = s.match(/UTC\s*([+-])\s*(\d{1,2})/i);
  if (utcOff) return (utcOff[1] === "-" ? -1 : 1) * Number(utcOff[2]);
  if (/按UTC估/.test(s)) return 0;
  if (/[（(]UTC[）)]/i.test(s) && !/[（(]UTC\s+\d{1,2}\/\d{1,2}/i.test(s)) return 0;
  return BJ_OFFSET_HOURS;
}

function rawHasLabeledTz(raw: string): boolean {
  return /\b(?:UTC|GMT)(?:\s*[+-]\s*\d{1,2})?\b/i.test(raw || "");
}

export function calendarDayUtc(ms: number, offsetHours: number): number {
  const shifted = new Date(ms + offsetHours * 3600 * 1000);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

export function parseDeadlineParts(g: DeadlineFields, now = Date.now()): ParsedDeadline | null {
  const bj = g.deadlineBj || "";
  const raw = g.deadlineRaw || "";

  const iso = bj.match(ISO_DT_RE) || raw.match(ISO_DT_RE);
  if (iso) {
    const hasTime = Boolean(iso[4] && iso[5]);
    const offsetHours = bj ? bjClockOffsetHours(bj) : BJ_OFFSET_HOURS;
    const hh = hasTime ? iso[4] : "00";
    const mm = hasTime ? iso[5] : "00";
    const ms = Date.parse(`${iso[1]}-${iso[2]}-${iso[3]}T${hh}:${mm}:00${offsetSuffix(offsetHours)}`);
    if (!Number.isNaN(ms)) return { ms, hasTime, absolute: true, offsetHours };
  }

  const rawTrim = raw.replace(/\(started[^)]*\)/gi, "").replace(/\(.*$/, "").trim();
  if (rawTrim && rawHasLabeledTz(raw) && !MONTH_RE.test(rawTrim)) {
    const parsed = Date.parse(rawTrim);
    if (!Number.isNaN(parsed)) {
      return { ms: parsed, hasTime: /\d{1,2}:\d{2}/.test(rawTrim), absolute: true, offsetHours: 0 };
    }
  }

  if (rawTrim && !MONTH_RE.test(rawTrim) && !DAY_RE.test(rawTrim)) {
    const parsed = Date.parse(rawTrim);
    if (!Number.isNaN(parsed)) {
      return { ms: parsed, hasTime: /\d{1,2}:\d{2}/.test(rawTrim), absolute: true, offsetHours: 0 };
    }
  }

  const months = raw.match(MONTH_RE);
  if (months) {
    return { ms: now + Number(months[1]) * 30 * 86400000, hasTime: false, absolute: false, offsetHours: BJ_OFFSET_HOURS };
  }
  const days = raw.match(DAY_RE);
  if (days) {
    return { ms: now + Number(days[1]) * 86400000, hasTime: false, absolute: false, offsetHours: BJ_OFFSET_HOURS };
  }
  return null;
}

export function parseDeadlineMs(g: DeadlineFields, now = Date.now()): number | null {
  return parseDeadlineParts(g, now)?.ms ?? null;
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
 * Absolute deadline is ended when that instant is before now.
 * Date-only values compare calendar days in the deadline's timezone
 * (BJ/CST unless the row labels UTC). Relative "N days/months"
 * countdowns are never treated as already ended.
 * Keep in sync with scripts/deadline.mjs.
 */
export function isPastDeadline(g: DeadlineFields, now = Date.now()): boolean {
  const parts = parseDeadlineParts(g, now);
  if (!parts || !parts.absolute) return false;
  if (parts.hasTime) return parts.ms < now;
  return calendarDayUtc(parts.ms, parts.offsetHours) < calendarDayUtc(now, parts.offsetHours);
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
