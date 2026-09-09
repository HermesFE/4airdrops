/** Display-only cleanup for scraped HTML/JS fragments. Does not change source JSON. */
export function cleanDisplayText(raw?: string): string {
  if (!raw) return "";
  let s = raw.trim();
  const meta = s.match(/content="([^"]+)"/i) || s.match(/content='([^']+)'/i);
  if (meta?.[1]) s = meta[1].trim();
  const js = s.search(/\(\(a,b,c,d/);
  if (js >= 0) s = s.slice(0, js).trim();
  s = s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^"+|"+$/g, "").trim();
  return s;
}

export function displayPrize(g: { prize?: string; prizeDetail?: string }): string {
  return cleanDisplayText(g.prize) || cleanDisplayText(g.prizeDetail) || "";
}
