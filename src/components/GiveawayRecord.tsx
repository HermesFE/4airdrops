"use client";

import Link from "next/link";
import type { Giveaway } from "@/lib/types";
import { BinanceCta } from "./BinanceCta";
import { formatDeadline } from "@/lib/deadline";
import { displayCategory, displayPlatform, displayRegion } from "@/lib/fieldLabels";
import { statusLabel, useI18n } from "@/i18n/I18nProvider";
import { localePath } from "@/i18n/paths";
import {
  cleanDisplayText,
  displayEntry,
  displayPrize,
  displayRisk,
  displayTitle,
  originalIfDifferent,
} from "@/lib/text";

function originalRows(g: Giveaway, m: ReturnType<typeof useI18n>["m"], locale: ReturnType<typeof useI18n>["locale"]) {
  const title = displayTitle(g, locale);
  const prize = displayPrize(g, locale);
  const prizeDetail = g.prizeDetailEn || g.prizeDetail || "";
  const entry = displayEntry(g);
  const risk = displayRisk(g);
  const rows: { label: string; text: string }[] = [];
  const titleOrig = originalIfDifferent(title, g.title);
  if (titleOrig) rows.push({ label: m.columns.title, text: titleOrig });
  const prizeOrig = originalIfDifferent(prize, g.prize);
  if (prizeOrig) rows.push({ label: m.detail.prize, text: prizeOrig });
  const detailOrig = originalIfDifferent(cleanDisplayText(prizeDetail), g.prizeDetail);
  if (detailOrig && detailOrig !== prizeOrig) rows.push({ label: m.detail.prizeDetail, text: detailOrig });
  const entryOrig = originalIfDifferent(entry, g.entry);
  if (entryOrig) rows.push({ label: m.detail.entry, text: entryOrig });
  const riskOrig = originalIfDifferent(risk, g.risk);
  if (riskOrig) rows.push({ label: m.detail.risk, text: riskOrig });
  return rows;
}

export function GiveawayRecord({ g }: { g: Giveaway }) {
  const { m, locale } = useI18n();
  const outbound = g.url || g.sourceUrl;
  const title = displayTitle(g, locale);
  const prize = displayPrize(g, locale);
  const prizeDetailShown = cleanDisplayText(g.prizeDetailEn) || cleanDisplayText(g.prizeDetail);
  const entry = displayEntry(g);
  const risk = displayRisk(g);
  const originals = originalRows(g, m, locale);
  const deadline = formatDeadline(g);
  return (
    <div className="stack">
      <p className="back">
        <Link href={localePath(locale)}>{m.detail.back}</Link>
      </p>
      <h1 title={originalIfDifferent(title, g.title) || undefined}>{title}</h1>
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
            <td style={{ whiteSpace: "pre-wrap" }} title={originalIfDifferent(prize, g.prize) || undefined}>
              {prize || m.filter.dash}
            </td>
          </tr>
          {prizeDetailShown && prize && prizeDetailShown !== prize ? (
            <tr>
              <th>{m.detail.prizeDetail}</th>
              <td style={{ whiteSpace: "pre-wrap" }}>{prizeDetailShown}</td>
            </tr>
          ) : null}
          {deadline.text && (
            <tr>
              <th>{m.detail.deadline}</th>
              <td title={deadline.title || undefined}>
                {deadline.text}
                {deadline.title && deadline.title !== deadline.text ? (
                  <div className="deadline-raw">{deadline.title}</div>
                ) : null}
              </td>
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
          {entry ? (
            <tr>
              <th>{m.detail.entry}</th>
              <td style={{ whiteSpace: "pre-wrap" }} title={originalIfDifferent(entry, g.entry) || undefined}>
                {entry}
              </td>
            </tr>
          ) : null}
          {risk ? (
            <tr>
              <th>{m.detail.risk}</th>
              <td className="danger" title={originalIfDifferent(risk, g.risk) || undefined}>
                {risk}
              </td>
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
      {originals.length ? (
        <details className="original-src">
          <summary>{m.detail.original}</summary>
          <table className="record">
            <tbody>
              {originals.map((row) => (
                <tr key={row.label}>
                  <th>{row.label}</th>
                  <td style={{ whiteSpace: "pre-wrap" }}>{row.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
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
