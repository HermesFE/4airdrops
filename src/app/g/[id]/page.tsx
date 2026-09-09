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
    <div className="stack">
      <p className="back">
        <Link href="/">← 返回目录</Link>
      </p>
      <h1>{g.title}</h1>
      <table className="record">
        <tbody>
          <tr>
            <th>平台</th>
            <td>{g.platform || "—"}</td>
          </tr>
          {g.category ? (
            <tr>
              <th>分类</th>
              <td>{g.category}</td>
            </tr>
          ) : null}
          {g.status ? (
            <tr>
              <th>状态</th>
              <td>{g.status}</td>
            </tr>
          ) : null}
          {g.host ? (
            <tr>
              <th>主办</th>
              <td>{g.host}</td>
            </tr>
          ) : null}
          <tr>
            <th>奖品</th>
            <td style={{ whiteSpace: "pre-wrap" }}>{g.prize || g.prizeDetail || "—"}</td>
          </tr>
          {g.prizeDetail && g.prize ? (
            <tr>
              <th>奖品明细</th>
              <td style={{ whiteSpace: "pre-wrap" }}>{g.prizeDetail}</td>
            </tr>
          ) : null}
          {(g.deadlineBj || g.deadlineRaw) && (
            <tr>
              <th>截止</th>
              <td>{g.deadlineBj || g.deadlineRaw}</td>
            </tr>
          )}
          {g.region ? (
            <tr>
              <th>地区</th>
              <td>{g.region}</td>
            </tr>
          ) : null}
          {g.entry ? (
            <tr>
              <th>参与方式</th>
              <td style={{ whiteSpace: "pre-wrap" }}>{g.entry}</td>
            </tr>
          ) : null}
          {g.risk ? (
            <tr>
              <th>风险备注</th>
              <td className="danger">{g.risk}</td>
            </tr>
          ) : null}
          {outbound ? (
            <tr>
              <th>活动页</th>
              <td>
                <a href={outbound} target="_blank" rel="noopener noreferrer">
                  {outbound}
                </a>
              </td>
            </tr>
          ) : null}
          {g.sourceUrl && g.sourceUrl !== outbound ? (
            <tr>
              <th>来源</th>
              <td>
                <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {g.sourceUrl}
                </a>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {outbound ? (
        <p>
          <a className="btn" href={outbound} target="_blank" rel="noopener noreferrer">
            打开活动页
          </a>
        </p>
      ) : null}
      <BinanceCta />
    </div>
  );
}
