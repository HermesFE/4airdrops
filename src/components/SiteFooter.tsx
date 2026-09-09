import { binanceUrl } from "@/lib/data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <h2>披露 / Disclosure</h2>
        <p>
          本站含{" "}
          <a href={binanceUrl()} target="_blank" rel="noopener noreferrer sponsored">
            Binance 联盟推广链接
          </a>
          。通过本站链接注册并交易，我们可能获得返佣，不会额外增加你的费用。活动信息来自公开聚合，可能过期或有风险，请自行核实（DYOR）。我们不保管助记词，也不要求连接钱包领奖。
        </p>
      </div>
    </footer>
  );
}
