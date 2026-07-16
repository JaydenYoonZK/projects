/*! Projects by Jayden Yoon ZK | Copyright (c) 2026 Jayden Yoon ZK | MIT License | https://github.com/JaydenYoonZK/projects */
/**
 * projects directory engine
 *
 * Pure functions for the directory page: a small ranked search over the
 * project cards and the merge step that folds the live GitHub repository
 * list into the curated one. No DOM access here, so node:test can cover
 * everything.
 */

/** Normalize a string for matching: lowercase, no punctuation noise. */
export function norm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a search entry from card-shaped data.
 * `tags` and `category` are matched as whole words and prefixes;
 * name and description are matched by token.
 */
export function buildEntry({ slug, name, description, tags, category }) {
  const nameNorm = norm(name);
  return {
    slug,
    name: nameNorm,
    nameTokens: nameNorm.split(" "),
    initials: nameNorm.split(" ").map(w => w[0]).join(""),
    description: norm(description),
    tags: (tags || []).map(norm),
    category: norm(category)
  };
}

/**
 * Score one entry against one already-normalized query token.
 * 0 means no match; larger is better.
 */
export function scoreToken(entry, token) {
  if (!token) return 0;
  if (entry.name === token) return 120;
  if (entry.name.startsWith(token)) return 90;
  if (entry.nameTokens.some(w => w.startsWith(token))) return 70;
  if (entry.tags.some(t => t === token)) return 60;
  if (entry.tags.some(t => t.startsWith(token))) return 45;
  // Category matches as whole words and prefixes, like tags, not as a raw
  // substring (which would let "round" match "working around ai").
  if (entry.category.split(" ").some(w => w === token || w.startsWith(token))) return 40;
  if (entry.name.includes(token)) return 35;
  if (entry.initials === token) return 30;
  if (entry.description.split(" ").some(w => w.startsWith(token))) return 20;
  if (entry.description.includes(token)) return 10;
  return 0;
}

/**
 * Rank entries against a free-text query. Every query token must match
 * somewhere (AND), and the entry score is the sum of its token scores.
 * Returns matching entries sorted best first; an empty query matches all.
 */
export function search(entries, query) {
  const tokens = norm(query).split(" ").filter(Boolean);
  if (!tokens.length) return entries.map(e => ({ entry: e, score: 0 }));
  const out = [];
  for (const entry of entries) {
    let total = 0;
    let ok = true;
    for (const token of tokens) {
      const s = scoreToken(entry, token);
      if (!s) { ok = false; break; }
      total += s;
    }
    if (ok) out.push({ entry, score: total });
  }
  out.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
  return out;
}

/**
 * Fold the GitHub repository list into the page.
 * Returns star/date updates for curated slugs and any fresh public
 * source repositories the page does not know yet, so new projects
 * appear without touching this repo.
 */
// Keep a fresh card's link on a real web page. A homepage that is not an
// http(s) URL (or is missing) falls back to the repository page.
function httpUrl(url, fallback) {
  try {
    const protocol = new URL(url).protocol;
    if (protocol === "http:" || protocol === "https:") return url;
  } catch { /* not a URL */ }
  return fallback;
}

export function mergeRemote(repos, knownSlugs, { exclude = [] } = {}) {
  const known = new Set(knownSlugs);
  const skip = new Set(["JaydenYoonZK", ...exclude]);
  const updates = [];
  const fresh = [];
  for (const repo of Array.isArray(repos) ? repos : []) {
    if (!repo || repo.fork || repo.archived || repo.private) continue;
    // GitHub reserved/meta repos (".github", ".github-private") are not
    // projects; never surface a dot-prefixed repo as a directory card.
    if (String(repo.name).startsWith(".")) continue;
    if (skip.has(repo.name)) continue;
    if (known.has(repo.name)) {
      updates.push({
        slug: repo.name,
        stars: repo.stargazers_count || 0,
        pushed: repo.pushed_at || null
      });
    } else {
      fresh.push({
        slug: repo.name,
        name: repo.name.replace(/[-_]+/g, " ").replace(/\b[a-z]/g, c => c.toUpperCase()),
        description: repo.description || "A new project. Description on its way.",
        url: httpUrl(repo.homepage, repo.html_url),
        source: repo.html_url,
        stars: repo.stargazers_count || 0,
        pushed: repo.pushed_at || null,
        language: repo.language || ""
      });
    }
  }
  // Newest first; a repo that has never been pushed (null date) sorts last.
  fresh.sort((a, b) => (b.pushed || "").localeCompare(a.pushed || ""));
  return { updates, fresh };
}

/** Pick the newest slugs by pushed date for the Latest strip. */
export function latestSlugs(updates, count = 3) {
  return [...updates]
    .filter(u => u.pushed)
    .sort((a, b) => String(b.pushed).localeCompare(String(a.pushed)))
    .slice(0, count)
    .map(u => u.slug);
}

/** Human "updated x ago" from an ISO date, in whole units. */
export function timeAgo(iso, now = Date.now()) {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const unit = (n, word) => `${n} ${word}${n === 1 ? "" : "s"} ago`;
  const s = Math.max(0, Math.floor((now - then) / 1000));
  if (s < 90) return "just now";
  const m = Math.floor(s / 60);
  if (m < 90) return unit(m, "minute");
  const h = Math.floor(m / 60);
  if (h < 36) return unit(h, "hour");
  const d = Math.floor(h / 24);
  if (d < 45) return unit(d, "day");
  const mo = Math.floor(d / 30);
  if (mo < 18) return unit(mo, "month");
  return unit(Math.floor(d / 365), "year");
}
