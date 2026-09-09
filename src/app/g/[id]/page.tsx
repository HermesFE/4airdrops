import Link from "next/link";
import { notFound } from "next/navigation";
import { BinanceCta } from "@/components/BinanceCta";
import { getAllGiveaways, getGiveaway } from "@/lib/data";

export function generateStaticParams() {
  return getAllGiveaways().map((g) => ({ id: g.id }));
}

export default async function GiveawayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const g = getGiveaway(decodeURIComponent(id));
  if (!g) notFound();
  const outbound = g.url || g.sourceUrl;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <article className="rounded-2xl border border-[#1e2a3c] bg-[#101826] p-6">
        <Link href="/" className="text-sm text-[#8b9bb4] hover:text-white">← 返回目录</Link>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[#1a2740] px-2 py-0.5 text-[#93c5fd]">{g.platform}</span>
          {g.category && <span className="rounded-full bg-[#18231f] px-2 py-0.5 text-[#86efac]">{g.category}</span>}
          {g.status && <span className="rounded-full bg-[#1f2937] px-2 py-0.5 text-[#cbd5e1]">{g.status}</span>}
        </div>
        <h1 className="mt-3 text-2xl font-bold text-white">{g.title}</h1>
        {g.host && <p className="mt-2 text-sm text-[#8b9bb4]">主办：{g.host}</p>}
        <dl className="mt-6 space-y-3 text-sm">
          <div><dt className="text-[#8b9bb4]">奖品</dt><dd className="mt-1 text-white whitespace-pre-wrap">{g.prize || g.prizeDetail || "—"}</dd></div>
          {(g.deadlineBj || g.deadlineRaw) && (
            <div><dt className="text-[#8b9bb4]">截止</dt><dd className="mt-1 text-white">{g.deadlineBj || g.deadlineRaw}</dd></div>
          )}
          {g.region && <div><dt className="text-[#8b9bb4]">地区</dt><dd className="mt-1 text-white">{g.region}</dd></div>}
          {g.entry && <div><dt className="text-[#8b9bb4]">参与方式</dt><dd className="mt-1 text-white whitespace-pre-wrap">{g.entry}</dd></div>}
          {g.risk && (
            <div className="rounded-xl border border-[#7f1d1d] bg-[#2a1212] p-3">
              <dt className="text-[#fca5a5]">风险备注</dt>
              <dd className="mt-1 text-[#fecaca]">{g.risk}</dd>
            </div>
          )}
        </dl>
        {outbound && (
          <a
            href={outbound}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex rounded-xl bg-[#3b82f6] px-4 py-3 text-sm font-semibold text-white hover:brightness-110"
          >
            打开活动页
          </a>
        )}
      </article>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <BinanceCta />
      </aside>
    </div>
  );
}
