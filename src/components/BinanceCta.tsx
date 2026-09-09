import { binanceUrl } from "@/lib/data";

export function BinanceCta({ compact = false }: { compact?: boolean }) {
  const href = binanceUrl();
  if (compact) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer sponsored">
        Binance 返佣注册
      </a>
    );
  }
  return (
    <p className="note">
      <span className="k">推广</span>
      本站通过 Binance 注册返佣维持运营。
      <a href={href} target="_blank" rel="noopener noreferrer sponsored">
        前往 Binance 注册（返佣链接）
      </a>
      — 不增加手续费，能帮站点继续更新活动表。
    </p>
  );
}
