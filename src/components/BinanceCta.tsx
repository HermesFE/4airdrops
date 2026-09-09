import { binanceUrl } from "@/lib/data";

export function BinanceCta({ compact = false }: { compact?: boolean }) {
  const href = binanceUrl();
  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-flex items-center rounded-lg bg-[#f0b90b] px-3 py-2 text-sm font-semibold text-black hover:brightness-110"
      >
        Binance 返佣注册
      </a>
    );
  }
  return (
    <div className="rounded-2xl border border-[#3a2f0a] bg-gradient-to-br from-[#2a2208] to-[#15120a] p-4 shadow-lg">
      <div className="text-xs uppercase tracking-wide text-[#f0b90b]">联盟推广</div>
      <h3 className="mt-1 text-lg font-semibold text-white">开 Binance 账户，用返佣链接</h3>
      <p className="mt-2 text-sm text-[#b8a56a]">
        本站通过 Binance 注册返佣维持运营。用下面链接注册或交易，不增加你的手续费，能帮站点继续更新活动表。
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#f0b90b] px-4 py-3 text-sm font-bold text-black hover:brightness-110"
      >
        前往 Binance 注册（返佣链接）
      </a>
    </div>
  );
}
