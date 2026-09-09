import { BinanceCta } from "@/components/BinanceCta";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-white">关于 4Airdrops</h1>
      <p className="text-[#8b9bb4]">
        4Airdrops 把多平台 Giveaway / 抽奖 / 交易所活动整理成一张可读目录，方便你筛选「疑似进行中」的条目。
        数据来自公开页面与聚合源，不构成投资建议。
      </p>
      <div className="rounded-2xl border border-[#1e2a3c] bg-[#101826] p-4 text-sm text-[#8b9bb4]">
        <div className="font-semibold text-white">变现说明</div>
        <p className="mt-2">
          当前阶段以 Binance 注册返佣为主收入。站点免费开放目录；订阅提醒 / API 等轻 SaaS 功能会在有稳定流量后再做。
        </p>
      </div>
      <BinanceCta />
    </div>
  );
}
