"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Giveaway } from "@/lib/types";
import { contentSearchBlob, displayPrize, displayTitle, originalIfDifferent } from "@/lib/text";
import { formatDeadline, hasClearDeadline, isLongHorizon, sortDeadlineMs } from "@/lib/deadline";
import {
  displayCategory,
  displayPlatform,
  displayRegion,
  sortByLabel,
} from "@/lib/fieldLabels";
import { DEFAULT_HORIZON_DAYS, HORIZON_CHOICES, STATUS_ONGOING, STATUS_UNKNOWN } from "@/lib/status";
import { formatMsg, statusLabel, useI18n } from "@/i18n/I18nProvider";
import { giveawayRestPath, localePath } from "@/i18n/paths";
import { BinanceCta } from "./BinanceCta";

function statusesOf(items: Giveaway[]): string[] {
  return [...new Set(items.map((i) => i.status).filter(Boolean) as string[])].sort();
}

export function GiveawaySheet({
  items,
  platforms,
  categories,
  regions,
  updatedAt,
  masterOngoing,
}: {
  items: Giveaway[];
  platforms: string[];
  categories: string[];
  regions: string[];
  updatedAt: string;
  masterOngoing?: number;
}) {
  const { m, locale } = useI18n();
  const statuses = useMemo(() => statusesOf(items), [items]);
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState(() =>
    items.some((g) => g.status === STATUS_ONGOING) ? STATUS_ONGOING : "all",
  );
  const [risk, setRisk] = useState("all");
  const [sort, setSort] = useState<"ending" | "title">("ending");
  const [hideZombies, setHideZombies] = useState(true);
  const [onlyDated, setOnlyDated] = useState(false);
  const [includeUnknown, setIncludeUnknown] = useState(false);
  const [horizonDays, setHorizonDays] = useState(DEFAULT_HORIZON_DAYS);

  const defaults =
    q === "" &&
    platform === "all" &&
    category === "all" &&
    region === "all" &&
    status === (items.some((g) => g.status === STATUS_ONGOING) ? STATUS_ONGOING : "all") &&
    risk === "all" &&
    sort === "ending" &&
    hideZombies &&
    !onlyDated &&
    !includeUnknown &&
    horizonDays === DEFAULT_HORIZON_DAYS;

  const filtered = useMemo(() => {
    let list = items.filter((g) => {
      if (!includeUnknown && g.status === STATUS_UNKNOWN) return false;
      if (status === STATUS_ONGOING && includeUnknown) {
        if (g.status !== STATUS_ONGOING && g.status !== STATUS_UNKNOWN) return false;
      } else if (status !== "all" && g.status !== status) {
        return false;
      }
      if (platform !== "all" && g.platform !== platform) return false;
      if (category !== "all" && g.category !== category) return false;
      if (region === "__empty__") {
        if (g.region) return false;
      } else if (region !== "all" && g.region !== region) {
        return false;
      }
      if (risk === "yes" && !g.risk) return false;
      if (risk === "no" && g.risk) return false;
      if (onlyDated && !hasClearDeadline(g)) return false;
      if (hideZombies && isLongHorizon(g, horizonDays)) return false;
      if (q.trim()) {
        if (!contentSearchBlob(g).includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
    if (sort === "ending") list = [...list].sort((a, b) => sortDeadlineMs(a) - sortDeadlineMs(b));
    if (sort === "title") {
      list = [...list].sort((a, b) => displayTitle(a, locale).localeCompare(displayTitle(b, locale), locale));
    }
    return list;
  }, [items, q, platform, category, region, status, risk, sort, hideZombies, onlyDated, includeUnknown, horizonDays, locale]);

  function reset() {
    setQ("");
    setPlatform("all");
    setCategory("all");
    setRegion("all");
    setStatus(items.some((g) => g.status === STATUS_ONGOING) ? STATUS_ONGOING : "all");
    setRisk("all");
    setSort("ending");
    setHideZombies(true);
    setOnlyDated(false);
    setIncludeUnknown(false);
    setHorizonDays(DEFAULT_HORIZON_DAYS);
  }

  return (
    <div className="workbook">
      <div className="sheet-meta">
        <h1>{m.home.title}</h1>
        <span className="sheet-sub" title={m.home.tip}>
          {formatMsg(m.home.subtitle, { date: updatedAt || "—" })}
          {masterOngoing ? ` · ${formatMsg(m.home.coverage, { n: items.length, master: masterOngoing })}` : ""}
        </span>
        <span className="sheet-count">{formatMsg(m.home.count, { shown: filtered.length, total: items.length })}</span>
        {!defaults ? (
          <button type="button" className="reset" onClick={reset}>
            {m.home.reset}
          </button>
        ) : null}
      </div>
      <p className="sheet-note" title={m.home.tip}>
        {m.home.statusNote}
      </p>
      <BinanceCta />
      <div className="sheet-options">
        <label>
          <input type="checkbox" checked={hideZombies} onChange={(e) => setHideZombies(e.target.checked)} />
          {m.options.hideZombies}
          <select
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
            aria-label={m.options.hideZombies}
          >
            {HORIZON_CHOICES.map((n) => (
              <option key={n} value={n}>
                {formatMsg(m.options.horizon, { n })}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={onlyDated} onChange={(e) => setOnlyDated(e.target.checked)} />
          {m.options.onlyDated}
        </label>
        <label>
          <input type="checkbox" checked={includeUnknown} onChange={(e) => setIncludeUnknown(e.target.checked)} />
          {m.options.includeUnknown}
        </label>
      </div>
      <div className="sheet-wrap">
        <table className="sheet">
          <colgroup>
            <col className="col-n" />
            <col className="col-platform" />
            <col className="col-category" />
            <col className="col-title" />
            <col className="col-prize" />
            <col className="col-deadline" />
            <col className="col-region" />
            <col className="col-status" />
            <col className="col-risk" />
          </colgroup>
          <thead>
            <tr className="sheet-labels">
              <th className="row-num col-n">{m.columns.n}</th>
              <th className={platform !== "all" ? "is-filtered col-platform" : "col-platform"}>{m.columns.platform}</th>
              <th className={category !== "all" ? "is-filtered col-category" : "col-category"}>{m.columns.category}</th>
              <th className={q.trim() || sort === "title" ? "is-filtered col-title" : "col-title"}>
                <button type="button" className="col-sort" onClick={() => setSort("title")}>
                  {m.columns.title}
                  {sort === "title" ? " ▾" : ""}
                </button>
              </th>
              <th className="col-prize">{m.columns.prize}</th>
              <th className={sort === "ending" ? "is-filtered col-deadline" : "col-deadline"}>
                <button type="button" className="col-sort" onClick={() => setSort("ending")}>
                  {m.columns.deadline}
                  {sort === "ending" ? " ▾" : ""}
                </button>
              </th>
              <th className={region !== "all" ? "is-filtered col-region" : "col-region"}>{m.columns.region}</th>
              <th className={status !== "all" ? "is-filtered col-status" : "col-status"}>{m.columns.status}</th>
              <th className={risk !== "all" ? "is-filtered col-risk" : "col-risk"}>{m.columns.risk}</th>
            </tr>
            <tr className="sheet-filters">
              <th className="row-num col-n" />
              <th className="col-platform">
                <select className="col-filter" value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label={m.columns.platform}>
                  <option value="all">{m.filter.all}</option>
                  {sortByLabel(platforms, (p) => displayPlatform(p, locale) || p, locale).map((p) => (
                    <option key={p} value={p}>
                      {displayPlatform(p, locale) || p}
                    </option>
                  ))}
                </select>
              </th>
              <th className="col-category">
                <select className="col-filter" value={category} onChange={(e) => setCategory(e.target.value)} aria-label={m.columns.category}>
                  <option value="all">{m.filter.all}</option>
                  {sortByLabel(categories, (c) => displayCategory(c, locale) || c, locale).map((c) => (
                    <option key={c} value={c}>
                      {displayCategory(c, locale) || c}
                    </option>
                  ))}
                </select>
              </th>
              <th className="col-title">
                <input
                  className="col-filter"
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={m.filter.search}
                  aria-label={m.filter.search}
                />
              </th>
              <th className="col-prize" />
              <th className="col-deadline" />
              <th className="col-region">
                <select className="col-filter" value={region} onChange={(e) => setRegion(e.target.value)} aria-label={m.columns.region}>
                  <option value="all">{m.filter.all}</option>
                  <option value="__empty__">{m.filter.empty}</option>
                  {sortByLabel(regions, (r) => displayRegion(r, locale) || r, locale).map((r) => (
                    <option key={r} value={r}>
                      {displayRegion(r, locale) || r}
                    </option>
                  ))}
                </select>
              </th>
              <th className="col-status">
                <select className="col-filter" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={m.columns.status}>
                  <option value="all">{m.filter.all}</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(m, s)}
                    </option>
                  ))}
                </select>
              </th>
              <th className="col-risk">
                <select className="col-filter" value={risk} onChange={(e) => setRisk(e.target.value)} aria-label={m.columns.risk}>
                  <option value="all">{m.filter.all}</option>
                  <option value="yes">{m.filter.riskYes}</option>
                  <option value="no">{m.filter.riskNo}</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty">
                  {m.filter.noRows}
                </td>
              </tr>
            ) : (
              filtered.map((g, i) => {
                const title = displayTitle(g, locale);
                const prize = displayPrize(g, locale);
                const titleOrig = originalIfDifferent(title, g.title);
                const prizeOrig = originalIfDifferent(prize, g.prize) || originalIfDifferent(prize, g.prizeDetail);
                const deadline = formatDeadline(g);
                const platformLabel = displayPlatform(g.platform, locale) || m.filter.dash;
                const categoryLabel = displayCategory(g.category, locale) || m.filter.dash;
                const regionLabel = displayRegion(g.region, locale) || m.filter.dash;
                const statusText = statusLabel(m, g.status);
                return (
                <tr key={g.id}>
                  <td className="row-num col-n">{i + 1}</td>
                  <td className="col-platform" title={platformLabel}>{platformLabel}</td>
                  <td className="col-category" title={categoryLabel}>{categoryLabel}</td>
                  <td className="col-title" title={titleOrig || title}>
                    <Link href={localePath(locale, giveawayRestPath(g.id))}>{title || m.filter.untitled}</Link>
                  </td>
                  <td className="col-prize" title={prizeOrig || prize}>
                    {prize || m.filter.dash}
                  </td>
                  <td className="col-deadline" title={deadline.title || undefined}>
                    {deadline.text || m.filter.dash}
                  </td>
                  <td className="col-region" title={regionLabel}>{regionLabel}</td>
                  <td className="col-status" title={statusText}>{statusText}</td>
                  <td className={g.risk ? "danger col-risk" : "col-risk"} title={g.riskEn || g.risk || ""}>
                    {g.risk ? m.filter.hasRisk : m.filter.noRisk}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
