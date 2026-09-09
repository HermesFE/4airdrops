import { BinanceCta } from "./BinanceCta";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[#1e2a3c] bg-[#0a101a]">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1.4fr_1fr]">
        <div className="text-sm text-[#8b9bb4]">
          <div className="font-semibold text-white">披露 / Disclosure</div>
          <p className="mt-2">
            本站含 Binance 联盟推广链接。通过本站链接注册并交易，我们可能获得返佣，不会额外增加你的费用。
            活动信息来自公开聚合，可能过期或有风险，请自行核实（DYOR）。我们不保管助记词，也不要求连接钱包领奖。
          </p>
        </div>
        <BinanceCta />
      </div>
    </footer>
  );
}
