import { BinanceCta } from "@/components/BinanceCta";

export default function AboutPage() {
  return (
    <div className="stack narrow">
      <h1>关于 4Airdrops</h1>
      <p className="lede">
        4Airdrops 把多平台 Giveaway / 抽奖 / 交易所活动整理成一张可读目录，方便你筛选「疑似进行中」的条目。数据来自公开页面与聚合源，不构成投资建议。
      </p>
      <h2>变现说明</h2>
      <p className="lede">
        当前阶段以 Binance 注册返佣为主收入。站点免费开放目录；订阅提醒 / API 等轻功能会在有稳定流量后再做。
      </p>
      <BinanceCta />
    </div>
  );
}
