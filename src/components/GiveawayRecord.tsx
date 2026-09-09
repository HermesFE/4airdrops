"use client";

import Link from "next/link";
import type { Giveaway } from "@/lib/types";
import { BinanceCta } from "./BinanceCta";
import { displayCategory, displayDeadline, displayPlatform, displayRegion } from "@/lib/fieldLabels";
import { statusLabel, useI18n } from "@/i18n/I18nProvider";

export function GiveawayRecord({ g }: { g: Giveaway }) {
  const { m, locale } = useI18n();
  const outbound = g.url || g.sourceUrl;
  return (
    <div className="stack">
      <p className="back">
        <Link href="/">{m.detail.back}</Link>
      </p>
      <h1>{g.title}</h1>
      <table className="record">
        <tbody>
          <tr>
            <th>{m.detail.platform}</th>
            <td>{displayPlatform(g.platform, locale) || m.filter.dash}</td>
          </tr>
          {g.category ? (
            <tr>
              <th>{m.detail.category}</th>
              <td>{displayCategory(g.category, locale)}</td>
            </tr>
          ) : null}
          {g.status ? (
            <tr>
              <th>{m.detail.status}</th>
              <td>{statusLabel(m, g.status)}</td>
            </tr>
          ) : null}
          {g.host ? (
            <tr>
              <th>{m.detail.host}</th>
              <td>{g.host}</td>
            </tr>
          ) : null}
          <tr>
            <th>{m.detail.prize}</th>
            <td style={{ whiteSpace: "pre-wrap" }}>{g.prize || g.prizeDetail || m.filter.dash}</td>
          </tr>
          {g.prizeDetail && g.prize && g.prizeDetail !== g.prize ? (
            <tr>
              <th>{m.detail.prizeDetail}</th>
              <td style={{ whiteSpace: "pre-wrap" }}>{g.prizeDetail}</td>
            </tr>
          ) : null}
          {(g.deadlineBj || g.deadlineRaw) && (
            <tr>
              <th>{m.detail.deadline}</th>
              <td>{displayDeadline(g.deadlineBj || g.deadlineRaw, locale)}</td>
            </tr>
          )}
          {g.firstSeen ? (
            <tr>
              <th>{m.detail.firstSeen}</th>
              <td>{g.firstSeen}</td>
            </tr>
          ) : null}
          {g.region ? (
            <tr>
              <th>{m.detail.region}</th>
              <td>{displayRegion(g.region, locale)}</td>
            </tr>
          ) : null}
          {g.entry ? (
            <tr>
              <th>{m.detail.entry}</th>
              <td style={{ whiteSpace: "pre-wrap" }}>{g.entry}</td>
            </tr>
          ) : null}
          {g.risk ? (
            <tr>
              <th>{m.detail.risk}</th>
              <td className="danger">{g.risk}</td>
            </tr>
          ) : null}
          {outbound ? (
            <tr>
              <th>{m.detail.url}</th>
              <td>
                <a href={outbound} target="_blank" rel="noopener noreferrer">
                  {outbound}
                </a>
              </td>
            </tr>
          ) : null}
          {g.sourceUrl && g.sourceUrl !== outbound ? (
            <tr>
              <th>{m.detail.source}</th>
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
            {m.detail.open}
          </a>
        </p>
      ) : null}
      <BinanceCta />
    </div>
  );
}
