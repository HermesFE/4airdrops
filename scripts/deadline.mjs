/**
 * Shared deadline helpers for ingest (import-csv) and tests.
 * Keep in sync with src/lib/deadline.ts (same parse rules + isPastDeadline).
 */

const MONTH_RE = /(\d+)\s*months?\b/i;
const DAY_RE = /(\d+)\s*days?\b/i;
const ISO_RE = /(\d{4})-(\d{2})-(\d{2})/;

export const MASTER_STATUS_ONGOING = "疑似进行中";
export const MASTER_STATUS_UNKNOWN = "状态不明";
/** Master-table / giveaways.json status string for ended (UI: 已结束). */
export const MASTER_STATUS_ENDED = "已结束/过期";

export function parseDeadlineMs(g, now = Date.now()) {
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

export function utcDayMs(ms) {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Absolute calendar/datetime deadline is on a UTC day before today.
 * Relative "N days/months" countdowns are never treated as already ended.
 */
export function isPastDeadline(g, now = Date.now()) {
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
