"use client";

import { useMemo, useState } from "react";
import type { Giveaway } from "@/lib/types";
import { GiveawayCard } from "./GiveawayCard";

function parseSortKey(g: Giveaway): number {
  const s = g.deadlineBj || g.deadlineRaw || "";
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return Date.parse(`${m[1]}-${m[2]}-${m[3]}`);
  const d = s.match(/^(\d+)\s*day/i);
  if (d) return Date.now() + Number(d[1]) * 86400000;
  return Number.MAX_SAFE_INTEGER;
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
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("ending");

  const filtered = useMemo(() => {
    let list = items.filter((g) => {
      if (platform !== "all" && g.platform !== platform) return false;
      if (category !== "all" && g.category !== category) return false;
      if (q.trim()) {
        const blob = `${g.title} ${g.prize} ${g.platform} ${g.category} ${g.risk}`.toLowerCase();
        if (!blob.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
    if (sort === "ending") list = [...list].sort((a, b) => parseSortKey(a) - parseSortKey(b));
    if (sort === "title") list = [...list].sort((a, b) => (a.title || "").localeCompare(b.title || "", "zh"));
    return list;
  }, [items, q, platform, category, sort]);

  return (
    <div>
      <div className="grid gap-3 rounded-2xl border border-[#1e2a3c] bg-[#0d1522] p-4 md:grid-cols-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索标题 / 奖品 / 平台"
          className="rounded-xl border border-[#1e2a3c] bg-[#070b12] px-3 py-2 text-sm outline-none focus:border-[#3b82f6]"
        />
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-xl border border-[#1e2a3c] bg-[#070b12] px-3 py-2 text-sm">
          <option value="all">全部平台</option>
          {platforms.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-[#1e2a3c] bg-[#070b12] px-3 py-2 text-sm">
          <option value="all">全部分类</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-[#1e2a3c] bg-[#070b12] px-3 py-2 text-sm">
          <option value="ending">即将截止优先</option>
          <option value="title">按标题</option>
        </select>
      </div>
      <div className="mt-3 text-sm text-[#8b9bb4]">显示 {filtered.length} / {items.length}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((g) => (
          <GiveawayCard key={g.id} g={g} />
        ))}
      </div>
    </div>
  );
}
