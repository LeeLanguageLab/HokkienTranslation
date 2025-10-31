// utils/tailo.js
const SYL = /^([a-z]+?)(\d?)$/i;

function tokenize(s) {
  return s.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
}
function splitTone(syl) {
  const m = syl.toLowerCase().match(SYL);
  if (!m) return { base: syl.toLowerCase(), tone: null };
  return { base: m[1], tone: m[2] ? Number(m[2]) : null };
}
function charSimilarity(a, b) {
  if (!a && !b) return 1;
  const n = Math.max(a.length, b.length);
  let same = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) same++;
  return n ? same / n : 0;
}

export function compareTailo(userInput, targetInput, baseSimilarThreshold = 0.85) {
  const userSyls = tokenize(userInput);
  const targetSyls = tokenize(targetInput);
  const len = Math.max(userSyls.length, targetSyls.length);

  const items = [];
  let correct = 0;

  for (let i = 0; i < len; i++) {
    const t = targetSyls[i] ?? null;
    const u = userSyls[i] ?? null;

    if (!t && u) { items.push({ index: i, target: "", user: u, status: "extra", message: `Extra syllable '${u}'.` }); continue; }
    if (t && !u) { items.push({ index: i, target: t, user: null, status: "missing", message: `Missing syllable '${t}'.` }); continue; }

    const { base: tb, tone: tt } = splitTone(t);
    const { base: ub, tone: ut } = splitTone(u);

    if (tb === ub && tt === ut) {
      items.push({ index: i, target: t, user: u, status: "correct", message: `Correct: ${t}` });
      correct++;
    } else if (tb === ub && tt !== ut) {
      items.push({ index: i, target: t, user: u, status: "tone-mismatch", message: `Tone mismatch on '${tb}': expected ${tt ?? "∅"}, got ${ut ?? "∅"}.` });
    } else if (charSimilarity(tb, ub) >= baseSimilarThreshold) {
      items.push({ index: i, target: t, user: u, status: "mispronounced", message: `Base differs slightly on '${tb}': you said '${ub}'.` });
    } else {
      items.push({ index: i, target: t, user: u, status: "mispronounced", message: `Mispronounced '${tb}': you said '${ub}'.` });
    }
  }

  const overall = items.length ? correct / items.length : 0;
  return { overall, items };
}
