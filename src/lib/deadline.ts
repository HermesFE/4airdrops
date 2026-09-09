import type { Giveaway } from "./types";

const MONTH_RE = /(\d+)\s*months?\b/i;
const DAY_RE = /(\d+)\s*days?\b/i;
const ISO_RE = /(\d{4})-(\d{2})-(\d{2})/;

export function parseDeadlineMs(g: Giveaway): number | null {
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
  if (months) return Date.now() + Number(months[1]) * 30 * 86400000;

  const days = raw.match(DAY_RE);
  if (days) return Date.now() + Number(days[1]) * 86400000;

  return null;
}

export function daysUntil(g: Giveaway, now = Date.now()): number | null {
  const ms = parseDeadlineMs(g);
  if (ms == null) return null;
  return Math.round((ms - now) / 86400000);
}

export function hasClearDeadline(g: Giveaway): boolean {
  if (ISO_RE.test(g.deadlineBj || "")) return true;
  if (ISO_RE.test(g.deadlineRaw || "")) return true;
  if (DAY_RE.test(g.deadlineRaw || "")) return true;
  const raw = (g.deadlineRaw || "").replace(/\(.*$/, "").trim();
  if (raw && !Number.isNaN(Date.parse(raw)) && !MONTH_RE.test(raw)) return true;
  return false;
}

export function monthCountdown(g: Giveaway): number | null {
  const m = (g.deadlineRaw || "").match(MONTH_RE);
  return m ? Number(m[1]) : null;
}

/** Far-future or multi-month countdown — likely a stale/zombie campaign. */
export function isLongHorizon(g: Giveaway, horizonDays: number, now = Date.now()): boolean {
  const months = monthCountdown(g);
  if (months != null && months >= 2) return true;
  const days = daysUntil(g, now);
  if (days != null && days > horizonDays) return true;
  return false;
}

export function sortDeadlineMs(g: Giveaway): number {
  return parseDeadlineMs(g) ?? Number.MAX_SAFE_INTEGER;
}
