// Token-based search utilities for the global Command Palette.
// normalize is length-preserving (NFD diacritic strip) so indices in the
// normalized string map 1:1 to the original — enabling exact Highlight that
// preserves accents and casing.

export function normalize(s) {
  if (s == null) return "";
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function tokenize(q) {
  if (!q) return [];
  return normalize(q).split(/\s+/).filter(Boolean);
}

// fields: [{ text, weight }]  |  tokens: string[] (from tokenize)
// For each token, find the best matching field (by weight × word-start bonus).
// Word-start bonus = 3× when the token sits at the start of a word
//   (idx===0 or the previous char is non-alphanumeric).
// AND semantics: if any token matches no field, returns null.
// Empty tokens (no query) returns 0 — everything is a candidate for display.
export function scoreItem(fields, tokens) {
  if (!tokens.length) return 0;
  let total = 0;
  for (const tk of tokens) {
    let best = 0;
    for (const f of fields) {
      if (!f || !f.text) continue;
      const n = normalize(f.text);
      const idx = n.indexOf(tk);
      if (idx === -1) continue;
      const atWordStart = idx === 0 || !/[a-z0-9]/.test(n[idx - 1]);
      const w = f.weight * (atWordStart ? 3 : 1);
      if (w > best) best = w;
    }
    if (best === 0) return null;
    total += best;
  }
  return total;
}

// Rank + cap a list of { fields, ... } items against tokens.
// Returns items sorted by score desc, capped at `cap`.
export function rankItems(items, tokens, cap = 12) {
  const scored = items
    .map((it) => ({ ...it, _score: scoreItem(it.fields, tokens) }))
    .filter((it) => it._score !== null);
  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, cap);
}