import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";

/* ============================================================
   DESIGN SYSTEM v3
   Palette:  ink #07070F · glass rgba(255,255,255,.045)
             violet #8B5CF6 · pink #FF63B0 · cyan #37E6C9 (aurora trio)
   Type:     Bricolage Grotesque (display, bold/quirky) · Inter (body)
             JetBrains Mono (data/labels)
   Signature: a slow-drifting aurora mesh, a floating mouse-tilted
              glass "license stack" in the hero, a podium ranking for
              the week's top 3 products, and a category rail that
              filters the catalog in place — all transform/opacity
              only, so it stays smooth on ad traffic.
   Note: this component intentionally has NO header/nav and NO footer —
   the site already provides those. Drop this in between them.
============================================================ */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --cv-ink: #07070F;
  --cv-ink-2: #0B0B18;
  --cv-glass: rgba(255,255,255,0.045);
  --cv-glass-hi: rgba(255,255,255,0.08);
  --cv-border: rgba(255,255,255,0.10);
  --cv-border-strong: rgba(255,255,255,0.22);
  --cv-text: #F6F7FB;
  --cv-muted: #A6ACC0;
  --cv-faint: #686E82;
  --cv-violet: #8B5CF6;
  --cv-violet-2: #6D3FF0;
  --cv-pink: #FF63B0;
  --cv-cyan: #37E6C9;
  --cv-gold: #F5C463;
  --cv-aurora: linear-gradient(115deg, var(--cv-violet) 0%, var(--cv-pink) 48%, var(--cv-cyan) 100%);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

.cv-home {
  position: relative;
  background: var(--cv-ink);
  color: var(--cv-text);
  font-family: "Inter", sans-serif;
  overflow-x: clip;
  isolation: isolate;
}

.cv-home ::selection { background: rgba(139,92,246,.35); color: #fff; }

.cv-shell { max-width: 1240px; margin: 0 auto; padding-left: 24px; padding-right: 24px; position: relative; z-index: 2; }

/* =========================================
   AURORA BACKGROUND (signature motion layer)
========================================= */

.cv-aurora-field {
  position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none;
}
.cv-aurora-blob {
  position: absolute; border-radius: 50%; filter: blur(90px); opacity: .55;
  will-change: transform;
}
.cv-aurora-blob.b1 {
  width: 620px; height: 620px; left: -180px; top: -220px;
  background: radial-gradient(circle, var(--cv-violet), transparent 70%);
  animation: cvDrift1 26s ease-in-out infinite alternate;
}
.cv-aurora-blob.b2 {
  width: 520px; height: 520px; right: -160px; top: 40px;
  background: radial-gradient(circle, var(--cv-pink), transparent 70%);
  animation: cvDrift2 22s ease-in-out infinite alternate;
}
.cv-aurora-blob.b3 {
  width: 480px; height: 480px; left: 30%; top: 420px;
  background: radial-gradient(circle, var(--cv-cyan), transparent 70%);
  opacity: .32;
  animation: cvDrift3 30s ease-in-out infinite alternate;
}
@keyframes cvDrift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(60px,50px) scale(1.12); } }
@keyframes cvDrift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-50px,60px) scale(1.08); } }
@keyframes cvDrift3 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,-40px) scale(1.15); } }

.cv-grain {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: .035; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

@media (prefers-reduced-motion: reduce) {
  .cv-aurora-blob { animation: none !important; }
  .cv-reveal { transition: none !important; opacity: 1 !important; transform: none !important; }
  .cv-marquee-track { animation: none !important; }
}

/* =========================================
   SCROLL REVEAL
========================================= */

.cv-reveal {
  opacity: 0; transform: translateY(22px);
  transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1);
}
.cv-reveal.is-visible { opacity: 1; transform: translateY(0); }

/* =========================================
   HERO
========================================= */

.cv-hero { position: relative; padding: 84px 0 96px; }

.cv-hero-grid {
  display: grid; grid-template-columns: 1.05fr .95fr; gap: 50px; align-items: center;
}

.cv-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 14px; border: 1px solid var(--cv-border-strong);
  background: var(--cv-glass); backdrop-filter: blur(10px); border-radius: 999px;
  color: var(--cv-text); font-size: 11.5px; font-weight: 600;
  letter-spacing: .3px; margin-bottom: 26px;
}
.cv-eyebrow .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cv-aurora); }

.cv-hero h1 {
  font-family: "Bricolage Grotesque", sans-serif;
  font-size: clamp(42px, 5.6vw, 74px);
  line-height: 1.0; letter-spacing: -2.5px; font-weight: 700;
  max-width: 640px;
}
.cv-hero h1 .grad {
  background: var(--cv-aurora); background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: cvShine 6s linear infinite;
}
@keyframes cvShine { to { background-position: 200% center; } }

.cv-hero-description {
  max-width: 480px; margin-top: 24px;
  color: var(--cv-muted); font-size: 16.5px; line-height: 1.7;
}

.cv-hero-actions { display: flex; gap: 14px; margin-top: 36px; flex-wrap: wrap; }

.cv-btn-primary {
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 52px; padding: 0 26px; border-radius: 14px; border: none; cursor: pointer;
  background: var(--cv-aurora); background-size: 220% auto; background-position: 0% center;
  color: #07070F; text-decoration: none; font-size: 14.5px; font-weight: 700;
  overflow: hidden; transition: transform .3s ease, background-position .5s ease, box-shadow .3s ease;
  box-shadow: 0 12px 30px rgba(139,92,246,.28);
}
.cv-btn-primary:hover { transform: translateY(-2px); background-position: 100% center; box-shadow: 0 16px 40px rgba(255,99,176,.32); }

.cv-btn-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  height: 52px; padding: 0 24px; border: 1px solid var(--cv-border-strong);
  background: var(--cv-glass); backdrop-filter: blur(10px);
  border-radius: 14px; color: var(--cv-text); text-decoration: none;
  font-size: 14.5px; font-weight: 600; transition: .25s ease;
}
.cv-btn-secondary:hover { border-color: rgba(255,255,255,.4); background: var(--cv-glass-hi); transform: translateY(-2px); }

/* --- Signature hero visual: floating tilted glass license stack --- */
.cv-tilt-stage { perspective: 1400px; }
.cv-stack {
  position: relative; height: 380px; transform-style: preserve-3d;
  transition: transform .12s ease-out;
  animation: cvFloat 6s ease-in-out infinite;
}
@keyframes cvFloat { 0%,100% { translate: 0 0; } 50% { translate: 0 -14px; } }

.cv-stack-card {
  position: absolute; left: 50%; top: 50%; width: 320px;
  border-radius: 18px; border: 1px solid var(--cv-border-strong);
  background: linear-gradient(160deg, rgba(255,255,255,.09), rgba(255,255,255,.02));
  backdrop-filter: blur(16px); box-shadow: 0 30px 70px rgba(0,0,0,.5);
  padding: 20px;
}
.cv-stack-card.c1 { transform: translate(-50%,-50%) translateZ(0px) rotate(-6deg); }
.cv-stack-card.c2 { transform: translate(-50%,-50%) translateZ(40px) translateY(18px) rotate(3deg); }
.cv-stack-card.c3 {
  transform: translate(-50%,-50%) translateZ(80px) translateY(46px) rotate(-2deg);
  background: linear-gradient(160deg, rgba(139,92,246,.22), rgba(255,99,176,.10));
}
.cv-stack-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.cv-stack-row:last-child { margin-bottom: 0; }
.cv-stack-label { font-family: "JetBrains Mono", monospace; font-size: 10px; color: var(--cv-faint); text-transform: uppercase; letter-spacing: 1px; }
.cv-stack-check { width: 20px; height: 20px; border-radius: 6px; background: rgba(55,230,201,.16); color: var(--cv-cyan); display: flex; align-items: center; justify-content: center; font-size: 11px; }
.cv-stack-title { font-family: "Bricolage Grotesque", sans-serif; font-weight: 700; font-size: 16px; margin-bottom: 4px; }
.cv-stack-sub { color: var(--cv-muted); font-size: 11.5px; }
.cv-stack-bar { height: 6px; border-radius: 3px; background: rgba(255,255,255,.08); overflow: hidden; margin-top: 12px; }
.cv-stack-bar-fill { height: 100%; width: 78%; background: var(--cv-aurora); border-radius: 3px; }

/* =========================================
   MARQUEE TRUST STRIP
========================================= */

.cv-marquee {
  border-top: 1px solid var(--cv-border); border-bottom: 1px solid var(--cv-border);
  background: rgba(255,255,255,.02);
  padding: 20px 0; overflow: hidden; position: relative;
}
.cv-marquee-track {
  display: flex; gap: 64px; width: max-content;
  animation: cvMarquee 26s linear infinite;
}
@keyframes cvMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.cv-marquee-item {
  display: flex; align-items: center; gap: 10px;
  color: var(--cv-muted); font-size: 13px; font-weight: 600; white-space: nowrap;
}
.cv-marquee-icon {
  width: 24px; height: 24px; border-radius: 7px;
  background: var(--cv-glass); border: 1px solid var(--cv-border);
  color: var(--cv-cyan); display: flex; align-items: center; justify-content: center;
}
.cv-marquee-icon svg { width: 12px; height: 12px; }

/* =========================================
   SECTION HEADING (shared)
========================================= */

.cv-section { padding: 100px 0; position: relative; }
.cv-section-heading {
  margin-bottom: 44px; max-width: 620px;
  display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap;
}
.cv-section-heading-text { max-width: 560px; }
.cv-section-label {
  display: inline-flex; align-items: center; gap: 7px;
  color: var(--cv-cyan); font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.6px; margin-bottom: 14px;
  font-family: "JetBrains Mono", monospace;
}
.cv-section-heading h2 {
  font-family: "Bricolage Grotesque", sans-serif; font-size: clamp(28px, 3.8vw, 42px);
  letter-spacing: -1.4px; font-weight: 700; line-height: 1.08;
}
.cv-section-heading p { color: var(--cv-faint); font-size: 14px; margin-top: 12px; }

/* =========================================
   HIT PRODUCTS OF THE WEEK — podium
========================================= */

.cv-hits-section { padding-top: 0; }
.cv-hits-podium {
  display: grid; grid-template-columns: 1fr 1.14fr 1fr; gap: 22px; align-items: end;
}
.cv-hit-wrap { perspective: 1000px; }
.cv-hit-wrap.rank-1 { order: 2; }
.cv-hit-wrap.rank-2 { order: 1; }
.cv-hit-wrap.rank-3 { order: 3; }

.cv-hit-card {
  position: relative; background: var(--cv-glass);
  border: 1px solid var(--cv-border); border-radius: 20px; overflow: hidden;
  backdrop-filter: blur(6px);
  transition: transform .35s cubic-bezier(.16,1,.3,1), border-color .3s ease, background .3s ease, box-shadow .3s ease;
}
.cv-hit-wrap.rank-1 .cv-hit-card {
  transform: translateY(-26px);
  border-color: rgba(255,196,99,.45);
  box-shadow: 0 30px 60px rgba(139,92,246,.20);
}
.cv-hit-card:hover { border-color: var(--cv-border-strong); background: var(--cv-glass-hi); }
.cv-hit-wrap.rank-1 .cv-hit-card:hover { transform: translateY(-32px); }

.cv-hit-rank {
  position: absolute; top: 14px; left: 14px; z-index: 2;
  width: 38px; height: 38px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-family: "Bricolage Grotesque", sans-serif; font-weight: 800; font-size: 15px;
  background: rgba(7,7,15,.65); border: 1px solid var(--cv-border-strong); backdrop-filter: blur(8px);
  color: var(--cv-text);
}
.cv-hit-wrap.rank-1 .cv-hit-rank { background: var(--cv-aurora); color: #07070F; border: none; }

.cv-hit-image { display: block; position: relative; aspect-ratio: 1 / .82; overflow: hidden; background: #0C0C18; }
.cv-hit-wrap.rank-1 .cv-hit-image { aspect-ratio: 1 / .92; }
.cv-hit-image img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .5s ease; }
.cv-hit-card:hover .cv-hit-image img { transform: scale(1.06); }
.cv-hit-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,.08), transparent 45%, rgba(0,0,0,.32)); pointer-events: none; }

.cv-hit-body { padding: 20px; }
.cv-hit-name { display: block; color: #ECEEF6; text-decoration: none; font-family: "Bricolage Grotesque", sans-serif; font-size: 16.5px; font-weight: 700; line-height: 1.35; min-height: 44px; }
.cv-hit-name:hover { color: #fff; }
.cv-hit-category { display: inline-block; margin-top: 6px; color: var(--cv-cyan); font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .8px; font-family: "JetBrains Mono", monospace; }

.cv-hit-price { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
.cv-hit-link {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 17px; padding-top: 13px; border-top: 1px solid var(--cv-border);
  color: var(--cv-faint); text-decoration: none; font-size: 10.5px; font-weight: 600; transition: .2s;
}
.cv-hit-link span:last-child { font-size: 14px; transition: transform .2s ease; }
.cv-hit-link:hover { color: var(--cv-text); }
.cv-hit-link:hover span:last-child { transform: translateX(3px); }

/* =========================================
   CATEGORY RAIL
========================================= */

.cv-category-rail {
  display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 32px;
  scrollbar-width: none;
}
.cv-category-rail::-webkit-scrollbar { display: none; }

.cv-category-pill {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px;
  height: 42px; padding: 0 18px; border-radius: 999px;
  border: 1px solid var(--cv-border); background: var(--cv-glass); backdrop-filter: blur(8px);
  color: var(--cv-muted); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .2s ease;
  font-family: "Inter", sans-serif;
}
.cv-category-pill:hover { border-color: var(--cv-border-strong); color: var(--cv-text); transform: translateY(-1px); }
.cv-category-pill[data-active="true"] {
  background: var(--cv-aurora); border-color: transparent; color: #07070F;
}
.cv-category-pill-count {
  font-family: "JetBrains Mono", monospace; font-size: 10.5px;
  background: rgba(255,255,255,.1); border-radius: 999px; padding: 2px 7px;
}
.cv-category-pill[data-active="true"] .cv-category-pill-count { background: rgba(7,7,15,.18); }

/* =========================================
   PRODUCT GRID — 3D tilt cards
========================================= */

.cv-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }

.cv-product-wrap { perspective: 1000px; }
.cv-product {
  min-width: 0; background: var(--cv-glass);
  border: 1px solid var(--cv-border); border-radius: 18px; overflow: hidden;
  backdrop-filter: blur(6px);
  transition: transform .12s ease-out, border-color .3s ease, background .3s ease, box-shadow .3s ease;
  transform: perspective(1000px) rotateX(var(--ry,0deg)) rotateY(var(--rx,0deg)) translateZ(0);
}
.cv-product:hover {
  border-color: var(--cv-border-strong); background: var(--cv-glass-hi);
  box-shadow: 0 24px 50px rgba(139,92,246,.16);
}

.cv-product-image { display: block; position: relative; aspect-ratio: 1 / .78; overflow: hidden; background: #0C0C18; }
.cv-product-image img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .5s ease; }
.cv-product:hover .cv-product-image img { transform: scale(1.06); }
.cv-product-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,.1), transparent 45%, rgba(0,0,0,.3)); pointer-events: none; }
.cv-product-badge {
  position: absolute; top: 11px; left: 11px;
  background: rgba(7,7,15,.7); border: 1px solid var(--cv-border-strong); backdrop-filter: blur(8px);
  padding: 5px 9px; border-radius: 7px; color: #E3E5F0; font-size: 8px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px; font-family: "JetBrains Mono", monospace;
}

.cv-product-body { padding: 18px; }
.cv-product-name {
  display: block; color: #ECEEF6; text-decoration: none;
  font-family: "Bricolage Grotesque", sans-serif; font-size: 15.5px; font-weight: 600; line-height: 1.4; min-height: 42px;
}
.cv-product-name:hover { color: #fff; }

.cv-product-price { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
.cv-price-from { font-size: 9px; color: var(--cv-faint); text-transform: uppercase; letter-spacing: .7px; font-family: "JetBrains Mono", monospace; }
.cv-price-current { font-family: "JetBrains Mono", monospace; font-size: 17px; font-weight: 600; color: var(--cv-text); }
.cv-price-old { color: var(--cv-faint); font-size: 11px; text-decoration: line-through; font-family: "JetBrains Mono", monospace; }
.cv-discount { background: rgba(255,99,176,.14); color: var(--cv-pink); border: 1px solid rgba(255,99,176,.3); border-radius: 6px; padding: 3px 7px; font-size: 8px; font-weight: 700; }

.cv-product-link {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 17px; padding-top: 13px; border-top: 1px solid var(--cv-border);
  color: var(--cv-faint); text-decoration: none; font-size: 10.5px; font-weight: 600; transition: .2s;
}
.cv-product-link span:last-child { font-size: 14px; transition: transform .2s ease; }
.cv-product-link:hover { color: var(--cv-text); }
.cv-product-link:hover span:last-child { transform: translateX(3px); }

.cv-loading {
  min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--cv-faint); font-size: 12px; font-family: "JetBrains Mono", monospace;
}
.cv-loader { display: flex; gap: 5px; margin-bottom: 12px; }
.cv-loader span { width: 6px; height: 6px; border-radius: 50%; background: var(--cv-violet); animation: cvPulse 1s infinite ease-in-out; }
.cv-loader span:nth-child(2) { animation-delay: .15s; background: var(--cv-pink); }
.cv-loader span:nth-child(3) { animation-delay: .3s; background: var(--cv-cyan); }
@keyframes cvPulse { 0%,100% { opacity: .25; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-5px); } }
.cv-empty-state { color: var(--cv-faint); font-size: 13px; }

/* =========================================
   OUT OF STOCK
========================================= */

.cv-product--oos, .cv-hit-card--oos { cursor: default; }
.cv-product--oos:hover, .cv-hit-card--oos:hover { border-color: var(--cv-border); background: var(--cv-glass); box-shadow: none; }
.cv-hit-wrap.rank-1 .cv-hit-card--oos { box-shadow: none; }

.cv-product-image--oos, .cv-hit-image--oos { cursor: default; }
.cv-product-image--oos img, .cv-hit-image--oos img { filter: grayscale(.6); opacity: .5; }
.cv-product--oos:hover .cv-product-image--oos img,
.cv-hit-card--oos:hover .cv-hit-image--oos img { transform: none; }

.cv-oos-badge {
  position: absolute; top: 11px; right: 11px; z-index: 2;
  background: rgba(220,38,38,.16); border: 1px solid rgba(220,38,38,.4); backdrop-filter: blur(8px);
  padding: 5px 9px; border-radius: 7px; color: #FF9C9C; font-size: 8px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px; font-family: "JetBrains Mono", monospace;
}
.cv-hit-wrap .cv-oos-badge { top: 14px; right: 14px; }

.cv-product-name--oos, .cv-hit-name--oos { color: var(--cv-faint); cursor: default; }
.cv-product-name--oos:hover, .cv-hit-name--oos:hover { color: var(--cv-faint); }

.cv-product-link--disabled, .cv-hit-link--disabled {
  color: var(--cv-faint); cursor: not-allowed; pointer-events: none;
}
.cv-product-link--disabled span:last-child, .cv-hit-link--disabled span:last-child { transform: none !important; }

/* =========================================
   VALUE PROPS
========================================= */

.cv-value-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.cv-value-card {
  position: relative; background: var(--cv-glass); border: 1px solid var(--cv-border); border-radius: 18px;
  padding: 28px; overflow: hidden; transition: border-color .3s ease, transform .3s ease;
}
.cv-value-card::before {
  content: ""; position: absolute; inset: -1px; border-radius: 18px; padding: 1px;
  background: var(--cv-aurora); opacity: 0; transition: opacity .3s ease;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
}
.cv-value-card:hover { transform: translateY(-4px); }
.cv-value-card:hover::before { opacity: 1; }
.cv-value-icon {
  width: 42px; height: 42px; border-radius: 12px;
  background: var(--cv-aurora); color: #07070F;
  display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
}
.cv-value-icon svg { width: 19px; height: 19px; }
.cv-value-card h3 { font-family: "Bricolage Grotesque", sans-serif; font-size: 18px; font-weight: 700; letter-spacing: -.3px; margin-bottom: 9px; }
.cv-value-card p { color: var(--cv-muted); font-size: 13.5px; line-height: 1.7; }

/* =========================================
   SECURITY PANEL
========================================= */

.cv-security {
  position: relative; overflow: hidden;
  border: 1px solid var(--cv-border-strong); border-radius: 24px;
  padding: 54px 46px;
  background: linear-gradient(135deg, rgba(139,92,246,.10), rgba(55,230,201,.05)), var(--cv-ink-2);
  display: grid; grid-template-columns: 1.1fr .9fr; gap: 40px; align-items: center;
}
.cv-security-label {
  display: inline-flex; align-items: center; gap: 7px;
  color: var(--cv-cyan); text-transform: uppercase; font-size: 10.5px; font-weight: 700; letter-spacing: 1.6px;
  font-family: "JetBrains Mono", monospace;
}
.cv-security h2 { font-family: "Bricolage Grotesque", sans-serif; font-size: clamp(25px, 3.4vw, 34px); line-height: 1.16; letter-spacing: -1px; margin-top: 14px; font-weight: 700; }
.cv-security p { color: var(--cv-muted); font-size: 14px; line-height: 1.75; margin-top: 16px; max-width: 480px; }

.cv-security-checks { display: flex; flex-direction: column; gap: 16px; }
.cv-security-check { display: flex; align-items: flex-start; gap: 13px; }
.cv-security-check-icon {
  width: 24px; height: 24px; border-radius: 7px; flex-shrink: 0; margin-top: 1px;
  background: rgba(55,230,201,.14); color: var(--cv-cyan);
  display: flex; align-items: center; justify-content: center; font-size: 12px;
}
.cv-security-check div strong { display: block; font-size: 13.5px; font-weight: 700; color: var(--cv-text); }
.cv-security-check div span { display: block; font-size: 12.5px; color: var(--cv-faint); margin-top: 3px; line-height: 1.55; }

/* =========================================
   REVIEWS
========================================= */

.cv-review-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.cv-review { border: 1px solid var(--cv-border); background: var(--cv-glass); border-radius: 18px; padding: 26px; transition: transform .3s ease, border-color .3s ease; }
.cv-review:hover { transform: translateY(-4px); border-color: var(--cv-border-strong); }
.cv-stars { color: var(--cv-pink); font-size: 13px; letter-spacing: 2px; }
.cv-review-text { color: var(--cv-muted); font-size: 13.5px; line-height: 1.75; margin-top: 16px; min-height: 78px; }
.cv-review-user { display: flex; align-items: center; gap: 11px; margin-top: 20px; padding-top: 17px; border-top: 1px solid var(--cv-border); }
.cv-review-avatar {
  width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: var(--cv-aurora); font-size: 10px; font-weight: 800; color: #07070F;
  font-family: "JetBrains Mono", monospace;
}
.cv-review-user strong { display: block; font-size: 12.5px; }
.cv-review-user span { color: var(--cv-faint); display: block; font-size: 10px; margin-top: 2px; }

/* =========================================
   FAQ
========================================= */

.cv-faq-list { display: flex; flex-direction: column; gap: 12px; max-width: 780px; }
.cv-faq-item { border: 1px solid var(--cv-border); border-radius: 14px; background: var(--cv-glass); overflow: hidden; transition: border-color .2s ease; }
.cv-faq-item[data-open="true"] { border-color: rgba(139,92,246,.5); }
.cv-faq-question {
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 19px 22px; background: none; border: none; cursor: pointer; text-align: left;
  color: var(--cv-text); font-size: 14.5px; font-weight: 600; font-family: "Inter", sans-serif;
}
.cv-faq-toggle {
  width: 24px; height: 24px; border-radius: 7px; flex-shrink: 0;
  background: rgba(255,255,255,.05); color: var(--cv-muted);
  display: flex; align-items: center; justify-content: center; font-size: 14px;
  transition: transform .3s ease, background .3s ease, color .3s ease;
}
.cv-faq-item[data-open="true"] .cv-faq-toggle { transform: rotate(45deg); background: var(--cv-aurora); color: #07070F; }
.cv-faq-answer-wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s ease; }
.cv-faq-item[data-open="true"] .cv-faq-answer-wrap { grid-template-rows: 1fr; }
.cv-faq-answer-inner { overflow: hidden; }
.cv-faq-answer { padding: 0 22px 20px; color: var(--cv-muted); font-size: 13.5px; line-height: 1.7; }

/* =========================================
   BOTTOM CTA
========================================= */

.cv-bottom-cta-inner {
  position: relative; overflow: hidden;
  border: 1px solid var(--cv-border-strong); border-radius: 24px; padding: 64px 25px; text-align: center;
  background: var(--cv-ink-2);
}
.cv-bottom-cta-inner .cv-aurora-blob { opacity: .4; }
.cv-bottom-cta h2 { font-family: "Bricolage Grotesque", sans-serif; font-size: clamp(28px, 4vw, 44px); letter-spacing: -1.4px; font-weight: 700; position: relative; z-index: 2; }
.cv-bottom-cta p { color: var(--cv-muted); font-size: 14px; margin: 14px 0 28px; position: relative; z-index: 2; }
.cv-bottom-cta .cv-btn-primary { position: relative; z-index: 2; }

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 1050px) {
  .cv-grid { grid-template-columns: repeat(3, 1fr); }
  .cv-hero-grid { grid-template-columns: 1fr; }
  .cv-tilt-stage { max-width: 460px; margin: 0 auto; }
  .cv-security { grid-template-columns: 1fr; }
}

@media (max-width: 780px) {
  .cv-hero { padding-top: 50px; padding-bottom: 64px; }
  .cv-grid { grid-template-columns: repeat(2, 1fr); }
  .cv-value-grid { grid-template-columns: 1fr; }
  .cv-review-grid { grid-template-columns: 1fr; }
  .cv-security { padding: 36px 26px; }
  .cv-section { padding: 74px 0; }
  .cv-stack { height: 300px; }
  .cv-stack-card { width: 260px; }
  .cv-hits-podium { grid-template-columns: 1fr; gap: 16px; }
  .cv-hit-wrap.rank-1, .cv-hit-wrap.rank-2, .cv-hit-wrap.rank-3 { order: initial; }
  .cv-hit-wrap.rank-1 .cv-hit-card { transform: none; }
  .cv-hit-wrap.rank-1 .cv-hit-card:hover { transform: translateY(-4px); }
}

@media (max-width: 480px) {
  .cv-shell { padding-left: 18px; padding-right: 18px; }
  .cv-hero h1 { letter-spacing: -1.4px; }
  .cv-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .cv-product-body { padding: 13px; }
  .cv-product-name { font-size: 12.5px; }
  .cv-price-current { font-size: 14px; }
  .cv-product-link { font-size: 9.5px; }
  .cv-marquee-track { gap: 40px; }
  .cv-section-heading { flex-direction: column; align-items: flex-start; }
}
`;

/* ============================================================
   CONTENT — placeholders are clearly marked. Swap in real
   figures, testimonials, and policy copy before launch.
============================================================ */

const marqueeItems = [
  { label: "Encrypted checkout", icon: <path d="M5 10h14v10H5zM8 10V7a4 4 0 018 0v3" /> },
  { label: "Instant delivery", icon: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /> },
  { label: "Verified products", icon: <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3zM9 12l2 2 4-4" /> },
  { label: "Human support", icon: <path d="M4 13a8 8 0 0116 0M2 13h4v6H2zM18 13h4v6h-4z" /> },
  { label: "Worldwide checkout", icon: <path d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c2.5 2.7 4 6.2 4 10s-1.5 7.3-4 10c-2.5-2.7-4-6.2-4-10s1.5-7.3 4-10z" /> },
];

const valueProps = [
  {
    title: "Vetted before listing",
    text: "Every product is checked against its source and licensing terms before it goes live on the store.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Delivered the moment you pay",
    text: "No waiting on manual fulfillment — access details are issued automatically once payment clears.",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
      </svg>
    ),
  },
  {
    title: "Support that actually replies",
    text: "Questions before or after a purchase go to a real person, not a ticket queue that goes quiet.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 13a8 8 0 0116 0" />
        <rect x="2" y="13" width="4" height="6" rx="1.5" />
        <rect x="18" y="13" width="4" height="6" rx="1.5" />
      </svg>
    ),
  },
];

const securityChecks = [
  {
    title: "Encrypted checkout",
    text: "Card and payment details are handled by our payment processor and never touch our servers unencrypted.",
  },
  {
    title: "Order verification",
    text: "Every purchase is checked before a license or download is released.",
  },
  {
    title: "Clear refund policy",
    text: "[Add your refund / guarantee terms here before launch]",
  },
];

// PLACEHOLDER TESTIMONIALS — replace with real, attributable customer reviews before launch.
const reviews = [
  {
    name: "Naomi W.",
    initials: "NW",
    time: "Verified purchase",
    text: "The whole process was incredibly smooth. Checkout was quick and I received access almost immediately.",
  },
  {
    name: "Tariq P.",
    initials: "TP",
    time: "Verified purchase",
    text: "Really clean store and straightforward pricing. Everything was exactly as described on the product page.",
  },
  {
    name: "Chris K.",
    initials: "CK",
    time: "Verified purchase",
    text: "Much better experience than the other stores I tried. Fast delivery and the support was actually responsive.",
  },
];

// PLACEHOLDER FAQ — confirm copy matches your actual delivery, licensing and refund process.
const faqItems = [
  {
    q: "How is my product delivered?",
    a: "[Describe delivery — e.g. access details are emailed and available in your account immediately after payment is confirmed.]",
  },
  {
    q: "What payment methods do you accept?",
    a: "[List accepted payment methods and processor, e.g. Stripe / PayPal / card.]",
  },
  {
    q: "Can I get a refund?",
    a: "[Add your refund policy — window, conditions, and how to request one.]",
  },
  {
    q: "Are these products licensed for resale or single use?",
    a: "[Clarify licensing terms per product or product category.]",
  },
];

/* ============================================================
   HELPERS — unchanged business logic, plus small additions
   for category grouping and weekly-hit selection
============================================================ */

const formatUSD = (amount) => {
  if (amount === null || amount === undefined || amount === "") return null;
  const n = Number(amount);
  if (Number.isNaN(n)) return null;
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getStartingPlan = (product) => {
  if (!Array.isArray(product.plans) || product.plans.length === 0) return null;
  return product.plans.reduce(
    (cheapest, plan) => (Number(plan.price) < Number(cheapest.price) ? plan : cheapest),
    product.plans[0]
  );
};

const getDisplayPrice = (plan) => {
  if (!plan) return { displayPrice: null, displayStrike: null, discountPct: null };

  const strike = Number(plan.strikeThroughPrice);
  const price = Number(plan.price);
  const hasStrike = Number.isFinite(strike) && Number.isFinite(price) && strike > price;

  return {
    displayPrice: formatUSD(plan.price),
    displayStrike: hasStrike ? formatUSD(plan.strikeThroughPrice) : null,
    discountPct: hasStrike ? Math.round(((strike - price) / strike) * 100) : null,
  };
};

// ------------------------------------------------------------------
// HIT PRODUCTS OF THE WEEK — set this list by hand, frontend only.
// Paste in the exact `id` of each product (check the product's URL or
// your admin panel), in the order you want them ranked: [rank 1, rank 2, rank 3].
// Nothing here is pulled from the API — if a product's id isn't in this
// array, it will never appear in the podium, no matter what the backend
// sends or which category is selected below.
// ------------------------------------------------------------------
const HIT_OF_WEEK_IDS = [
   "117", // rank 1 — center, elevated
  "118",
"119"
];

// Looks up each configured id in the fetched catalog, preserving the
// order above. Unmatched ids are silently skipped rather than backfilled,
// so the podium only ever shows products you explicitly chose.
const getWeeklyHits = (products, hitIds = HIT_OF_WEEK_IDS) => {
  return hitIds
    .map((id) => products.find((p) => String(p.id) === String(id)))
    .filter(Boolean)
    .slice(0, 3);
};

// Builds the "All" + per-category pill list with live counts from the catalog.
const buildCategoryList = (products) => {
  const counts = new Map();
  products.forEach((p) => {
    const key = p.category || "Uncategorized";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const categories = Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  categories.sort((a, b) => b.count - a.count);
  return [{ name: "All", count: products.length }, ...categories];
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================================
   MOTION PRIMITIVES — small, dependency-free, transform/opacity only
============================================================ */

// Fades + slides a section in once it scrolls into view.
const Reveal = ({ children, className = "", as: Tag = "div", delay = 0 }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={`cv-reveal ${className}`}>
      {children}
    </Tag>
  );
};

// Subtle mouse-follow 3D tilt for cards — resets smoothly on leave, skipped for touch/reduced-motion.
const useTilt = (max = 8) => {
  const ref = useRef(null);

  const onMouseMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--rx", `${(px * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(-py * max * 2).toFixed(2)}deg`);
    },
    [max]
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  return { ref, onMouseMove, onMouseLeave };
};

const TiltCard = ({ children, className = "" }) => {
  const tilt = useTilt(7);
  return (
    <div className="cv-product-wrap">
      <div
        ref={tilt.ref}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        className={className}
      >
        {children}
      </div>
    </div>
  );
};

/* ============================================================
   FAQ ACCORDION
============================================================ */

const FaqAccordion = ({ items }) => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="cv-faq-list">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div className="cv-faq-item" data-open={isOpen} key={item.q}>
            <button
              type="button"
              className="cv-faq-question"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              {item.q}
              <span className="cv-faq-toggle">+</span>
            </button>
            <div className="cv-faq-answer-wrap">
              <div className="cv-faq-answer-inner">
                <p className="cv-faq-answer">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ============================================================
   HIT PRODUCT CARD (podium)
============================================================ */

const HitCard = ({ product, rank }) => {
  const tilt = useTilt(5);
  const startingPlan = getStartingPlan(product);
  const { displayPrice, displayStrike, discountPct } = getDisplayPrice(startingPlan);
  const isMultiPlan = Array.isArray(product.plans) && product.plans.length > 1;

  // stock === false -> explicitly out of stock. Missing/undefined `stock`
  // is treated as in-stock, so existing products without the field aren't
  // affected by this change.
  const outOfStock = product.stock === false;

  return (
    <div className={`cv-hit-wrap rank-${rank}`}>
      <div
        ref={tilt.ref}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        className={`cv-hit-card${outOfStock ? " cv-hit-card--oos" : ""}`}
      >
        <span className="cv-hit-rank">{String(rank).padStart(2, "0")}</span>

        {outOfStock ? (
          <div className="cv-hit-image cv-hit-image--oos">
            <img src={product.image} alt={product.name} loading="lazy" />
            <div className="cv-hit-overlay" />
            <span className="cv-oos-badge">Out of stock</span>
          </div>
        ) : (
          <Link to={`/product/${product.id}`} className="cv-hit-image">
            <img src={product.image} alt={product.name} loading="lazy" />
            <div className="cv-hit-overlay" />
          </Link>
        )}

        <div className="cv-hit-body">
          {outOfStock ? (
            <span className="cv-hit-name cv-hit-name--oos">{product.name}</span>
          ) : (
            <Link to={`/product/${product.id}`} className="cv-hit-name">
              {product.name}
            </Link>
          )}
          {product.category && <span className="cv-hit-category">{product.category}</span>}

          <div className="cv-hit-price">
            {isMultiPlan && <span className="cv-price-from">From</span>}
            {displayPrice && <span className="cv-price-current">{displayPrice}</span>}
            {displayStrike && <span className="cv-price-old">{displayStrike}</span>}
            {discountPct && <span className="cv-discount">-{discountPct}%</span>}
          </div>

          {outOfStock ? (
            <span className="cv-hit-link cv-hit-link--disabled" aria-disabled="true">
              <span>Out of stock</span>
              <span>—</span>
            </span>
          ) : (
            <Link to={`/product/${product.id}`} className="cv-hit-link">
              <span>View product</span>
              <span>→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   PRODUCT CARD (catalog grid)
============================================================ */

const ProductCard = ({ product }) => {
  const startingPlan = getStartingPlan(product);
  const { displayPrice, displayStrike, discountPct } = getDisplayPrice(startingPlan);
  const isMultiPlan = Array.isArray(product.plans) && product.plans.length > 1;

  // stock === false -> explicitly out of stock. Missing/undefined `stock`
  // is treated as in-stock, so existing products without the field aren't
  // hidden or disabled by this change.
  const outOfStock = product.stock === false;

  return (
    <TiltCard className={`cv-product${outOfStock ? " cv-product--oos" : ""}`}>
      {outOfStock ? (
        <div className="cv-product-image cv-product-image--oos">
          <img src={product.image} alt={product.name} loading="lazy" />
          <div className="cv-product-overlay" />
          <span className="cv-product-badge">{product.category || "Digital"}</span>
          <span className="cv-oos-badge">Out of stock</span>
        </div>
      ) : (
        <Link to={`/product/${product.id}`} className="cv-product-image">
          <img src={product.image} alt={product.name} loading="lazy" />
          <div className="cv-product-overlay" />
          <span className="cv-product-badge">{product.category || "Digital"}</span>
        </Link>
      )}

      <div className="cv-product-body">
        {outOfStock ? (
          <span className="cv-product-name cv-product-name--oos">{product.name}</span>
        ) : (
          <Link to={`/product/${product.id}`} className="cv-product-name">
            {product.name}
          </Link>
        )}

        <div className="cv-product-price">
          {isMultiPlan && <span className="cv-price-from">From</span>}
          {displayPrice && <span className="cv-price-current">{displayPrice}</span>}
          {displayStrike && <span className="cv-price-old">{displayStrike}</span>}
          {discountPct && <span className="cv-discount">-{discountPct}%</span>}
        </div>

        {outOfStock ? (
          <span className="cv-product-link cv-product-link--disabled" aria-disabled="true">
            <span>Out of stock</span>
            <span>—</span>
          </span>
        ) : (
          <Link to={`/product/${product.id}`} className="cv-product-link">
            <span>View product</span>
            <span>→</span>
          </Link>
        )}
      </div>
    </TiltCard>
  );
};

/* ============================================================
   HOMEPAGE
   (No header/nav or footer here on purpose — this slots into
   the site's existing header and footer.)
============================================================ */

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const heroStack = useTilt(10);

  useEffect(() => {
    fetch("https://chartvault.shop/api/products")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const weeklyHits = useMemo(() => getWeeklyHits(products), [products]);
  // ^ reads HIT_OF_WEEK_IDS above — edit that array, not this line, to change the podium.
  const categories = useMemo(() => buildCategoryList(products), [products]);
  const filteredProducts = useMemo(
    () =>
      activeCategory === "All"
        ? products
        : products.filter((p) => (p.category || "Uncategorized") === activeCategory),
    [products, activeCategory]
  );

  return (
    <>
      <style>{styles}</style>

      <main className="cv-home">

        {/* HERO */}
        <section className="cv-hero">
          <div className="cv-aurora-field">
            <span className="cv-aurora-blob b1" />
            <span className="cv-aurora-blob b2" />
            <span className="cv-aurora-blob b3" />
          </div>
          <div className="cv-grain" />

          <div className="cv-shell cv-hero-grid">

            <div>
              <div className="cv-eyebrow">
                <span className="dot" />
                Digital products marketplace
              </div>

              <h1>
                Premium software,
                <br />
                sold with <span className="grad">proof</span>, not promises.
              </h1>

              <p className="cv-hero-description">
                Every order runs through the same verification and delivery
                process — so what you see at checkout is exactly what
                lands in your account.
              </p>

              
            </div>

            <div className="cv-tilt-stage">
              <div
                className="cv-stack"
                ref={heroStack.ref}
                onMouseMove={heroStack.onMouseMove}
                onMouseLeave={heroStack.onMouseLeave}
                style={{ transform: `rotateX(var(--ry,0deg)) rotateY(var(--rx,0deg))` }}
              >
                <div className="cv-stack-card c1">
                  <div className="cv-stack-row">
                    <span className="cv-stack-label">License</span>
                    <span className="cv-stack-check">✓</span>
                  </div>
                  <div className="cv-stack-title">Verified</div>
                  <div className="cv-stack-sub">Checked before fulfillment</div>
                </div>

                <div className="cv-stack-card c2">
                  <div className="cv-stack-row">
                    <span className="cv-stack-label">Payment</span>
                    <span className="cv-stack-check">✓</span>
                  </div>
                  <div className="cv-stack-title">Encrypted</div>
                  <div className="cv-stack-sub">Handled by our processor</div>
                </div>

                <div className="cv-stack-card c3">
                  <div className="cv-stack-row">
                    <span className="cv-stack-label">Delivery</span>
                    <span className="cv-stack-check">✓</span>
                  </div>
                  <div className="cv-stack-title">Instant</div>
                  <div className="cv-stack-sub">Access issued on payment</div>
                  <div className="cv-stack-bar"><div className="cv-stack-bar-fill" /></div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* MARQUEE TRUST STRIP */}
        <section className="cv-marquee">
          <div className="cv-marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span className="cv-marquee-item" key={`${item.label}-${i}`}>
                <span className="cv-marquee-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {item.icon}
                  </svg>
                </span>
                {item.label}
              </span>
            ))}
          </div>
        </section>

        {/* HIT PRODUCTS OF THE WEEK — podium of exactly 3 */}
        {!loading && weeklyHits.length > 0 && (
          <section className="cv-section cv-hits-section" id="hits">
            <div className="cv-shell">

              <Reveal className="cv-section-heading">
                <div className="cv-section-heading-text">
                  <div className="cv-section-label">✦ Hit products of the week</div>
                  <h2>This week's top 3</h2>
                  <p>Ranked by what buyers are actually choosing right now.</p>
                </div>
              </Reveal>

              <Reveal>
                <div className="cv-hits-podium">
                  {weeklyHits[1] && <HitCard product={weeklyHits[1]} rank={2} />}
                  {weeklyHits[0] && <HitCard product={weeklyHits[0]} rank={1} />}
                  {weeklyHits[2] && <HitCard product={weeklyHits[2]} rank={3} />}
                </div>
              </Reveal>

            </div>
          </section>
        )}

        {/* CATALOG — filterable by category */}
        <section className="cv-section" id="catalog" style={{ paddingTop: 0 }}>
          <div className="cv-shell">

            <Reveal className="cv-section-heading">
              <div className="cv-section-heading-text">
                <div className="cv-section-label">✦ Full catalog</div>
                <h2>Browse by category</h2>
                <p>Filter down to exactly the kind of tool you're after.</p>
              </div>
            </Reveal>

            {loading ? (
              <div className="cv-loading">
                <div className="cv-loader"><span /><span /><span /></div>
                Loading products…
              </div>
            ) : products.length === 0 ? (
              <div className="cv-loading">No products available right now.</div>
            ) : (
              <>
                <Reveal>
                  <div className="cv-category-rail" role="tablist" aria-label="Product categories">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        role="tab"
                        aria-selected={activeCategory === cat.name}
                        data-active={activeCategory === cat.name}
                        className="cv-category-pill"
                        onClick={() => setActiveCategory(cat.name)}
                      >
                        {cat.name}
                        <span className="cv-category-pill-count">{cat.count}</span>
                      </button>
                    ))}
                  </div>
                </Reveal>

                {filteredProducts.length === 0 ? (
                  <div className="cv-loading cv-empty-state">No products in this category yet.</div>
                ) : (
                  <div className="cv-grid">
                    {filteredProducts.map((product, i) => (
                      <Reveal key={product.id} delay={(i % 4) * 60}>
                        <ProductCard product={product} />
                      </Reveal>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        </section>

        {/* WHY US */}
        <section className="cv-section" id="why-us" style={{ paddingTop: 0 }}>
          <div className="cv-shell">
            <Reveal className="cv-section-heading">
              <div className="cv-section-heading-text">
                <div className="cv-section-label">✦ Why shop with us</div>
                <h2>Built to be checked, not just trusted</h2>
                <p>The parts of buying software online that usually feel risky, made visible instead.</p>
              </div>
            </Reveal>

            <div className="cv-value-grid">
              {valueProps.map((v, i) => (
                <Reveal key={v.title} delay={i * 90}>
                  <div className="cv-value-card">
                    <span className="cv-value-icon">{v.icon}</span>
                    <h3>{v.title}</h3>
                    <p>{v.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* SECURITY / GUARANTEE */}
        <section className="cv-section" id="security" style={{ paddingTop: 0 }}>
          <div className="cv-shell">
            <Reveal>
              <div className="cv-security">
                <div>
                  <div className="cv-security-label">◆ Checkout &amp; guarantees</div>
                  <h2>Nothing about your order is a black box.</h2>
                  <p>
                    From the moment you pay to the moment your product lands,
                    every step follows the same checked process — outlined
                    here rather than buried in a terms page.
                  </p>
                </div>

                <div className="cv-security-checks">
                  {securityChecks.map((c) => (
                    <div className="cv-security-check" key={c.title}>
                      <span className="cv-security-check-icon">✓</span>
                      <div>
                        <strong>{c.title}</strong>
                        <span>{c.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="cv-section" id="reviews" style={{ paddingTop: 0 }}>
          <div className="cv-shell">
            <Reveal className="cv-section-heading">
              <div className="cv-section-heading-text">
                <div className="cv-section-label">✦ Customer feedback</div>
                <h2>Trusted by our buyers</h2>
                <p>What customers say after purchasing from our store.</p>
              </div>
            </Reveal>

            <div className="cv-review-grid">
              {reviews.map((review, i) => (
                <Reveal key={review.name} delay={i * 90}>
                  <div className="cv-review">
                    <div className="cv-stars">★★★★★</div>
                    <p className="cv-review-text">"{review.text}"</p>
                    <div className="cv-review-user">
                      <div className="cv-review-avatar">{review.initials}</div>
                      <div>
                        <strong>{review.name}</strong>
                        <span>{review.time}</span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="cv-section" id="faq" style={{ paddingTop: 0 }}>
          <div className="cv-shell">
            <Reveal className="cv-section-heading">
              <div className="cv-section-heading-text">
                <div className="cv-section-label">✦ Questions</div>
                <h2>Frequently asked</h2>
                <p>The essentials before you check out.</p>
              </div>
            </Reveal>

            <Reveal>
              <FaqAccordion items={faqItems} />
            </Reveal>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="cv-section" style={{ paddingTop: 0, paddingBottom: 40 }}>
          <div className="cv-shell">
            <Reveal>
              <div className="cv-bottom-cta-inner">
                <div className="cv-aurora-field">
                  <span className="cv-aurora-blob b1" />
                  <span className="cv-aurora-blob b2" />
                </div>
                <h2>Find your next digital upgrade.</h2>
                <p>Browse our latest products and get instant access.</p>
                <a href="#catalog" className="cv-btn-primary">Browse products →</a>
              </div>
            </Reveal>
          </div>
        </section>

      </main>
    </>
  );
};

export default HomePage;