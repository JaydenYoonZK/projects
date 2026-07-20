/*! Projects by Jayden Yoon ZK | Copyright (c) 2026 Jayden Yoon ZK | MIT License | https://github.com/JaydenYoonZK/projects */
/* The directory page: the suite shell (theme, scene, dust), a ranked
   search over the project cards, and a live merge with the GitHub API so
   new repositories appear here on their own. */
import { buildEntry, search, mergeRemote, latestSlugs, timeAgo } from "./directory.js?v=1.1.7";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const scrollBehavior = () => (reducedMotion.matches ? "auto" : "smooth");
// SMIL animations are not covered by CSS reduced-motion rules, pause them.
function applyReducedMotion() {
  if (reducedMotion.matches) document.querySelectorAll("svg").forEach((el) => el.pauseAnimations?.());
  else document.querySelectorAll("svg").forEach((el) => el.unpauseAnimations?.());
}
applyReducedMotion();
reducedMotion.addEventListener?.("change", applyReducedMotion);

// -------- sponsor button magic (sparkle rim + floating hearts) --------
// The tooltip bubble itself is pure CSS; this builds the sparkle layer sized
// to the bubble's real box and streams hearts while a mouse hovers. Reduced
// motion skips all of it, touch never sees it, keyboard focus gets sparkles.
const sponsorBtn = document.querySelector(".sponsor-btn");
if (sponsorBtn && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const HEART_PATH = "M12 21s-6.7-4.35-9.33-8.11C.8 10.2 1.96 6.5 5.14 5.44c1.9-.63 3.98.03 5.36 1.6L12 8.6l1.5-1.56c1.38-1.57 3.46-2.23 5.36-1.6 3.18 1.06 4.34 4.76 2.47 7.45C18.7 16.65 12 21 12 21z";
  const SPARKS = ["✦", "✧", "⋆"];
  const SPARK_TINTS = ["", "var(--spk-b)", "var(--spk-c)"];
  let fx = null, heartTimer = 0, liveHearts = 0;
  const buildFx = () => {
    if (fx) return;
    const tip = getComputedStyle(sponsorBtn, "::after");
    // computed width/height are the content box; the visible bubble adds
    // padding and the gradient keyline, so include them or the stars hug a
    // box smaller than what the eye sees
    const pad = (p) => parseFloat(tip[p]) || 0;
    const w = (parseFloat(tip.width) || 122) + pad("paddingLeft") + pad("paddingRight") + 2;
    const h = (parseFloat(tip.height) || 18) + pad("paddingTop") + pad("paddingBottom") + 2;
    fx = document.createElement("span");
    fx.className = "sponsor-fx";
    fx.setAttribute("aria-hidden", "true");
    fx.style.width = w + "px";
    fx.style.height = h + "px";
    // eight stars parked around the bubble's rim, each on its own phase
    const spots = [[-38, 4], [-30, 34], [-42, 68], [10, 102], [62, 96], [108, 74], [116, 30], [96, -5]];
    spots.forEach(([top, left], k) => {
      const s = document.createElement("span");
      s.className = "spk";
      s.textContent = SPARKS[k % SPARKS.length];
      s.style.top = top + "%";
      s.style.left = left + "%";
      s.style.fontSize = (9 + ((k * 5) % 6)) + "px";
      s.style.animationDelay = (-k * 0.21).toFixed(2) + "s";
      s.style.animationDuration = (1.5 + (k % 3) * 0.35).toFixed(2) + "s";
      if (SPARK_TINTS[k % 3]) s.style.color = SPARK_TINTS[k % 3];
      fx.appendChild(s);
    });
    sponsorBtn.appendChild(fx);
  };
  const spawnHeart = () => {
    if (liveHearts >= 7 || document.hidden) return;
    liveHearts++;
    const el = document.createElement("span");
    el.className = "sponsor-heart";
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("--hx", (Math.random() * 44 - 22).toFixed(0) + "px");
    el.style.setProperty("--hd", (1.05 + Math.random() * 0.7).toFixed(2) + "s");
    el.style.setProperty("--hs", (0.7 + Math.random() * 0.7).toFixed(2));
    el.style.setProperty("--hr", (Math.random() * 40 - 20).toFixed(0) + "deg");
    if (Math.random() < 0.33) el.style.color = "#ff9ed2";
    el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${HEART_PATH}"/></svg>`;
    el.addEventListener("animationend", () => { el.remove(); liveHearts--; });
    sponsorBtn.appendChild(el);
  };
  sponsorBtn.addEventListener("pointerenter", (e) => {
    buildFx();
    if (e.pointerType === "mouse") {
      spawnHeart();
      clearInterval(heartTimer);
      heartTimer = setInterval(spawnHeart, 300);
    }
  });
  sponsorBtn.addEventListener("pointerleave", () => { clearInterval(heartTimer); heartTimer = 0; });
  sponsorBtn.addEventListener("focus", buildFx);
}

const themeToggle = document.getElementById("theme-toggle");

function syncThemeIcon() {
  const label = document.documentElement.dataset.theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  themeToggle.setAttribute("aria-label", label);
  themeToggle.setAttribute("data-tip", label);
}

let themeFadeTimer = 0;
themeToggle.addEventListener("click", () => {
  // Crossfade the page in one composited pass where the browser supports
  // view transitions; text then cannot re-ease its inherited color and lag
  // behind the page. Elsewhere, fall back to fading only non-inherited
  // colors so text switches in one clean step.
  if (document.startViewTransition) {
    document.documentElement.classList.add("vt-active");
    const vt = document.startViewTransition(() => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f6f4ee" : "#0d0c0a");
      try { localStorage.setItem("theme", next); } catch { /* storage may be blocked */ }
      syncThemeIcon();
    });
    vt.finished.finally(() => document.documentElement.classList.remove("vt-active"));
    return;
  }
  document.documentElement.classList.add("theme-fading");
  clearTimeout(themeFadeTimer);
  themeFadeTimer = setTimeout(() => document.documentElement.classList.remove("theme-fading"), 500);
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f6f4ee" : "#0d0c0a");
  try { localStorage.setItem("theme", next); } catch { /* storage may be blocked */ }
  syncThemeIcon();
});
syncThemeIcon();

const scene = document.querySelector(".bg-scene");
if (scene && matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let rafId = 0;
  addEventListener("mousemove", (e) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      scene.style.setProperty("--px", (e.clientX / innerWidth - 0.5).toFixed(3));
      scene.style.setProperty("--py", (e.clientY / innerHeight - 0.5).toFixed(3));
    });
  }, { passive: true });
}
if (scene && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let scrollRaf = 0;
  const applyScroll = () => { scrollRaf = 0; scene.style.setProperty("--sy", String(scrollY)); };
  addEventListener("scroll", () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(applyScroll); }, { passive: true });
  applyScroll();
}

const siteNav = document.querySelector(".site-nav");
if (siteNav) {
  const setNavHeight = () => document.documentElement.style.setProperty("--nav-h", siteNav.offsetHeight + "px");
  addEventListener("resize", setNavHeight, { passive: true });
  setNavHeight();
}

// Cursor dust: tiny chartreuse sparks trail the pointer and burn out about
// a second after it rests. Everything lives on one fixed canvas: spawning
// is distance-based so speed sets density, the animation loop stops the
// moment the last spark dies, and touch or reduced-motion visitors never
// pay for any of it.
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  // width/height 100% is load-bearing: a canvas is a replaced element, so
  // inset alone does not stretch it and it would lay out at its intrinsic
  // dpr-scaled size, drawing every spark dpr times too far from the cursor.
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:2100;pointer-events:none;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener("resize", size);

  // One pre-rendered glow sprite per theme: drawImage per spark is far
  // cheaper than building a fresh radial gradient every frame.
  const sprite = (core) => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const halo = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    halo.addColorStop(0, "rgba(171, 207, 55, 0.55)");
    halo.addColorStop(0.4, "rgba(171, 207, 55, 0.16)");
    halo.addColorStop(1, "rgba(171, 207, 55, 0)");
    g.fillStyle = halo;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = core;
    g.beginPath();
    g.arc(32, 32, 4.5, 0, 7);
    g.fill();
    return c;
  };
  // The pale core glows against the night theme; light mode gets a deeper
  // green core so the dust stays visible on cream.
  const dust = { dark: sprite("#d7ef7a"), light: sprite("#7e9c26") };

  const sparks = [];
  const MAX = 90;
  let raf = 0, prev = 0, lastX = -1, lastY = -1, carry = 0;

  const spawn = (x, y, dx, dy) => {
    if (sparks.length >= MAX) return;
    const a = Math.random() * Math.PI * 2;
    const push = 4 + Math.random() * 16;
    sparks.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(a) * push + dx * 1.4,
      vy: Math.sin(a) * push + dy * 1.4,
      life: 0,
      ttl: 0.45 + Math.random() * 0.5,
      r: 5 + Math.random() * 9,
      star: Math.random() < 0.25,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 4,
      seed: Math.random() * 40
    });
  };

  const star = (R) => {
    ctx.beginPath();
    ctx.moveTo(0, -R);
    ctx.quadraticCurveTo(R * 0.16, -R * 0.16, R, 0);
    ctx.quadraticCurveTo(R * 0.16, R * 0.16, 0, R);
    ctx.quadraticCurveTo(-R * 0.16, R * 0.16, -R, 0);
    ctx.quadraticCurveTo(-R * 0.16, -R * 0.16, 0, -R);
    ctx.fill();
  };

  const tick = (now) => {
    const t = now / 1000;
    const dt = Math.min(0.05, prev ? t - prev : 0.016);
    prev = t;
    ctx.clearRect(0, 0, w, h);
    const light = document.documentElement.dataset.theme === "light";
    const img = light ? dust.light : dust.dark;
    ctx.fillStyle = light ? "#7e9c26" : "#d7ef7a";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      if (s.life >= s.ttl) { sparks.splice(i, 1); continue; }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.9;
      s.vy = s.vy * 0.9 + 26 * dt; // the dust settles gently
      const k = 1 - s.life / s.ttl;
      const twinkle = 0.7 + 0.3 * Math.sin(t * 16 + s.seed);
      ctx.globalAlpha = k * k * twinkle;
      const R = s.r * (0.5 + 0.7 * k);
      ctx.drawImage(img, s.x - R, s.y - R, R * 2, R * 2);
      if (s.star) {
        s.rot += s.spin * dt;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        star(R * 0.9);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    if (sparks.length) raf = requestAnimationFrame(tick);
    else { raf = 0; prev = 0; ctx.clearRect(0, 0, w, h); }
  };

  addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    if (lastX < 0) { lastX = e.clientX; lastY = e.clientY; return; }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    carry += Math.hypot(dx, dy);
    while (carry > 10) {
      carry -= 10;
      spawn(e.clientX, e.clientY, dx, dy);
    }
    if (sparks.length && !raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
})();


// Offline support: a small service worker caches the page shell so the
// tool opens without a connection after the first visit.
if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline support is optional */ });
  });
}

console.info(
  "%cBuilt by Jayden Yoon ZK%c https://github.com/JaydenYoonZK",
  "background:#abcf37;color:#101400;font-weight:700;padding:2px 8px;border-radius:999px",
  "color:inherit"
);

// The footer's copyright year keeps itself current.
const yearEl = document.getElementById("copyright-year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const toTop = document.getElementById("to-top");
if (toTop) {
  addEventListener("scroll", () => {
    toTop.classList.toggle("show", scrollY > 600);
  }, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: scrollBehavior() }));
}

// Reading-line scroll spy, shared with the tool pages.
const navAnchors = [...document.querySelectorAll(".nav-links a")].filter(a => a.hash);
const navSections = navAnchors.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
navSections.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
// When the last few sections are short, they pile into the final screen and the
// page can no longer scroll each heading up to the reading line, so scroll
// position alone cannot tell them apart at the bottom. Remember which link was
// clicked and honor it while parked at the bottom; a real scroll (wheel or
// touch) clears it and the reading line takes over again.
let clickedHash = null;
for (const a of navAnchors) a.addEventListener("click", () => { clickedHash = a.hash; });
addEventListener("wheel", () => { clickedHash = null; }, { passive: true });
addEventListener("touchmove", () => { clickedHash = null; }, { passive: true });
function syncActiveLink() {
  const nav = document.querySelector(".site-nav");
  const line = (nav ? nav.offsetHeight : 0) + 40;
  let current = null;
  for (const sec of navSections) {
    if (sec.getBoundingClientRect().top <= line) current = sec;
  }
  if (navSections.length && Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2) {
    current = (clickedHash && navSections.find(s => "#" + s.id === clickedHash)) || navSections[navSections.length - 1];
  }
  for (const a of navAnchors) {
    const on = !!current && a.hash === "#" + current.id;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  }
}
let spyRaf = 0;
addEventListener("scroll", () => { if (!spyRaf) spyRaf = requestAnimationFrame(() => { spyRaf = 0; syncActiveLink(); }); }, { passive: true });
addEventListener("resize", syncActiveLink, { passive: true });
syncActiveLink();

// FAQ accordions: the button carries the disclosure state, so keyboard
// and screen reader users get the expand and collapse for free.
document.querySelectorAll(".faq-q button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const open = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
});

// ---- The directory itself ----

const cards = [...document.querySelectorAll(".proj-card")];
const entries = cards.map(card => buildEntry({
  slug: card.dataset.slug,
  name: card.dataset.name,
  description: card.dataset.desc,
  tags: (card.dataset.tags || "").split(","),
  category: card.dataset.category
}));
const bySlug = new Map(cards.map(card => [card.dataset.slug, card]));

const input = document.getElementById("project-search");
const count = document.getElementById("search-count");
const empty = document.getElementById("search-empty");
const sections = [...document.querySelectorAll("[data-collection]")];

function applySearch() {
  const results = search(entries, input.value);
  const keep = new Set(results.map(r => r.entry.slug));
  const searching = input.value.trim().length > 0;
  for (const card of cards) card.hidden = !keep.has(card.dataset.slug);
  for (const sec of sections) {
    const visible = [...sec.querySelectorAll(".proj-card")].some(c => !c.hidden);
    sec.hidden = !visible;
  }
  // The Latest strip duplicates cards, so it steps aside while searching.
  const latest = document.getElementById("latest");
  if (latest) latest.hidden = searching;
  if (searching) {
    count.textContent = keep.size === 1 ? "1 project" : `${keep.size} projects`;
  } else {
    count.textContent = "";
  }
  empty.hidden = keep.size > 0;
}
if (input) {
  input.addEventListener("input", applySearch);
  addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== input && !/^(input|textarea|select)$/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      input.focus();
    }
    if (e.key === "Escape" && document.activeElement === input) {
      input.value = "";
      applySearch();
      input.blur();
    }
  });
  document.getElementById("search-reset").addEventListener("click", () => {
    input.value = "";
    applySearch();
    input.focus();
  });
}

// Latest strip: cloned cards, newest pushes first. Baked order comes from
// the page; the live merge below re-sorts it when fresh data arrives.
function fillLatest(slugs) {
  const rail = document.getElementById("latest-rail");
  if (!rail) return;
  rail.textContent = "";
  for (const slug of slugs) {
    const card = bySlug.get(slug);
    if (card) rail.appendChild(card.cloneNode(true));
  }
}
fillLatest(cards.slice(0, 3).map(c => c.dataset.slug));

// Live self-update: one public, unauthenticated call. Stars and dates
// refresh on the curated cards, and unknown public source repos get a
// plain card in the fresh section, so this page tracks the account
// without anyone editing it.
async function refreshFromGitHub() {
  let repos;
  try {
    const res = await fetch("https://api.github.com/users/JaydenYoonZK/repos?per_page=100&sort=pushed", {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!res.ok) return;
    repos = await res.json();
  } catch {
    return; // offline or rate-limited: the baked directory stands on its own
  }
  const { updates, fresh } = mergeRemote(repos, [...bySlug.keys()], { exclude: ["projects", "sentinel-icons", ".github"] });
  for (const u of updates) {
    const card = bySlug.get(u.slug);
    if (!card) continue;
    card.dataset.pushed = u.pushed || "";
    const meta = card.querySelector(".proj-meta");
    if (meta && u.pushed) {
      const bits = [`Updated ${timeAgo(u.pushed)}`];
      if (u.stars > 0) bits.push(u.stars === 1 ? "1 star" : `${u.stars} stars`);
      meta.textContent = bits.join(" · ");
    }
  }
  fillLatest(latestSlugs(updates, 3));
  if (fresh.length) {
    const wrap = document.getElementById("fresh");
    const grid = document.getElementById("fresh-grid");
    for (const repo of fresh) {
      const a = document.createElement("a");
      a.className = "proj-card proj-card-plain";
      a.href = repo.url;
      a.dataset.slug = repo.slug;
      const h3 = document.createElement("h3");
      h3.textContent = repo.name;
      const p = document.createElement("p");
      p.textContent = repo.description;
      const meta = document.createElement("span");
      meta.className = "proj-meta";
      meta.textContent = [repo.language, repo.pushed ? `Updated ${timeAgo(repo.pushed)}` : ""].filter(Boolean).join(" · ");
      a.append(h3, p, meta);
      a.dataset.name = repo.name;
      a.dataset.desc = repo.description;
      grid.appendChild(a);
      // Register the fresh card so search hides and shows it like the rest.
      cards.push(a);
      const entry = buildEntry({ slug: repo.slug, name: repo.name, description: repo.description, tags: [], category: "" });
      entries.push(entry);
      bySlug.set(repo.slug, a);
    }
    wrap.hidden = false;
    if (!sections.includes(wrap)) sections.push(wrap);
    applySearch();
  }
}
refreshFromGitHub();
