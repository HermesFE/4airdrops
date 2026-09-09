"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Giveaway } from "@/lib/types";
import { displayPrize } from "@/lib/text";
import { hasClearDeadline, isLongHorizon, sortDeadlineMs } from "@/lib/deadline";
import { DEFAULT_HORIZON_DAYS, HORIZON_CHOICES, STATUS_ONGOING, STATUS_UNKNOWN } from "@/lib/status";
import { formatMsg, statusLabel, useI18n } from "@/i18n/I18nProvider";
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
        const blob = `${g.title} ${g.host} ${displayPrize(g)} ${g.platform} ${g.category}`.toLowerCase();
        if (!blob.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
    if (sort === "ending") list = [...list].sort((a, b) => sortDeadlineMs(a) - sortDeadlineMs(b));
    if (sort === "title") list = [...list].sort((a, b) => (a.title || "").localeCompare(b.title || "", locale));
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
          <thead>
            <tr>
              <th className="row-num">{m.columns.n}</th>
              <th className={platform !== "all" ? "is-filtered" : undefined}>
                <div className="col-name">{m.columns.platform}</div>
                <select className="col-filter" value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label={m.columns.platform}>
                  <option value="all">{m.filter.all}</option>
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </th>
              <th className={category !== "all" ? "is-filtered" : undefined}>
                <div className="col-name">{m.columns.category}</div>
                <select className="col-filter" value={category} onChange={(e) => setCategory(e.target.value)} aria-label={m.columns.category}>
                  <option value="all">{m.filter.all}</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </th>
              <th className={q.trim() || sort === "title" ? "is-filtered col-title" : "col-title"}>
                <div className="col-name">
                  <button type="button" onClick={() => setSort("title")}>
                    {m.columns.title}
                    {sort === "title" ? " ▾" : ""}
                  </button>
                </div>
                <input
                  className="col-filter"
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={m.filter.search}
                  aria-label={m.filter.search}
                />
              </th>
              <th>
                <div className="col-name">{m.columns.prize}</div>
              </th>
              <th className={sort === "ending" ? "is-filtered" : undefined}>
                <div className="col-name">
                  <button type="button" onClick={() => setSort("ending")}>
                    {m.columns.deadline}
                    {sort === "ending" ? " ▾" : ""}
                  </button>
                </div>
              </th>
              <th className={region !== "all" ? "is-filtered" : undefined}>
                <div className="col-name">{m.columns.region}</div>
                <select className="col-filter" value={region} onChange={(e) => setRegion(e.target.value)} aria-label={m.columns.region}>
                  <option value="all">{m.filter.all}</option>
                  <option value="__empty__">{m.filter.empty}</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </th>
              <th className={status !== "all" ? "is-filtered" : undefined}>
                <div className="col-name">{m.columns.status}</div>
                <select className="col-filter" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={m.columns.status}>
                  <option value="all">{m.filter.all}</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(m, s)}
                    </option>
                  ))}
                </select>
              </th>
              <th className={risk !== "all" ? "is-filtered" : undefined}>
                <div className="col-name">{m.columns.risk}</div>
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
              filtered.map((g, i) => (
                <tr key={g.id}>
                  <td className="row-num">{i + 1}</td>
                  <td className="nowrap">{g.platform || m.filter.dash}</td>
                  <td className="nowrap">{g.category || m.filter.dash}</td>
                  <td className="clip" title={g.title}>
                    <Link href={`/g/${encodeURIComponent(g.id)}`}>{g.title || m.filter.untitled}</Link>
                  </td>
                  <td className="clip-sm" title={displayPrize(g)}>
                    {displayPrize(g) || m.filter.dash}
                  </td>
                  <td className="nowrap">{g.deadlineBj || g.deadlineRaw || m.filter.dash}</td>
                  <td className="nowrap">{g.region || m.filter.dash}</td>
                  <td className="nowrap">{statusLabel(m, g.status)}</td>
                  <td className={g.risk ? "danger nowrap" : "nowrap"} title={g.risk || ""}>
                    {g.risk ? m.filter.hasRisk : m.filter.noRisk}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
