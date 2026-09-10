#!/usr/bin/env node
/**
 * Regenerates public/ brand assets: Excel-grid + "4A", theme #217346.
 * Requires Python Pillow: `python3 -m pip install pillow`
 *
 *   node scripts/generate-brand.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const GREEN = "#217346";
const BG = "#c8c2b4";

const ICON_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="4Airdrops">
  <title>4Airdrops</title>
  <rect width="32" height="32" fill="${GREEN}"/>
  <g stroke="#164e2f" stroke-width="1" fill="none" shape-rendering="crispEdges">
    <path d="M0 8h32M0 16h32M0 24h32M8 0v32M16 0v32M24 0v32"/>
  </g>
  <rect x="1" y="1" width="30" height="30" fill="none" stroke="#2d9a5c" stroke-width="1"/>
  <text x="16" y="21.5" text-anchor="middle" font-family="Tahoma, Verdana, Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">4A</text>
</svg>
`;

const MANIFEST = {
  name: "4Airdrops",
  short_name: "4A",
  description: "Public giveaway / airdrop directory",
  start_url: "/",
  display: "standalone",
  background_color: BG,
  theme_color: GREEN,
  icons: [
    { src: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  ],
};

const PY = String.raw`
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(sys.argv[1])
GREEN = (33, 115, 70)       # #217346
GREEN_DK = (22, 78, 47)
GREEN_LT = (45, 154, 92)
GREEN_PALE = (226, 239, 218)
WHITE = (255, 255, 255)
INK = (17, 17, 17)
MUTED = (85, 85, 85)
GRID = (180, 180, 180)
LINE = (127, 127, 127)
BG = (200, 194, 180)        # #c8c2b4
BAR = (212, 208, 200)
HEADER = (214, 220, 228)
ZEBRA = (238, 242, 247)
PAPER = (255, 255, 255)
META = (197, 208, 222)
SELECT = (255, 248, 197)

FONT_BOLD = [
    "/usr/share/fonts/truetype/macos/Inter-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
]
FONT_REG = [
    "/usr/share/fonts/truetype/macos/Inter-Regular.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
]
FONT_MONO = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
    "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf",
]


def load_font(paths, size):
    for p in paths:
        if os.path.isfile(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def text_wh(draw, text, font):
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]


def center_text(draw, xywh, text, font, fill):
    x, y, w, h = xywh
    tw, th = text_wh(draw, text, font)
    tx = x + (w - tw) / 2
    ty = y + (h - th) / 2 - 1
    draw.text((tx, ty), text, font=font, fill=fill)


def draw_grid_icon(size, label_size):
    im = Image.new("RGBA", (size, size), GREEN + (255,))
    d = ImageDraw.Draw(im)
    step = max(4, size // 4)
    for i in range(step, size, step):
        d.line([(0, i), (size, i)], fill=GREEN_DK, width=1)
        d.line([(i, 0), (i, size)], fill=GREEN_DK, width=1)
    d.rectangle([0, 0, size - 1, size - 1], outline=GREEN_LT)
    font = load_font(FONT_BOLD, label_size)
    center_text(d, (0, 0, size, size), "4A", font, WHITE)
    return im.convert("RGB")


def draw_apple():
    s = 180
    im = Image.new("RGB", (s, s), GREEN)
    d = ImageDraw.Draw(im)
    # Spreadsheet inset
    pad = 14
    d.rectangle([pad, pad, s - pad - 1, s - pad - 1], fill=PAPER, outline=LINE)
    title_h = 22
    d.rectangle([pad, pad, s - pad - 1, pad + title_h], fill=GREEN)
    center_text(d, (pad, pad, s - 2 * pad, title_h), "4Airdrops", load_font(FONT_BOLD, 12), WHITE)
    # Column letters + row gutter
    gutter = 16
    cols = 4
    rows = 5
    inner_x = pad + 1
    inner_y = pad + title_h + 1
    inner_r = s - pad - 1
    inner_b = s - pad - 1
    cw = (inner_r - inner_x - gutter) / cols
    rh = (inner_b - inner_y) / (rows + 1)
    # row header bg
    d.rectangle([inner_x, inner_y, inner_x + gutter, inner_b], fill=BAR)
    # col header bg
    d.rectangle([inner_x, inner_y, inner_r, inner_y + rh], fill=HEADER)
    letters = "ABCD"
    for c in range(cols):
        x0 = inner_x + gutter + c * cw
        center_text(d, (x0, inner_y, cw, rh), letters[c], load_font(FONT_BOLD, 10), INK)
    for r in range(rows):
        y0 = inner_y + (r + 1) * rh
        if r % 2 == 1:
            d.rectangle([inner_x + gutter, y0, inner_r, y0 + rh], fill=ZEBRA)
        center_text(d, (inner_x, y0, gutter, rh), str(r + 1), load_font(FONT_MONO, 9), MUTED)
    # grid lines
    for c in range(cols + 1):
        x = inner_x + gutter + c * cw
        d.line([(x, inner_y), (x, inner_b)], fill=GRID)
    d.line([(inner_x, inner_y), (inner_x, inner_b)], fill=GRID)
    for r in range(rows + 2):
        y = inner_y + r * rh
        d.line([(inner_x, y), (inner_r, y)], fill=GRID)
    # selected "4A" cell (A1-ish, spanning)
    ax = inner_x + gutter
    ay = inner_y + rh
    d.rectangle([ax + 1, ay + 1, ax + cw * 2 - 1, ay + rh * 2 - 1], fill=GREEN)
    center_text(d, (ax, ay, cw * 2, rh * 2), "4A", load_font(FONT_BOLD, 28), WHITE)
    return im


def draw_og():
    w, h = 1200, 630
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    # Workbook window
    mx, my = 36, 28
    d.rectangle([mx, my, w - mx - 1, h - my - 1], fill=PAPER, outline=(109, 109, 109), width=2)
    # Title bar
    th = 42
    d.rectangle([mx + 2, my + 2, w - mx - 3, my + th], fill=GREEN)
    d.text((mx + 16, my + 10), "4Airdrops.xls  —  public giveaway directory", font=load_font(FONT_BOLD, 20), fill=WHITE)
    # Fake window buttons
    for i, col in enumerate([(200, 80, 80), (196, 160, 48), (80, 160, 80)]):
        bx = w - mx - 18 - i * 22
        d.rectangle([bx - 8, my + 14, bx + 6, my + 28], fill=col, outline=GREEN_DK)
    # Menu + formula bar
    menu_y = my + th
    d.rectangle([mx + 2, menu_y, w - mx - 3, menu_y + 26], fill=BAR)
    d.text((mx + 16, menu_y + 5), "File    Edit    View    Data    Help", font=load_font(FONT_REG, 14), fill=INK)
    fx_y = menu_y + 26
    d.rectangle([mx + 2, fx_y, w - mx - 3, fx_y + 28], fill=PAPER, outline=LINE)
    d.rectangle([mx + 2, fx_y, mx + 48, fx_y + 28], fill=META)
    d.text((mx + 14, fx_y + 6), "fx", font=load_font(FONT_BOLD, 14), fill=MUTED)
    d.text((mx + 58, fx_y + 6), '=FILTER(giveaways, status<>"ended")', font=load_font(FONT_MONO, 14), fill=INK)
    # Sheet grid
    grid_y = fx_y + 28
    grid_x = mx + 2
    grid_r = w - mx - 3
    grid_b = h - my - 3
    gutter = 40
    cols = 6
    rows = 8
    cw = (grid_r - grid_x - gutter) / cols
    rh = (grid_b - grid_y) / (rows + 1)
    d.rectangle([grid_x, grid_y, grid_x + gutter, grid_b], fill=BAR)
    d.rectangle([grid_x, grid_y, grid_r, grid_y + rh], fill=HEADER)
    letters = "ABCDEF"
    headers = ["Title", "Platform", "Category", "Prize", "Deadline", "Region"]
    for c in range(cols):
        x0 = grid_x + gutter + c * cw
        center_text(d, (x0, grid_y, cw, rh), f"{letters[c]}  {headers[c]}", load_font(FONT_BOLD, 13), INK)
    sample = [
        ("4Airdrops", "Gleam", "Airdrop", "Directory", "Open", "Worldwide"),
        ("Weekly drop", "Galxe", "DeFi", "Points", "Active", "Global"),
        ("NFT mint", "Zealy", "NFT", "WL spot", "Active", "APAC"),
        ("Quest board", "TaskOn", "Social", "Token", "Unverified", "Worldwide"),
        ("Launch pool", "Binance", "Exchange", "Allocation", "Active", "Global"),
        ("Community", "Discord", "Gaming", "Key", "Open", "EU"),
        ("Snapshot", "Layer3", "Quest", "XP", "Active", "Worldwide"),
    ]
    for r in range(rows):
        y0 = grid_y + (r + 1) * rh
        if r % 2 == 1:
            d.rectangle([grid_x + gutter, y0, grid_r, min(y0 + rh, grid_b)], fill=ZEBRA)
        if r < len(sample):
            center_text(d, (grid_x, y0, gutter, rh), str(r + 1), load_font(FONT_MONO, 12), MUTED)
            for c, cell in enumerate(sample[r]):
                x0 = grid_x + gutter + c * cw
                d.text((x0 + 8, y0 + 6), cell, font=load_font(FONT_REG, 14), fill=INK)
    for c in range(cols + 1):
        x = grid_x + gutter + c * cw
        d.line([(x, grid_y), (x, grid_b)], fill=GRID)
    d.line([(grid_x, grid_y), (grid_x, grid_b)], fill=GRID)
    for r in range(rows + 2):
        y = grid_y + r * rh
        if y <= grid_b:
            d.line([(grid_x, y), (grid_r, y)], fill=GRID)
    # Brand mark overlay — selected merged cell
    mark_x = grid_x + gutter + 8
    mark_y = grid_y + rh + 8
    mark_w = cw * 2 - 16
    mark_h = rh * 3 - 16
    d.rectangle([mark_x, mark_y, mark_x + mark_w, mark_y + mark_h], fill=GREEN, outline=GREEN_DK, width=2)
    center_text(d, (mark_x, mark_y, mark_w, mark_h - 22), "4A", load_font(FONT_BOLD, 72), WHITE)
    center_text(d, (mark_x, mark_y + mark_h - 36, mark_w, 28), "4airdrops.com", load_font(FONT_REG, 16), GREEN_PALE)
    return im


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    icon16 = draw_grid_icon(16, 10)
    icon32 = draw_grid_icon(32, 15)
    apple = draw_apple()
    og = draw_og()
    icon16.save(OUT / "favicon-16x16.png", "PNG", optimize=True)
    icon32.save(OUT / "favicon-32x32.png", "PNG", optimize=True)
    apple.save(OUT / "apple-touch-icon.png", "PNG", optimize=True)
    og.save(OUT / "og.png", "PNG", optimize=True)
    icon32.save(OUT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])
    print("wrote rasters + favicon.ico")


if __name__ == "__main__":
    main()
`;

fs.mkdirSync(PUBLIC, { recursive: true });
fs.writeFileSync(path.join(PUBLIC, "icon.svg"), ICON_SVG);
fs.writeFileSync(path.join(PUBLIC, "site.webmanifest"), `${JSON.stringify(MANIFEST, null, 2)}\n`);

const pyFile = path.join(os.tmpdir(), "4airdrops-generate-brand.py");
fs.writeFileSync(pyFile, PY);
const res = spawnSync("python3", [pyFile, PUBLIC], { encoding: "utf8" });
if (res.stdout) process.stdout.write(res.stdout);
if (res.stderr) process.stderr.write(res.stderr);
if (res.status !== 0) {
  console.error("Pillow raster step failed. Install with: python3 -m pip install pillow");
  process.exit(res.status ?? 1);
}

const expected = [
  "favicon.ico",
  "icon.svg",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "og.png",
  "site.webmanifest",
];
for (const name of expected) {
  const p = path.join(PUBLIC, name);
  const st = fs.statSync(p);
  if (st.size <= 0) {
    console.error(`${name} is empty`);
    process.exit(1);
  }
  console.log(`${name}\t${st.size}`);
}
