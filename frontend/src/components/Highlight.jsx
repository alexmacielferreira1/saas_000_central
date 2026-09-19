import React from "react";
import { normalize, tokenize } from "@/lib/searchUtils";

// Highlights every occurrence of the query tokens inside `text`, preserving
// the original accents and casing. Indices map 1:1 because normalize() is
// length-preserving.
export default function Highlight({ text, query, markClassName }) {
  const t = text == null ? "" : String(text);
  if (!query) return <>{t}</>;
  const tokens = tokenize(query);
  if (!tokens.length) return <>{t}</>;

  const n = normalize(t);
  const ranges = [];
  for (const tk of tokens) {
    let from = 0;
    while (from <= n.length) {
      const idx = n.indexOf(tk, from);
      if (idx === -1) break;
      ranges.push([idx, idx + tk.length]);
      from = idx + tk.length;
    }
  }
  if (!ranges.length) return <>{t}</>;

  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }

  const parts = [];
  let pos = 0;
  merged.forEach(([s, e], i) => {
    if (pos < s) parts.push(<span key={`p${i}`}>{t.slice(pos, s)}</span>);
    parts.push(
      <mark
        key={`m${i}`}
        className={markClassName || "rounded bg-emerald-500/25 px-0.5 text-emerald-100"}
      >
        {t.slice(s, e)}
      </mark>
    );
    pos = e;
  });
  if (pos < t.length) parts.push(<span key="end">{t.slice(pos)}</span>);
  return <>{parts}</>;
}