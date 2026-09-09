import Link from "next/link";
import type { Giveaway } from "@/lib/types";

export function GiveawayCard({ g }: { g: Giveaway }) {
  return (
    <Link
      href={`/g/${encodeURIComponent(g.id)}`}
      className="block rounded-2xl border border-[#1e2a3c] bg-[#101826]/80 p-4 transition hover:border-[#3b82f6]/60 hover:bg-[#121c2c]"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-[#1a2740] px-2 py-0.5 text-[#93c5fd]">{g.platform || "未知平台"}</span>
        {g.category ? (
          <span className="rounded-full bg-[#18231f] px-2 py-0.5 text-[#86efac]">{g.category}</span>
        ) : null}
        {g.risk ? (
          <span className="rounded-full bg-[#3a1515] px-2 py-0.5 text-[#fca5a5]">风险提示</span>
        ) : null}
      </div>
      <h2 className="mt-2 line-clamp-2 text-base font-semibold text-white">{g.title}</h2>
      <p className="mt-2 line-clamp-2 text-sm text-[#8b9bb4]">{g.prize || g.prizeDetail || "奖品见详情"}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#8b9bb4]">
        {(g.deadlineBj || g.deadlineRaw) && (
          <span>截止：{g.deadlineBj || g.deadlineRaw}</span>
        )}
        {g.region && <span>地区：{g.region}</span>}
      </div>
    </Link>
  );
}
