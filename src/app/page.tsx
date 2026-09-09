import { GiveawayFilters } from "@/components/GiveawayFilters";
import { BinanceCta } from "@/components/BinanceCta";
import { categoriesOf, getAllGiveaways, getUpdatedAt, platformsOf } from "@/lib/data";

export default function HomePage() {
  const items = getAllGiveaways();
  const updatedAt = getUpdatedAt();
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">今日可跟的活动目录</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#8b9bb4]">
          聚合 Gleam / KingSumo / ViralSweep 等公开活动。默认种子为「疑似进行中」抽样；完整表由每日同步更新。
          {updatedAt ? ` 数据时间：${updatedAt}` : ""}
        </p>
        <div className="mt-6">
          <GiveawayFilters items={items} platforms={platformsOf(items)} categories={categoriesOf(items)} />
        </div>
      </div>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <BinanceCta />
        <div className="rounded-2xl border border-[#1e2a3c] bg-[#101826] p-4 text-sm text-[#8b9bb4]">
          <div className="font-semibold text-white">使用建议</div>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>优先看即将截止、地区允许的</li>
            <li>有「风险提示」先读备注</li>
            <li>外链请核对官方域名</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
