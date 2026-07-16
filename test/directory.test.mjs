import { test } from "node:test";
import assert from "node:assert/strict";
import { norm, buildEntry, scoreToken, search, mergeRemote, latestSlugs, timeAgo } from "../docs/directory.js";

const ENTRIES = [
  buildEntry({ slug: "wp-serial-fix", name: "WP Serial Fix", description: "Serialization-safe search and replace for WordPress data", tags: ["WordPress", "PHP", "Migrations"], category: "WordPress toolkit" }),
  buildEntry({ slug: "ai-paste-cleaner", name: "AI Paste Cleaner", description: "See every hidden character in copied text", tags: ["AI", "Unicode", "Text"], category: "Working around AI" }),
  buildEntry({ slug: "package-reality-check", name: "Package Reality Check", description: "Verify dependencies really exist on npm and PyPI", tags: ["AI", "Security", "npm", "PyPI"], category: "Working around AI" })
];

test("norm strips punctuation noise and case", () => {
  assert.equal(norm("  WP Serial-Fix!  "), "wp serial-fix");
  assert.equal(norm("robots.txt"), "robots.txt");
});

test("empty query matches everything", () => {
  assert.equal(search(ENTRIES, "").length, 3);
  assert.equal(search(ENTRIES, "   ").length, 3);
});

test("name matches outrank tag and description matches", () => {
  const results = search(ENTRIES, "paste");
  assert.equal(results[0].entry.slug, "ai-paste-cleaner");
  assert.ok(scoreToken(ENTRIES[1], "paste") > scoreToken(ENTRIES[2], "npm") - 100);
});

test("tags match exactly and by prefix", () => {
  assert.equal(search(ENTRIES, "unicode")[0].entry.slug, "ai-paste-cleaner");
  assert.equal(search(ENTRIES, "uni")[0].entry.slug, "ai-paste-cleaner");
  const wp = search(ENTRIES, "wordpress");
  assert.ok(wp.some(r => r.entry.slug === "wp-serial-fix"));
});

test("multi-token queries require every token", () => {
  assert.equal(search(ENTRIES, "wordpress npm").length, 0);
  const results = search(ENTRIES, "reality npm");
  assert.equal(results.length, 1);
  assert.equal(results[0].entry.slug, "package-reality-check");
});

test("initials are a match of last resort", () => {
  const results = search(ENTRIES, "apc");
  assert.ok(results.some(r => r.entry.slug === "ai-paste-cleaner"));
});

test("mergeRemote splits known repos from fresh ones and skips noise", () => {
  const repos = [
    { name: "wp-serial-fix", stargazers_count: 4, pushed_at: "2026-07-12T01:00:00Z" },
    { name: "brand-new-tool", description: "Something new", html_url: "https://github.com/JaydenYoonZK/brand-new-tool", homepage: "", stargazers_count: 0, pushed_at: "2026-07-12T02:00:00Z", language: "JavaScript" },
    { name: "a-fork", fork: true },
    { name: "old-archive", archived: true },
    { name: "JaydenYoonZK" },
    { name: "projects" }
  ];
  const { updates, fresh } = mergeRemote(repos, ["wp-serial-fix"], { exclude: ["projects"] });
  assert.equal(updates.length, 1);
  assert.equal(updates[0].slug, "wp-serial-fix");
  assert.equal(updates[0].stars, 4);
  assert.equal(fresh.length, 1);
  assert.equal(fresh[0].slug, "brand-new-tool");
  assert.equal(fresh[0].name, "Brand New Tool");
  assert.equal(fresh[0].url, "https://github.com/JaydenYoonZK/brand-new-tool");
});

test("fresh repos prefer their homepage when set", () => {
  const { fresh } = mergeRemote([
    { name: "with-site", html_url: "https://github.com/JaydenYoonZK/with-site", homepage: "https://jaydenyoonzk.github.io/with-site/", pushed_at: "2026-07-01T00:00:00Z" }
  ], []);
  assert.equal(fresh[0].url, "https://jaydenyoonzk.github.io/with-site/");
});

test("latestSlugs sorts by push date, newest first", () => {
  const updates = [
    { slug: "a", pushed: "2026-07-10T00:00:00Z" },
    { slug: "b", pushed: "2026-07-12T00:00:00Z" },
    { slug: "c", pushed: "2026-07-11T00:00:00Z" },
    { slug: "d", pushed: null }
  ];
  assert.deepEqual(latestSlugs(updates, 3), ["b", "c", "a"]);
});

test("timeAgo reads naturally at each scale", () => {
  const now = Date.parse("2026-07-12T12:00:00Z");
  assert.equal(timeAgo("2026-07-12T11:59:30Z", now), "just now");
  assert.equal(timeAgo("2026-07-12T11:30:00Z", now), "30 minutes ago");
  assert.equal(timeAgo("2026-07-12T02:00:00Z", now), "10 hours ago");
  assert.equal(timeAgo("2026-07-05T12:00:00Z", now), "7 days ago");
  assert.equal(timeAgo("2026-01-12T12:00:00Z", now), "6 months ago");
  assert.equal(timeAgo("bogus", now), "");
});


test("mergeRemote never surfaces GitHub meta repos like .github", () => {
  const repos = [
    { name: "real-tool", fork: false, pushed_at: "2026-07-10T00:00:00Z" },
    { name: ".github", fork: false, description: "Default community health files" }
  ];
  const { fresh } = mergeRemote(repos, [], { exclude: ["projects"] });
  assert.ok(!fresh.some(f => f.slug === ".github"), ".github must not become a card");
  assert.ok(fresh.some(f => f.slug === "real-tool"), "a real new tool still surfaces");
});

test("mergeRemote sorts a never-pushed repo to the bottom, not the top", () => {
  const { fresh } = mergeRemote([
    { name: "dated", fork: false, pushed_at: "2026-07-01T00:00:00Z" },
    { name: "never", fork: false, pushed_at: null }
  ], [], {});
  assert.equal(fresh[fresh.length - 1].slug, "never");
});

test("mergeRemote falls back to the repo page when homepage is not http(s)", () => {
  const { fresh } = mergeRemote([
    { name: "evil", fork: false, homepage: "javascript:alert(1)", html_url: "https://github.com/x/evil" }
  ], [], {});
  assert.equal(fresh[0].url, "https://github.com/x/evil");
  const { fresh: ok } = mergeRemote([
    { name: "good", fork: false, homepage: "https://good.example", html_url: "https://github.com/x/good" }
  ], [], {});
  assert.equal(ok[0].url, "https://good.example");
});

test("timeAgo uses singular units for a count of one", () => {
  const NOW = Date.parse("2026-07-16T12:00:00Z");
  assert.equal(timeAgo(new Date(NOW - 91 * 1000).toISOString(), NOW), "1 minute ago");
  assert.equal(timeAgo(new Date(NOW - 5 * 60000).toISOString(), NOW), "5 minutes ago");
  assert.equal(timeAgo(new Date(NOW - 50 * 86400000).toISOString(), NOW), "1 month ago");
  assert.equal(timeAgo(new Date(NOW - 600 * 86400000).toISOString(), NOW), "1 year ago");
});

test("category matches whole words and prefixes, not arbitrary infixes", () => {
  const entries = [buildEntry({ slug: "apc", name: "AI Paste Cleaner", description: "reveal hidden characters", tags: ["AI"], category: "Working around AI" })];
  assert.equal(search(entries, "round").length, 0, "'round' inside 'around' must not match the category");
  assert.equal(search(entries, "working").length, 1, "a real category word still matches");
});
