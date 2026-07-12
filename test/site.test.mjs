import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docs = join(root, "docs");
const html = readFileSync(join(docs, "index.html"), "utf8");
const app = readFileSync(join(docs, "app.js"), "utf8");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

test("interactive controls have accessible names", () => {
  for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const aria = match[1].match(/\baria-label="([^"]+)"/i)?.[1];
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    assert.ok(aria || text, `button has no accessible name: ${match[0]}`);
  }
  assert.match(html, /<label class="search-label" for="project-search">[^<]+<\/label>/);
});

test("internal targets and local page assets exist", () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), `missing #${match[1]}`);
  }
  const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  const local = references.filter(value => !/^(?:[a-z]+:|#)/i.test(value) && !value.startsWith("//"));
  for (const reference of local) {
    const path = reference.split(/[?#]/, 1)[0];
    assert.ok(existsSync(join(docs, path)), `missing local asset: ${reference}`);
  }
});

test("security metadata and version busts match the release", () => {
  assert.match(html, /default-src 'none'/);
  assert.match(html, /connect-src https:\/\/api\.github\.com/);
  assert.match(html, /base-uri 'none'/);
  assert.match(html, /form-action 'none'/);
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLd, "missing JSON-LD metadata");
  const metadata = JSON.parse(jsonLd[1]);
  assert.equal(metadata["@type"], "CollectionPage");
  assert.equal(metadata.mainEntity.itemListElement.length, 7);
  assert.match(html, new RegExp(`styles\\.css\\?v=${pkg.version.replaceAll(".", "\\.")}`));
  assert.match(html, new RegExp(`app\\.js\\?v=${pkg.version.replaceAll(".", "\\.")}`));
  assert.match(app, new RegExp(`directory\\.js\\?v=${pkg.version.replaceAll(".", "\\.")}`));
});

test("search and social metadata point to the canonical site", () => {
  const robots = readFileSync(join(docs, "robots.txt"), "utf8");
  const sitemap = readFileSync(join(docs, "sitemap.xml"), "utf8");
  assert.match(robots, /Sitemap: https:\/\/jaydenyoonzk\.github\.io\/projects\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/jaydenyoonzk\.github\.io\/projects\/<\/loc>/);
  assert.match(html, /<meta property="og:image:alt" content="[^"]+">/);
  assert.match(html, /<meta name="twitter:description" content="[^"]+">/);
});

test("every curated card is complete and consistent", () => {
  const cards = [...html.matchAll(/<a class="proj-card" href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)];
  assert.equal(cards.length, 7);
  for (const [, href, attrs, body] of cards) {
    const slug = attrs.match(/data-slug="([^"]+)"/)?.[1];
    assert.ok(slug, "card missing slug");
    assert.equal(href, `https://jaydenyoonzk.github.io/${slug}/`);
    assert.match(attrs, /data-name="[^"]+"/, `${slug}: missing name`);
    assert.match(attrs, /data-tags="[^"]+"/, `${slug}: missing tags`);
    assert.match(attrs, /data-desc="[^"]+"/, `${slug}: missing description`);
    assert.match(body, /<svg class="proj-scene"/, `${slug}: missing scene art`);
    assert.match(body, /<h3>[^<]+<\/h3>/, `${slug}: missing title`);
    assert.match(body, /class="proj-tag"/, `${slug}: missing rendered tags`);
  }
});

test("the live refresh degrades safely", () => {
  assert.match(app, /api\.github\.com\/users\/JaydenYoonZK\/repos/);
  assert.match(app, /if \(!res\.ok\) return;/);
  assert.match(app, /mergeRemote\(repos, \[\.\.\.bySlug\.keys\(\)\], \{ exclude: \["projects", "sentinel-icons"\] \}\)/);
});
