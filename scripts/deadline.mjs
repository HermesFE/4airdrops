/**
 * Shared deadline helpers for ingest (import-csv) and tests.
 * Keep in sync with src/lib/deadline.ts (same parse rules + isPastDeadline).
 */

const MONTH_RE = /(\d+)\s*months?\b/i;
const DAY_RE = /(\d+)\s*days?\b/i;
const ISO_RE = /(\d{4})-(\d{2})-(\d{2})/;
const ISO_DT_RE = /(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/;

/** deadlineBj is a Beijing/CST display clock unless the row labels UTC. */
export const BJ_OFFSET_HOURS = 8;

export const MASTER_STATUS_ONGOING = "疑似进行中";
export const MASTER_STATUS_UNKNOWN = "状态不明";
/** Master-table / giveaways.json status string for ended (UI: 已结束). */
export const MASTER_STATUS_ENDED = "已结束/过期";

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function offsetSuffix(hours) {
  const sign = hours >= 0 ? "+" : "-";
  return `${sign}${pad2(Math.abs(hours))}:00`;
}

/**
 * Offset for a deadlineBj clock.
 * Prefer an explicit label on that string; otherwise CST/BJ (the column is 北京).
 * `（UTC 9/14 22:59）` is a conversion footnote, not "this clock is UTC".
 */
export function bjClockOffsetHours(bj) {
  const s = bj || "";
  const utcOff = s.match(/UTC\s*([+-])\s*(\d{1,2})/i);
  if (utcOff) return (utcOff[1] === "-" ? -1 : 1) * Number(utcOff[2]);
  if (/按UTC估/.test(s)) return 0;
  if (/[（(]UTC[）)]/i.test(s) && !/[（(]UTC\s+\d{1,2}\/\d{1,2}/i.test(s)) return 0;
  return BJ_OFFSET_HOURS;
}

function rawHasLabeledTz(raw) {
  const s = raw || "";
  return /\b(?:UTC|GMT)(?:\s*[+-]\s*\d{1,2})?\b/i.test(s);
}

export function calendarDayUtc(ms, offsetHours) {
  const shifted = new Date(ms + offsetHours * 3600 * 1000);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

export function parseDeadlineParts(g, now = Date.now()) {
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

export function parseDeadlineMs(g, now = Date.now()) {
  return parseDeadlineParts(g, now)?.ms ?? null;
}

export function daysUntil(g, now = Date.now()) {
  const ms = parseDeadlineMs(g, now);
  if (ms == null) return null;
  return Math.round((ms - now) / 86400000);
}

export function hasClearDeadline(g) {
  if (ISO_RE.test(g.deadlineBj || "")) return true;
  if (ISO_RE.test(g.deadlineRaw || "")) return true;
  if (DAY_RE.test(g.deadlineRaw || "")) return true;
  const raw = (g.deadlineRaw || "").replace(/\(.*$/, "").trim();
  if (raw && !Number.isNaN(Date.parse(raw)) && !MONTH_RE.test(raw)) return true;
  return false;
}

export function monthCountdown(g) {
  const m = (g.deadlineRaw || "").match(MONTH_RE);
  return m ? Number(m[1]) : null;
}

export function isLongHorizon(g, horizonDays, now = Date.now()) {
  const months = monthCountdown(g);
  if (months != null && months >= 2) return true;
  const days = daysUntil(g, now);
  if (days != null && days > horizonDays) return true;
  return false;
}

/**
 * Absolute deadline is ended when that instant is before now.
 * Date-only values compare calendar days in the deadline's timezone
 * (BJ/CST unless the row labels UTC). Relative "N days/months"
 * countdowns are never treated as already ended.
 */
export function isPastDeadline(g, now = Date.now()) {
  const parts = parseDeadlineParts(g, now);
  if (!parts || !parts.absolute) return false;
  if (parts.hasTime) return parts.ms < now;
  return calendarDayUtc(parts.ms, parts.offsetHours) < calendarDayUtc(now, parts.offsetHours);
}

/** Mark parseable past-due rows as ended. Mutates items; returns how many changed. */
export function expirePastDeadlines(items, now = Date.now()) {
  let n = 0;
  for (const item of items) {
    if (!item || !isPastDeadline(item, now)) continue;
    if (item.status === MASTER_STATUS_ENDED) continue;
    item.status = MASTER_STATUS_ENDED;
    n += 1;
  }
  return n;
}

export function selectSiteItems(items, { includeUnknown = false, includeEnded = false } = {}) {
  return items.filter((i) => {
    if (i.status === MASTER_STATUS_ONGOING) return true;
    if (includeUnknown && i.status === MASTER_STATUS_UNKNOWN) return true;
    if (includeEnded) return true;
    return false;
  });
}
