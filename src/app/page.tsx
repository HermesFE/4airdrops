import { GiveawayFilters } from "@/components/GiveawayFilters";
import { BinanceCta } from "@/components/BinanceCta";
import { categoriesOf, getAllGiveaways, getUpdatedAt, platformsOf } from "@/lib/data";

export default function HomePage() {
  const items = getAllGiveaways();
  const updatedAt = getUpdatedAt();
  return (
    <div>
      <h1>今日可跟的活动目录</h1>
      <p className="lede">
        聚合 Gleam / KingSumo / ViralSweep 等公开活动。默认显示「疑似进行中」；完整表由每日同步更新。
        {updatedAt ? ` 数据时间：${updatedAt}` : ""}
      </p>
      <BinanceCta />
      <p className="hint">
        使用建议：优先看即将截止、地区允许的条目。有风险提示先读备注。外链请核对官方域名。
      </p>
      <GiveawayFilters items={items} platforms={platformsOf(items)} categories={categoriesOf(items)} />
    </div>
  );
}
