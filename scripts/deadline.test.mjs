import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  MASTER_STATUS_ENDED,
  MASTER_STATUS_ONGOING,
  expirePastDeadlines,
  hasClearDeadline,
  isLongHorizon,
  isPastDeadline,
  parseDeadlineMs,
  selectSiteItems,
} from "./deadline.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const NOW = Date.parse("2026-09-11T12:00:00Z");

test("parseDeadlineMs treats unlabeled deadlineBj clock as Beijing/CST", () => {
  const ms = parseDeadlineMs({ deadlineBj: "2026-09-10 21:59(来源时区未标)", deadlineRaw: "9/10/2026 09:59 PM" }, NOW);
  assert.equal(ms, Date.parse("2026-09-10T13:59:00Z"));
});

test("isPastDeadline: ISO calendar day before today is ended; today/future is not", () => {
  assert.equal(isPastDeadline({ deadlineBj: "2026-09-10 21:59" }, NOW), true);
  assert.equal(isPastDeadline({ deadlineBj: "2026-09-11 23:59" }, NOW), false);
  assert.equal(isPastDeadline({ deadlineBj: "2026-12-01" }, NOW), false);
  assert.equal(isPastDeadline({ deadlineRaw: "2026-09-01" }, NOW), true);
  assert.equal(isPastDeadline({ deadlineRaw: "September 9, 2026, 15:00 UTC" }, NOW), true);
});

test("isPastDeadline: same-day clock that already passed is ended (BJ unless labeled UTC)", () => {
  assert.equal(isPastDeadline({ deadlineBj: "2026-09-11 03:59(来源时区未标)" }, NOW), true);
  assert.equal(isPastDeadline({ deadlineBj: "2026-09-11 00:00 CST" }, NOW), true);
  assert.equal(isPastDeadline({ deadlineBj: "2026-09-11 06:59(来源时区未标)" }, NOW), true);
  assert.equal(isPastDeadline({ deadlineBj: "2026-09-11 21:59(来源时区未标)" }, NOW), false);
  assert.equal(isPastDeadline({ deadlineBj: "2026-09-11 20:00 CST", deadlineRaw: "September 11, 2026, 12:00 UTC" }, NOW), false);
  assert.equal(isPastDeadline({ deadlineBj: "约 2026-09-11 11:00（来源未标时区，按UTC估；建议提前）" }, NOW), true);
  assert.equal(isPastDeadline({ deadlineBj: "约 2026-09-11 13:00（UTC）" }, NOW), false);
  assert.equal(isPastDeadline({ deadlineBj: "约 2026-09-15 06:59（UTC 9/14 22:59）" }, NOW), false);
  assert.equal(isPastDeadline({ deadlineBj: "2026-09-11" }, NOW), false);
});

test("isPastDeadline ignores relative countdowns and empty dates", () => {
  assert.equal(isPastDeadline({ deadlineRaw: "3 months" }, NOW), false);
  assert.equal(isPastDeadline({ deadlineRaw: "5 days" }, NOW), false);
  assert.equal(isPastDeadline({ deadlineRaw: "2 months+" }, NOW), false);
  assert.equal(isPastDeadline({ title: "no date" }, NOW), false);
  assert.equal(hasClearDeadline({ deadlineRaw: "5 days" }), true);
});

test("isLongHorizon still flags multi-month / far-future", () => {
  assert.equal(isLongHorizon({ deadlineRaw: "2 months" }, 60, NOW), true);
  assert.equal(isLongHorizon({ deadlineBj: "2026-12-31" }, 60, NOW), true);
  assert.equal(isLongHorizon({ deadlineBj: "2026-09-20" }, 60, NOW), false);
});

test("expirePastDeadlines marks ongoing → 已结束/过期 and selectSiteItems drops them", () => {
  const items = [
    { id: "past", status: MASTER_STATUS_ONGOING, deadlineBj: "2026-09-01" },
    { id: "live", status: MASTER_STATUS_ONGOING, deadlineBj: "2026-10-01" },
    { id: "rel", status: MASTER_STATUS_ONGOING, deadlineRaw: "3 months" },
    { id: "already", status: MASTER_STATUS_ENDED, deadlineBj: "2026-01-01" },
  ];
  const n = expirePastDeadlines(items, NOW);
  assert.equal(n, 1);
  assert.equal(items[0].status, MASTER_STATUS_ENDED);
  assert.equal(items[1].status, MASTER_STATUS_ONGOING);
  assert.equal(items[2].status, MASTER_STATUS_ONGOING);
  const site = selectSiteItems(items);
  assert.deepEqual(
    site.map((i) => i.id),
    ["live", "rel"],
  );
  const withEnded = selectSiteItems(items, { includeEnded: true });
  assert.equal(withEnded.length, 4);
});

test("import-csv --skip-en expires past-due and omits them from default JSON", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "4air-expire-"));
  const src = path.join(dir, "in.json");
  const out = path.join(dir, "out.json");
  fs.writeFileSync(
    src,
    JSON.stringify({
      updatedAt: "2026-09-01",
      items: [
        {
          id: "past-iso",
          title: "Yesterday",
          deadlineBj: "2026-09-10",
          status: MASTER_STATUS_ONGOING,
          titleEn: "Yesterday",
          titleI18n: { en: "Yesterday", zh: "昨天" },
        },
        {
          id: "live-iso",
          title: "Next month",
          deadlineBj: "2026-10-15",
          status: MASTER_STATUS_ONGOING,
          titleEn: "Next month",
          titleI18n: { en: "Next month", zh: "下月" },
        },
        {
          id: "past-time",
          title: "This morning",
          deadlineBj: "2026-09-01 03:59(来源时区未标)",
          status: MASTER_STATUS_ONGOING,
          titleEn: "This morning",
        },
        {
          id: "providers-live",
          title: "Providers",
          titleEn: "Providers",
          titleI18n: { en: "Providers", zh: "提供商", es: "Proveedores" },
          deadlineBj: "2026-10-15",
          status: MASTER_STATUS_ONGOING,
          url: "https://giveaway-list.com/giveaway/gleam-xx/win-a-keyboard-giveaway",
        },
      ],
    }),
  );
  const env = { ...process.env };
  delete env.KIE_API_KEY;
  const r = spawnSync(
    process.execPath,
    [path.join(ROOT, "scripts/import-csv.mjs"), src, "--skip-en", "--skip-i18n", `--out=${out}`],
    { env, encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const data = JSON.parse(fs.readFileSync(out, "utf8"));
  assert.deepEqual(
    data.items.map((i) => i.id),
    ["live-iso", "providers-live"],
  );
  assert.equal(data.items[0].status, MASTER_STATUS_ONGOING);
  assert.equal(data.sync.expiredPastDeadline, 2);
  assert.equal(data.sync.repairedPlaceholderTitles, 1);
  assert.equal(data.items[1].title, "Win A Keyboard Giveaway");
  assert.equal(data.items[1].titleEn, "Win A Keyboard Giveaway");
  assert.equal(data.items[1].titleI18n?.zh, undefined);
  assert.equal(data.items[1].titleI18n?.en, "Win A Keyboard Giveaway");
  assert.match(r.stdout, /Expired past-deadline/);
  fs.rmSync(dir, { recursive: true, force: true });
});
