"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Giveaway } from "@/lib/types";
import { displayPrize } from "@/lib/text";

function parseSortKey(g: Giveaway): number {
  const s = g.deadlineBj || g.deadlineRaw || "";
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return Date.parse(`${m[1]}-${m[2]}-${m[3]}`);
  const d = s.match(/^(\d+)\s*day/i);
  if (d) return Date.now() + Number(d[1]) * 86400000;
  return Number.MAX_SAFE_INTEGER;
}

function statusesOf(items: Giveaway[]): string[] {
  return [...new Set(items.map((i) => i.status).filter(Boolean) as string[])].sort();
}

export function GiveawayFilters({
  items,
  platforms,
  categories,
}: {
  items: Giveaway[];
  platforms: string[];
  categories: string[];
}) {
  const statuses = useMemo(() => statusesOf(items), [items]);
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState(() =>
    items.some((g) => g.status === "疑似进行中") ? "疑似进行中" : "all",
  );
  const [sort, setSort] = useState("ending");

  const filtered = useMemo(() => {
    let list = items.filter((g) => {
      if (platform !== "all" && g.platform !== platform) return false;
      if (category !== "all" && g.category !== category) return false;
      if (status !== "all" && g.status !== status) return false;
      if (q.trim()) {
        const blob = `${g.title} ${g.host} ${displayPrize(g)} ${g.platform} ${g.category} ${g.risk}`.toLowerCase();
        if (!blob.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
    if (sort === "ending") list = [...list].sort((a, b) => parseSortKey(a) - parseSortKey(b));
    if (sort === "title") list = [...list].sort((a, b) => (a.title || "").localeCompare(b.title || "", "zh"));
    return list;
  }, [items, q, platform, category, status, sort]);

  return (
    <div>
      <form className="toolbar" onSubmit={(e) => e.preventDefault()}>
        <label>
          搜索
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="标题 / 奖品 / 平台"
          />
        </label>
        <label>
          平台
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="all">全部平台</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          分类
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          状态
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">全部状态</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          排序
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="ending">即将截止优先</option>
            <option value="title">按标题</option>
          </select>
        </label>
      </form>
      <p className="count">
        显示 {filtered.length} / {items.length}
      </p>
      <div className="sheet-wrap">
        <table className="sheet">
          <thead>
            <tr>
              <th className="row-num">#</th>
              <th>平台</th>
              <th>分类</th>
              <th>标题</th>
              <th>奖品</th>
              <th>截止</th>
              <th>地区</th>
              <th>状态</th>
              <th>风险</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty">
                  无匹配记录
                </td>
              </tr>
            ) : (
              filtered.map((g, i) => (
                <tr key={g.id}>
                  <td className="row-num">{i + 1}</td>
                  <td className="nowrap">{g.platform || "—"}</td>
                  <td className="nowrap">{g.category || "—"}</td>
                  <td className="clip" title={g.title}>
                    <Link href={`/g/${encodeURIComponent(g.id)}`}>{g.title || "（无标题）"}</Link>
                  </td>
                  <td className="clip-sm" title={displayPrize(g)}>
                    {displayPrize(g) || "—"}
                  </td>
                  <td className="nowrap">{g.deadlineBj || g.deadlineRaw || "—"}</td>
                  <td className="nowrap">{g.region || "—"}</td>
                  <td className="nowrap">{g.status || "—"}</td>
                  <td className={g.risk ? "danger nowrap" : "nowrap"} title={g.risk || ""}>
                    {g.risk ? "有" : "—"}
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
