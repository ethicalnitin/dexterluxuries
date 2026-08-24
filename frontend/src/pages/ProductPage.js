import React, { useState, useEffect, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Countdown from "react-countdown";
import { useParams, useNavigate } from "react-router-dom";

// ── Price formatting helper ───────────────────────────────────────────────────
// Prices come from the backend in USD. We display the real value — no fake
// pricing, no currency conversion.
function formatUSD(amount) {
  if (amount === null || amount === undefined || amount === "") return null;
  const n = Number(amount);
  if (Number.isNaN(n)) return null;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Turns a plan's `durationInMonths` into the label shown on its card.
// null / 0 / undefined means "lifetime" per the model's own comment.
function formatPlanDuration(plan) {
  if (plan.name) return plan.name;
  if (!plan.durationInMonths) return "Lifetime";
  return plan.durationInMonths === 1 ? "1 Month" : `${plan.durationInMonths} Months`;
}

// A plan is treated as in-stock unless it explicitly says otherwise —
// matches the schema's `available: { default: true }`.
function isPlanAvailable(plan) {
  return plan?.available !== false;
}
// ─────────────────────────────────────────────────────────────────────────────

/* ============================================================
   DESIGN SYSTEM — shared with the homepage
   Same tokens (ink / glass / aurora gradient), same Bricolage
   Grotesque + Inter + JetBrains Mono pairing. Motion is
   restrained on purpose: the aurora accent is reserved for the
   primary action and a few structural badges, not looping on
   every element — that read as a hard-sell dropship template
   rather than a store people trust with a card number.
============================================================ */

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    --cv-ink: #07070F;
    --cv-ink-2: #0B0B18;
    --cv-ink-3: #111119;
    --cv-ink-4: #181822;
    --cv-glass: rgba(255,255,255,0.045);
    --cv-glass-hi: rgba(255,255,255,0.08);
    --cv-border: rgba(255,255,255,0.10);
    --cv-border-strong: rgba(255,255,255,0.22);
    --cv-text: #F6F7FB;
    --cv-muted: #A6ACC0;
    --cv-faint: #686E82;
    --cv-violet: #8B5CF6;
    --cv-pink: #FF63B0;
    --cv-cyan: #37E6C9;
    --cv-aurora: linear-gradient(92deg, var(--cv-violet) 0%, var(--cv-pink) 48%, var(--cv-cyan) 100%);
  }

  * { box-sizing: border-box; }

  .pp-root {
    position: relative;
    background: var(--cv-ink);
    color: var(--cv-text);
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    padding-top: 88px;
    overflow-x: clip;
    isolation: isolate;
  }

  .pp-root ::selection { background: rgba(139,92,246,.35); color: #fff; }

  /* ---------- Ambient background — quiet, non-looping ---------- */
  .pp-aurora-field { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
  .pp-aurora-blob { position: absolute; border-radius: 50%; filter: blur(100px); opacity: .22; }
  .pp-aurora-blob.b1 { width: 520px; height: 520px; left: -160px; top: -180px; background: radial-gradient(circle, var(--cv-violet), transparent 70%); }
  .pp-aurora-blob.b2 { width: 460px; height: 460px; right: -140px; top: 300px; background: radial-gradient(circle, var(--cv-cyan), transparent 70%); opacity: .14; }

  .pp-grain {
    position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: .03; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .pp-loading {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 80vh; gap: 20px;
    color: var(--cv-muted); font-size: 14px; font-weight: 400;
    font-family: 'JetBrains Mono', monospace; letter-spacing: .3px;
  }
  .pp-loading-dots { display: flex; gap: 8px; }
  .pp-loading-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cv-violet); animation: dotBounce 1.2s infinite; }
  .pp-loading-dot:nth-child(2) { animation-delay: .15s; background: var(--cv-pink); }
  .pp-loading-dot:nth-child(3) { animation-delay: .3s; background: var(--cv-cyan); }
  @keyframes dotBounce { 0%,80%,100% { transform: translateY(0); opacity: .35; } 40% { transform: translateY(-7px); opacity: 1; } }

  .pp-error {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 80vh; gap: 16px; text-align: center; padding: 24px;
  }
  .pp-error-icon { font-size: 36px; color: var(--cv-faint); }
  .pp-error p { font-size: 15px; color: var(--cv-muted); font-weight: 400; max-width: 400px; }

  .pp-shell-grid {
    position: relative; z-index: 2;
    max-width: 1180px; margin: 0 auto; padding: 48px 32px 80px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start;
  }

  .pp-image-col { position: sticky; top: 100px; }

  .pp-image-wrap {
    position: relative; border: 1px solid var(--cv-border); border-radius: 16px;
    overflow: hidden; background: var(--cv-ink-2);
  }
  .pp-product-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }

  .pp-discount-badge {
    position: absolute; top: 14px; left: 14px;
    background: var(--cv-ink); border: 1px solid var(--cv-border-strong);
    color: var(--cv-text);
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
    padding: 6px 12px; border-radius: 7px; z-index: 2;
  }
  .pp-discount-badge strong { color: var(--cv-cyan); font-weight: 700; }

  .pp-trust-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
  .pp-trust-pill {
    display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center;
    background: var(--cv-glass); border: 1px solid var(--cv-border); border-radius: 12px;
    padding: 14px 6px; font-size: 10.5px; font-weight: 500; color: var(--cv-muted); letter-spacing: .1px;
  }
  .pp-trust-icon {
    width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
    background: rgba(255,255,255,.05); border: 1px solid var(--cv-border);
    color: var(--cv-cyan); display: flex; align-items: center; justify-content: center;
  }
  .pp-trust-icon svg { width: 13px; height: 13px; }

  .pp-detail-col { display: flex; flex-direction: column; gap: 0; }

  .pp-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--cv-faint); font-weight: 600; margin-bottom: 14px;
  }
  .pp-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cv-aurora); flex-shrink: 0; }

  .pp-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(1.9rem, 3.6vw, 2.6rem);
    font-weight: 700; letter-spacing: -1.2px; line-height: 1.1;
    margin-bottom: 26px; color: var(--cv-text);
  }

  .pp-countdown-card {
    position: relative; overflow: hidden;
    background: var(--cv-glass);
    border: 1px solid var(--cv-border);
    border-radius: 14px; padding: 18px 22px; margin-bottom: 26px;
  }
  .pp-countdown-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--cv-aurora);
  }
  .pp-countdown-label {
    display: flex; align-items: center; gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px; letter-spacing: 1.4px; text-transform: uppercase;
    color: var(--cv-muted); font-weight: 600; margin-bottom: 14px;
  }
  .pp-live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cv-pink); flex-shrink: 0; animation: liveDotFade 2.4s ease-in-out infinite; }
  @keyframes liveDotFade { 0%,100% { opacity: 1; } 50% { opacity: .4; } }

  .pp-countdown-display { display: flex; align-items: center; gap: 8px; }
  .pp-time-block {
    display: flex; flex-direction: column; align-items: center;
    background: var(--cv-ink-3);
    border: 1px solid var(--cv-border); border-radius: 10px; padding: 9px 15px; min-width: 58px;
  }
  .pp-time-num { font-family: 'JetBrains Mono', monospace; font-size: 1.55rem; font-weight: 700; color: var(--cv-text); line-height: 1; font-variant-numeric: tabular-nums; }
  .pp-time-label { font-family: 'JetBrains Mono', monospace; font-size: 8.5px; letter-spacing: 1.8px; text-transform: uppercase; color: var(--cv-faint); margin-top: 5px; font-weight: 500; }
  .pp-colon { font-family: 'JetBrains Mono', monospace; font-size: 1.3rem; color: var(--cv-faint); font-weight: 700; margin-bottom: 12px; }
  .pp-expired { font-size: 14px; color: var(--cv-pink); font-weight: 500; }

  .pp-pricing { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; flex-wrap: wrap; }
  .pp-price-current { font-family: 'JetBrains Mono', monospace; font-size: 2.1rem; font-weight: 600; color: var(--cv-text); line-height: 1; }
  .pp-price-strike { font-family: 'JetBrains Mono', monospace; font-size: 1rem; color: var(--cv-faint); text-decoration: line-through; font-weight: 400; }
  .pp-price-save {
    font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase;
    color: var(--cv-cyan); background: rgba(55,230,201,.1); border: 1px solid rgba(55,230,201,.25); padding: 4px 10px; border-radius: 6px;
  }

  /* ---------- Out of stock ---------- */
  .pp-outofstock-banner {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase;
    color: var(--cv-pink); background: rgba(255,99,176,.1); border: 1px solid rgba(255,99,176,.3);
    padding: 10px 16px; border-radius: 9px;
  }

  /* ---------- Plan selector ---------- */
  .pp-plans { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
  .pp-plan-label { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--cv-faint); font-weight: 600; margin-bottom: 4px; }
  .pp-plan-card {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    background: var(--cv-glass); border: 1px solid var(--cv-border); border-radius: 12px;
    padding: 15px 18px; cursor: pointer; transition: border-color .15s ease, background .15s ease;
    text-align: left; width: 100%; color: var(--cv-text); font-family: 'Inter', sans-serif;
  }
  .pp-plan-card:hover { border-color: var(--cv-border-strong); background: var(--cv-glass-hi); }
  .pp-plan-card--active { border-color: var(--cv-violet); background: rgba(139,92,246,.07); }
  .pp-plan-card--soldout { opacity: .5; cursor: not-allowed; }
  .pp-plan-card--soldout:hover { border-color: var(--cv-border); background: var(--cv-glass); }
  .pp-plan-radio { width: 17px; height: 17px; border-radius: 50%; border: 1.5px solid var(--cv-border-strong); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: border-color .15s; }
  .pp-plan-card--active .pp-plan-radio { border-color: var(--cv-violet); }
  .pp-plan-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--cv-violet); transform: scale(0); transition: transform .15s; }
  .pp-plan-card--active .pp-plan-radio-dot { transform: scale(1); }
  .pp-plan-main { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
  .pp-plan-duration { font-family: 'Bricolage Grotesque', sans-serif; font-size: 14.5px; font-weight: 600; }
  .pp-plan-badge {
    font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase;
    color: var(--cv-ink); background: var(--cv-aurora); padding: 3px 8px; border-radius: 5px; flex-shrink: 0;
  }
  .pp-plan-badge--soldout { background: var(--cv-pink); color: #fff; }
  .pp-plan-price-col { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
  .pp-plan-price { font-family: 'JetBrains Mono', monospace; font-size: 14.5px; font-weight: 600; color: var(--cv-text); }
  .pp-plan-price-strike { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--cv-faint); text-decoration: line-through; font-weight: 400; }

  .pp-buy-btn {
    display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%;
    background: var(--cv-aurora); background-size: 160% auto; background-position: 0% center;
    color: var(--cv-ink); font-size: 15px; font-weight: 700; letter-spacing: .1px;
    padding: 17px 32px; border: none; border-radius: 12px; cursor: pointer;
    transition: transform .2s ease, box-shadow .2s ease, background-position .35s ease;
    font-family: 'Inter', sans-serif; box-shadow: 0 10px 26px rgba(139,92,246,.22); margin-bottom: 10px;
  }
  .pp-buy-btn:hover { transform: translateY(-1px); background-position: 100% center; box-shadow: 0 14px 32px rgba(139,92,246,.3); }
  .pp-buy-btn:active { transform: translateY(0); }
  .pp-buy-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; box-shadow: none; background: var(--cv-ink-3); color: var(--cv-muted); }
  .pp-btn-arrow { font-size: 16px; transition: transform .2s; }
  .pp-buy-btn:hover .pp-btn-arrow { transform: translateX(3px); }

  .pp-proofs-link-row { display: flex; justify-content: center; margin-bottom: 22px; }
  .pp-proofs-link {
    display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer;
    color: var(--cv-cyan); font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
    padding: 4px 2px; border-bottom: 1px solid transparent; transition: border-color .15s ease;
  }
  .pp-proofs-link:hover { border-bottom-color: var(--cv-cyan); }

  .pp-cta-note { font-size: 12px; color: var(--cv-faint); text-align: center; font-weight: 400; margin-bottom: 34px; line-height: 1.6; }

  .pp-description { border-top: 1px solid var(--cv-border); padding-top: 32px; }
  .pp-desc-heading { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.15rem; font-weight: 700; letter-spacing: -.2px; margin-bottom: 16px; color: var(--cv-text); }

  .pp-desc-body { font-size: 14.5px; color: var(--cv-muted); line-height: 1.85; font-weight: 400; }
  .pp-desc-body * { color: inherit !important; background: transparent !important; font-family: 'Inter', sans-serif !important; max-width: 100%; }
  .pp-desc-body h1, .pp-desc-body h2, .pp-desc-body h3, .pp-desc-body h4, .pp-desc-body h5, .pp-desc-body h6 {
    font-family: 'Bricolage Grotesque', sans-serif !important; font-weight: 700 !important; font-size: 1.02rem !important;
    color: var(--cv-text) !important; margin: 22px 0 12px !important; line-height: 1.4 !important;
  }
  .pp-desc-body h1:first-child, .pp-desc-body h2:first-child, .pp-desc-body h3:first-child, .pp-desc-body h4:first-child { margin-top: 0 !important; }
  .pp-desc-body p { margin: 0 0 14px !important; font-size: 14.5px !important; font-weight: 400 !important; }
  .pp-desc-body p:last-child { margin-bottom: 0 !important; }
  .pp-desc-body ul, .pp-desc-body ol { padding-left: 0 !important; list-style: none !important; margin: 0 0 16px !important; }
  .pp-desc-body li { padding: 7px 0 !important; border-bottom: 1px solid var(--cv-border) !important; display: flex !important; gap: 10px !important; font-size: 14.5px !important; font-weight: 400 !important; }
  .pp-desc-body li::before { content: '—' !important; color: var(--cv-faint) !important; flex-shrink: 0 !important; }
  .pp-desc-body li:last-child { border-bottom: none !important; }
  .pp-desc-body strong, .pp-desc-body b { color: var(--cv-text) !important; font-weight: 600 !important; }
  .pp-desc-body em, .pp-desc-body i { font-style: italic !important; }
  .pp-desc-body a { color: var(--cv-cyan) !important; text-decoration: underline !important; }
  .pp-desc-body img { max-width: 100% !important; height: auto !important; border: 1px solid var(--cv-border) !important; border-radius: 10px !important; margin: 12px 0 !important; display: block !important; }
  .pp-desc-body table { width: 100% !important; border-collapse: collapse !important; margin: 12px 0 20px !important; font-size: 13.5px !important; }
  .pp-desc-body th, .pp-desc-body td { border: 1px solid var(--cv-border) !important; padding: 8px 10px !important; text-align: left !important; }
  .pp-desc-body th { color: var(--cv-cyan) !important; font-weight: 600 !important; text-transform: uppercase !important; font-size: 11px !important; letter-spacing: .5px !important; font-family: 'JetBrains Mono', monospace !important; }
  .pp-desc-body blockquote { border-left: 2px solid var(--cv-violet) !important; padding: 4px 0 4px 16px !important; margin: 16px 0 !important; font-style: italic !important; color: var(--cv-muted) !important; }
  .pp-desc-body code { font-family: 'JetBrains Mono', monospace !important; background: var(--cv-ink-3) !important; padding: 2px 6px !important; border-radius: 4px !important; font-size: 13px !important; color: var(--cv-cyan) !important; }
  .pp-desc-body hr { border: none !important; border-top: 1px solid var(--cv-border) !important; margin: 20px 0 !important; }

  .pp-desc-empty { font-size: 14px; color: var(--cv-faint); font-weight: 400; font-style: italic; }
  .pp-inline-error { font-size: 13px; color: var(--cv-pink); font-weight: 400; margin-top: 12px; }

  /* ---------- Shared section header ---------- */
  .pp-section { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; padding: 68px 32px; border-top: 1px solid var(--cv-border); }
  .pp-section-eyebrow {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--cv-faint); font-weight: 700; text-align: center; margin-bottom: 12px;
  }
  .pp-section-eyebrow::before, .pp-section-eyebrow::after { content: ''; width: 14px; height: 1px; background: var(--cv-border-strong); }
  .pp-section-title {
    font-family: 'Bricolage Grotesque', sans-serif; font-size: clamp(1.65rem, 3vw, 2.2rem);
    font-weight: 700; letter-spacing: -.8px; text-align: center; margin-bottom: 12px; color: var(--cv-text);
  }
  .pp-section-sub { font-size: 14.5px; color: var(--cv-muted); font-weight: 400; text-align: center; max-width: 520px; margin: 0 auto 44px; }

  /* ---------- Purchase process ---------- */
  .pp-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .pp-step {
    background: var(--cv-glass); border: 1px solid var(--cv-border); border-radius: 14px; padding: 24px 20px;
    transition: border-color .2s ease, background .2s ease;
  }
  .pp-step:hover { border-color: var(--cv-border-strong); background: var(--cv-glass-hi); }
  .pp-step-num {
    width: 30px; height: 30px; border-radius: 8px; background: var(--cv-ink-3); border: 1px solid var(--cv-border-strong); color: var(--cv-text);
    font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 13px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 15px;
  }
  .pp-step-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 8px; color: var(--cv-text); }
  .pp-step-desc { font-size: 13px; color: var(--cv-muted); line-height: 1.6; font-weight: 400; }

  /* ---------- Proofs gallery ---------- */
  .pp-proofs-header-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 8px; }
  .pp-proofs-toggle-btn {
    background: var(--cv-glass); border: 1px solid var(--cv-border); color: var(--cv-text);
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
    padding: 9px 18px; border-radius: 9px; cursor: pointer; transition: background .15s, border-color .15s;
  }
  .pp-proofs-toggle-btn:hover { background: var(--cv-glass-hi); border-color: var(--cv-border-strong); }
  .pp-proofs-hidden-note { text-align: center; font-size: 13.5px; color: var(--cv-faint); font-weight: 400; padding: 24px 0 4px; }
  .pp-proofs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
  .pp-proof-thumb { position: relative; aspect-ratio: 9/16; border-radius: 10px; overflow: hidden; border: 1px solid var(--cv-border); cursor: pointer; background: var(--cv-ink-3); }
  .pp-proof-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s ease; }
  .pp-proof-thumb:hover img { transform: scale(1.04); }
  .pp-proof-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(7,7,15,.55), transparent 55%); display: flex; align-items: flex-end; padding: 8px 10px; opacity: 0; transition: opacity .2s; }
  .pp-proof-thumb:hover .pp-proof-overlay { opacity: 1; }
  .pp-proof-overlay span { font-size: 10px; color: var(--cv-text); font-weight: 500; }
  .pp-proofs-more { text-align: center; margin-top: 22px; }
  .pp-proofs-more button {
    background: var(--cv-glass); border: 1px solid var(--cv-border); color: var(--cv-text);
    font-size: 13px; font-weight: 600; padding: 11px 22px; border-radius: 10px; cursor: pointer; transition: background .15s, border-color .15s;
  }
  .pp-proofs-more button:hover { background: var(--cv-glass-hi); border-color: var(--cv-border-strong); }

  .pp-lightbox { position: fixed; inset: 0; z-index: 2000; background: rgba(7,7,15,.92); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
  .pp-lightbox-img { max-height: 86vh; max-width: 92vw; border-radius: 12px; border: 1px solid var(--cv-border); object-fit: contain; }
  .pp-lightbox-close, .pp-lightbox-nav {
    position: absolute; background: var(--cv-glass); border: 1px solid var(--cv-border-strong); color: var(--cv-text);
    width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 17px; transition: background .15s;
  }
  .pp-lightbox-close:hover, .pp-lightbox-nav:hover { background: var(--cv-glass-hi); }
  .pp-lightbox-close { top: 24px; right: 24px; }
  .pp-lightbox-nav--prev { left: 24px; top: 50%; transform: translateY(-50%); }
  .pp-lightbox-nav--next { right: 24px; top: 50%; transform: translateY(-50%); }
  .pp-lightbox-count { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--cv-muted); }

  /* ---------- Sticky Buy Now bar ---------- */
  .pp-sticky-buybar {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 1800;
    background: rgba(11,11,24,.9); backdrop-filter: blur(14px);
    border-top: 1px solid var(--cv-border); padding: 14px 20px;
    padding-bottom: max(14px, env(safe-area-inset-bottom));
    display: flex; align-items: center; gap: 16px;
  }
  .pp-sticky-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .pp-sticky-name { font-size: 12.5px; color: var(--cv-muted); font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pp-sticky-price { font-family: 'JetBrains Mono', monospace; font-size: 16.5px; font-weight: 600; color: var(--cv-text); white-space: nowrap; }
  .pp-sticky-price-strike { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: var(--cv-faint); text-decoration: line-through; font-weight: 400; margin-right: 6px; }
  .pp-sticky-timer { display: flex; align-items: center; gap: 6px; background: var(--cv-glass); border: 1px solid var(--cv-border); border-radius: 9px; padding: 8px 12px; flex-shrink: 0; white-space: nowrap; }
  .pp-sticky-timer-value { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; letter-spacing: .3px; color: var(--cv-text); font-variant-numeric: tabular-nums; }
  .pp-sticky-timer-expired { font-size: 12px; font-weight: 600; color: var(--cv-pink); white-space: nowrap; }
  .pp-sticky-buy-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: var(--cv-aurora); color: var(--cv-ink); font-size: 14px; font-weight: 700; letter-spacing: .1px;
    padding: 12px 22px; border: none; border-radius: 10px; cursor: pointer; white-space: nowrap; flex-shrink: 0;
    font-family: 'Inter', sans-serif; transition: transform .15s ease;
  }
  .pp-sticky-buy-btn:hover { transform: translateY(-1px); }
  .pp-sticky-buy-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }

  /* ---------- FAQ ---------- */
  .pp-faq { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
  .pp-faq-item { background: var(--cv-glass); border: 1px solid var(--cv-border); border-radius: 12px; overflow: hidden; transition: border-color .15s ease; }
  .pp-faq-item--open { border-color: var(--cv-border-strong); }
  .pp-faq-q {
    width: 100%; text-align: left; background: none; border: none; color: var(--cv-text);
    font-size: 14.5px; font-weight: 600; font-family: 'Inter', sans-serif; padding: 18px 20px; cursor: pointer;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .pp-faq-q-icon {
    width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
    background: var(--cv-ink-3); color: var(--cv-muted);
    display: flex; align-items: center; justify-content: center; font-size: 13px;
    transition: transform .25s ease;
  }
  .pp-faq-q-icon--open { transform: rotate(45deg); }
  .pp-faq-a { max-height: 0; overflow: hidden; transition: max-height .3s ease, padding .3s ease; padding: 0 20px; }
  .pp-faq-a--open { max-height: 240px; padding: 0 20px 18px; }
  .pp-faq-a p { font-size: 13.5px; color: var(--cv-muted); line-height: 1.7; font-weight: 400; }

  /* ---------- Reviews ---------- */
  .pp-reviews { position: relative; z-index: 2; background: var(--cv-ink-2); border-top: 1px solid var(--cv-border); padding: 76px 32px 86px; }
  .pp-reviews-inner { max-width: 860px; margin: 0 auto; }
  .pp-review-card {
    background: var(--cv-glass); border: 1px solid var(--cv-border); border-radius: 16px;
    padding: 40px 42px 34px; margin: 0 12px;
  }
  .pp-review-stars { color: var(--cv-cyan); font-size: 14px; letter-spacing: 3px; margin-bottom: 16px; }
  .pp-review-text { font-size: clamp(.98rem, 1.9vw, 1.08rem); color: var(--cv-text); font-weight: 400; line-height: 1.75; margin-bottom: 22px; }
  .pp-review-name { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 1.2px; text-transform: uppercase; color: var(--cv-faint); font-weight: 600; }
  .pp-review-name span { color: var(--cv-muted); }

  .pp-reviews .slick-dots li button:before { color: var(--cv-violet) !important; opacity: .3; font-size: 8px; }
  .pp-reviews .slick-dots li.slick-active button:before { opacity: 1; color: var(--cv-cyan) !important; }

  /* ---------- Email capture modal ---------- */
  .pp-email-modal-overlay {
    position: fixed; inset: 0; z-index: 2500; background: rgba(7,7,15,.75); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .pp-email-modal {
    width: 100%; max-width: 400px; background: var(--cv-ink-2); border: 1px solid var(--cv-border-strong);
    border-radius: 16px; padding: 32px 28px; position: relative;
  }
  .pp-email-modal-close {
    position: absolute; top: 16px; right: 16px; background: var(--cv-glass); border: 1px solid var(--cv-border);
    width: 30px; height: 30px; border-radius: 50%; color: var(--cv-text); display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; transition: background .15s;
  }
  .pp-email-modal-close:hover { background: var(--cv-glass-hi); }
  .pp-email-modal-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; color: var(--cv-text); }
  .pp-email-modal-sub { font-size: 13.5px; color: var(--cv-muted); margin-bottom: 22px; line-height: 1.6; }
  .pp-email-modal-input {
    width: 100%; background: var(--cv-ink-3); border: 1px solid var(--cv-border); border-radius: 10px;
    padding: 13px 16px; color: var(--cv-text); font-size: 14px; font-family: 'Inter', sans-serif; margin-bottom: 6px;
  }
  .pp-email-modal-input:focus { outline: none; border-color: var(--cv-violet); }
  .pp-email-modal-error { font-size: 12.5px; color: var(--cv-pink); margin: 4px 0 8px; }
  .pp-email-modal-submit {
    width: 100%; background: var(--cv-aurora); color: var(--cv-ink); font-weight: 700; font-size: 14.5px;
    padding: 14px; border: none; border-radius: 10px; cursor: pointer; margin-top: 10px; font-family: 'Inter', sans-serif;
    transition: transform .15s ease;
  }
  .pp-email-modal-submit:hover { transform: translateY(-1px); }

  /* ---------- Confetti ---------- */
  .pp-confetti-container { position: fixed; inset: 0; z-index: 3000; pointer-events: none; overflow: hidden; }
  .pp-confetti-piece {
    position: absolute; top: -20px; border-radius: 2px;
    animation-name: confettiFall; animation-timing-function: ease-in; animation-fill-mode: forwards; opacity: .95;
  }
  @keyframes confettiFall {
    0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
    100% { transform: translate(var(--drift), 110vh) rotate(540deg); opacity: 0; }
  }

  @media (max-width: 900px) {
    .pp-shell-grid { grid-template-columns: 1fr; gap: 40px; padding: 40px 24px 64px; }
    .pp-image-col { position: static; }
    .pp-steps { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 480px) {
    .pp-review-card { padding: 30px 22px 26px; margin: 0; }
    .pp-trust-row { grid-template-columns: repeat(2, 1fr); }
    .pp-time-block { min-width: 48px; padding: 8px 10px; }
    .pp-time-num { font-size: 1.2rem; }
    .pp-steps { grid-template-columns: 1fr; }
    .pp-section { padding: 52px 20px; }
    .pp-plan-main { gap: 8px; }
    .pp-plan-badge { display: none; }
    .pp-sticky-name { display: none; }
    .pp-sticky-buybar { padding: 12px 16px; padding-bottom: max(12px, env(safe-area-inset-bottom)); gap: 10px; }
    .pp-sticky-timer { padding: 7px 9px; }
    .pp-sticky-timer-value { font-size: 12px; }
    .pp-email-modal { padding: 28px 22px; }
  }
`;

const reviews = [
  { id: 1, name: "Amit Sharma",  city: "Delhi",     review: "Activated within 5 minutes. Premium access at this price is unreal. Everything works perfectly." },
  { id: 2, name: "Sneha Verma",  city: "Pune",      review: "Was skeptical at first, but the delivery was instant and everything works flawlessly. Saved so much money!" },
  { id: 3, name: "Rahul Mehta",  city: "Mumbai",    review: "Been using for 3 months straight without any issues. The support team responded in under 10 minutes when I had a question." },
  { id: 4, name: "Priya Das",    city: "Bangalore", review: "Best purchase I've made for my setup. Full premium access, no limits. Absolutely worth every rupee." },
];

// Purchase process — same 4 steps for every product on the store.
const purchaseSteps = [
  { title: "Choose your plan", desc: "Pick the duration or tier that fits you on this page." },
  { title: "Enter your email", desc: "Just your email — that's all we need to send access." },
  { title: "Complete payment", desc: "Pay via UPI, card, or netbanking — whatever's easiest for you." },
  { title: "Instant delivery", desc: "Access details land in your email / Telegram within minutes." },
];

// FAQ — generic questions that apply to every digital product on the store.
const faqItems = [
  { q: "How fast will I receive access after payment?", a: "Delivery is instant for most orders — you'll get access details by email and/or Telegram within a few minutes of successful payment." },
  { q: "What if something doesn't work?", a: "We offer a replacement guarantee. Message us on Telegram with your order ID and we'll fix or replace it, no questions asked." },
  { q: "Do you offer refunds?", a: "Refunds are handled per our Refund Policy, linked in the footer. Digital delivery issues are covered — reach out and we'll sort it quickly." },
  { q: "Is my payment secure?", a: "Yes — all payments are processed through an encrypted, PCI-compliant gateway. We never see or store your card details." },
];

// Trust-row items — clean SVG icons instead of emoji, matching the homepage's icon language.
const trustItems = [
  { label: "Fast delivery", icon: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /> },
  { label: "Secure payment", icon: <><path d="M5 10h14v10H5z" /><path d="M8 10V7a4 4 0 018 0v3" /></> },
  { label: "Single ownership", icon: <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" /> },
  { label: "Replacement guarantee", icon: <path d="M4 4v6h6M20 20v-6h-6M20 4l-7 7M4 20l7-7" /> },
];

/**
 * Proof-of-delivery / proof-of-results screenshots shown for every product.
 * DUMMY DATA: replace with `product.proofs` (an array of real screenshot
 * URLs) once the backend returns them per-product — the Product model does
 * not currently define a `proofs` field, so add one there first if you want
 * this to be per-product rather than store-wide. Falls back to placeholders
 * so the section always has content to show.
 */
const dummyProofImages = [
{ "id": 1, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469334/proofs/fmvjx8nf4m0qkytv1tm9.jpg", "label": "4965327411218590780.jpg" },
  { "id": 150, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469668/proofs/awdtfsw09onj47wtrw4s.jpg", "label": "IMG_20240921_015225_765.jpg" },
  { "id": 151, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469671/proofs/r8yjb9r8vsjf1qqpk0kx.jpg", "label": "IMG_20240921_015227_341.jpg" },
  { "id": 152, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469673/proofs/p9fcchhgnqdszjvv5zfd.jpg", "label": "Screenshot_2024-09-21-01-49-35-18_948cd9899890cbd5c2798760b2b95377.jpg" },
  { "id": 2, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469340/proofs/lapgci9ggunou3ooyo4b.jpg", "label": "4965327411218590781.jpg" },
  { "id": 3, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469344/proofs/dljlnvnndba4h3kp8j97.jpg", "label": "5010499051149437833.jpg" },
  { "id": 4, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469348/proofs/edowg2cntli4p13akpdh.jpg", "label": "5010499051149437834.jpg" },
  { "id": 5, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469351/proofs/rwsickhxkeew0cta2ags.jpg", "label": "5010499051149437835.jpg" },
  { "id": 6, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469354/proofs/aaaiyotd3xqajabx1udk.jpg", "label": "6066875063946303840.jpg" },
  { "id": 7, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469355/proofs/lfyo6h6p4hemnjm6v30z.jpg", "label": "6066875063946303841.jpg" },
  { "id": 8, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469357/proofs/dzgygxhpqeuifm0ys4xg.jpg", "label": "6066875063946303842.jpg" },
  { "id": 9, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469359/proofs/igqrahru8hy01x722qsz.jpg", "label": "6066875063946303845.jpg" },
  { "id": 10, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469361/proofs/okzo2goo1rdugpafgszn.jpg", "label": "6066875063946303846.jpg" },
  { "id": 11, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469363/proofs/beq1c5ory4btbv2zyve0.jpg", "label": "6066875063946303848.jpg" },
  { "id": 12, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469364/proofs/gc23wfcnjhml5fiupvuk.jpg", "label": "6066875063946303853.jpg" },
  { "id": 13, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469366/proofs/izhegzwyq8tdh3yxalis.jpg", "label": "6066875063946303854.jpg" },
  { "id": 14, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469368/proofs/vwg4rjt7masyuneeioky.jpg", "label": "6066875063946303858.jpg" },
  { "id": 15, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469370/proofs/orefau6fvz4gwo04tl6y.jpg", "label": "6066875063946303862.jpg" },
  { "id": 16, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469372/proofs/skrzjtyu6xu1sc9xeewx.jpg", "label": "6066875063946303863.jpg" },
  { "id": 17, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469374/proofs/py97wyo9qsk2mufyyxrs.jpg", "label": "6066875063946303864.jpg" },
  { "id": 18, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469375/proofs/wc0vzrwusvju5pssipcx.jpg", "label": "6066875063946303865.jpg" },
  { "id": 19, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469377/proofs/gryk4w9bccjas115bvvm.jpg", "label": "6087093317549536791.jpg" },
  { "id": 20, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469379/proofs/pi6rqm0lqbqbnxmt7aib.jpg", "label": "6087093317549536792.jpg" },
  { "id": 21, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469381/proofs/rnzjj1j5ykn9clkggrkh.jpg", "label": "6087093317549536793.jpg" },
  { "id": 22, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469384/proofs/xatg9sjvcfiqrycg9kbx.jpg", "label": "6087093317549536794.jpg" },
  { "id": 23, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469387/proofs/hgidhrhrgazpjtpafcdr.jpg", "label": "6087093317549536795.jpg" },
  { "id": 24, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469389/proofs/ogwcn2puovjrvb97d4sn.jpg", "label": "6087093317549536796.jpg" },
  { "id": 25, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469391/proofs/a0qya4binyo2k5go9puu.jpg", "label": "6087093317549536797.jpg" },
  { "id": 26, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469393/proofs/x6t3hhwpu3exycrwi99l.jpg", "label": "6095723483100199925.jpg" },
  { "id": 27, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469395/proofs/c8yabvlemb0nisx9xaat.jpg", "label": "6095723483100199926.jpg" },
  { "id": 28, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469397/proofs/knltyik56mbf9ockuakf.jpg", "label": "6095723483100199927.jpg" },
  { "id": 29, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469401/proofs/m6nxmorpy14dy15umjnr.jpg", "label": "6095723483100199928.jpg" },
  { "id": 30, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469407/proofs/qwhve5hjuxxbngrcw2he.jpg", "label": "6095723483100199929.jpg" },
  { "id": 31, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469409/proofs/umosdw5lm4rwlfaaszps.jpg", "label": "6095723483100199932.jpg" },
  { "id": 32, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469412/proofs/blekmsqt4xhdmrmrns4p.jpg", "label": "6095723483100199935.jpg" },
  { "id": 33, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469415/proofs/qfdvbql67mvbee1dx0jz.jpg", "label": "6095723483100199936.jpg" },
  { "id": 34, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469417/proofs/d2jnrrvsjqlspj2maryi.jpg", "label": "6095723483100199937.jpg" },
  { "id": 35, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469419/proofs/kw5tnszsmzxonvybdxn1.jpg", "label": "6102680325097372645.jpg" },
  { "id": 36, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469420/proofs/lvolb9mwthgztgqyzrag.jpg", "label": "6102680325097372646.jpg" },
  { "id": 37, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469422/proofs/ohg3cm7jhhlnpwb9f7fg.jpg", "label": "6102680325097372647.jpg" },
  { "id": 38, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469425/proofs/mcahbeds7dfjjokswubs.jpg", "label": "6248919615019266447.jpg" },
  { "id": 39, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469427/proofs/icoljyzxeillzmyvdewx.jpg", "label": "6248919615019266449.jpg" },
  { "id": 40, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469429/proofs/j2mnyt1reogty1i7cdwl.jpg", "label": "6253423214646636824.jpg" },
  { "id": 41, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469431/proofs/qi8iychdfh5s4gssi9r6.jpg", "label": "6253423214646636825.jpg" },
  { "id": 42, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469433/proofs/oybl2pksvjddf1e4vtii.jpg", "label": "6264694785084341909.jpg" },
  { "id": 43, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469437/proofs/fyrhljj4ndjwbki3wbm8.jpg", "label": "6276209583814981608.jpg" },
  { "id": 44, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469439/proofs/ibfheetux6blo1nghk9q.jpg", "label": "6276209583814981609 (1).jpg" },
  { "id": 45, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469442/proofs/mfoqp1r2wm05nlmjxycb.jpg", "label": "6276209583814981609.jpg" },
  { "id": 46, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469444/proofs/bwsd6pz9uxmrqdhq9hj3.jpg", "label": "6276209583814981610.jpg" },
  { "id": 47, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469447/proofs/cxmmodaga7vang7qgrlm.jpg", "label": "6276209583814981611.jpg" },
  { "id": 48, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469449/proofs/z5n8u81ljy83b8vm19v8.jpg", "label": "6276209583814981612.jpg" },
  { "id": 49, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469451/proofs/nuxa25e6ii9oh9vxdzss.jpg", "label": "IMG_20240829_032555_785.jpg" },
  { "id": 50, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469452/proofs/sur7job6tppdqpjreann.jpg", "label": "IMG_20240829_032610_415.jpg" },
  { "id": 51, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469454/proofs/xkwf3qhuhvhz4z8blh2p.jpg", "label": "IMG_20240829_032617_985.jpg" },
  { "id": 52, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469456/proofs/mi67lixidhhqphrfw0bo.jpg", "label": "IMG_20240829_032627_779.jpg" },
  { "id": 53, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469458/proofs/lbwrtqs5uhiojiunxsgj.jpg", "label": "IMG_20240829_032639_961.jpg" },
  { "id": 54, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469460/proofs/qfcfeolxhfquqdsnbnpq.jpg", "label": "IMG_20240829_032643_716.jpg" },
  { "id": 55, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469462/proofs/rtg47rvsvbgvxfyjwkne.jpg", "label": "IMG_20240829_032646_997.jpg" },
  { "id": 56, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469465/proofs/pa4qpounbu2p6dm3ruir.jpg", "label": "IMG_20240829_032650_209.jpg" },
  { "id": 57, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469466/proofs/lvpw797dyhavv3vlptb7.jpg", "label": "IMG_20240829_032657_219.jpg" },
  { "id": 58, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469468/proofs/xyrcryvu3d71cz2agyzo.jpg", "label": "IMG_20240829_032701_257.jpg" },
  { "id": 59, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469470/proofs/mcyur70fsebxuabznoe8.jpg", "label": "IMG_20240829_032704_854.jpg" },
  { "id": 60, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469473/proofs/oxrv0occaqjcmu7un5ih.jpg", "label": "IMG_20240829_032708_164.jpg" },
  { "id": 61, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469475/proofs/lma8hw7adrs454fwvjys.jpg", "label": "IMG_20240829_032715_213.jpg" },
  { "id": 62, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469477/proofs/qixa5mx2irmdoc2dkjeg.jpg", "label": "IMG_20240829_032725_315.jpg" },
  { "id": 63, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469479/proofs/lxlrdrdyjnomyc8vvdou.jpg", "label": "IMG_20240829_032729_506.jpg" },
  { "id": 64, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469481/proofs/nqpf7mc5ryacasbwfufh.jpg", "label": "IMG_20240829_032733_541.jpg" },
  { "id": 65, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469483/proofs/wrcbbfybnhoqiwvz2ydl.jpg", "label": "IMG_20240829_032744_498.jpg" },
  { "id": 66, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469485/proofs/j45wppbdko5fq6i4drwu.jpg", "label": "IMG_20240829_032748_020.jpg" },
  { "id": 67, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469487/proofs/se09cl1w6t3qiaeg29kp.jpg", "label": "IMG_20240829_032757_562.jpg" },
  { "id": 68, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469489/proofs/jmxjnc0epdly8gvkflzz.jpg", "label": "IMG_20240829_032804_641.jpg" },
  { "id": 69, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469491/proofs/g22hkr3s18o0m6idg7ck.jpg", "label": "IMG_20240829_032808_491.jpg" },
  { "id": 70, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469493/proofs/bfv0svn0lt8mwrvz9jul.jpg", "label": "IMG_20240829_032821_445.jpg" },
  { "id": 71, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469495/proofs/ypf4crmiyw8my3fsmhdu.jpg", "label": "IMG_20240829_032825_443.jpg" },
  { "id": 72, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469497/proofs/awplv8lk4zcjtasvtava.jpg", "label": "IMG_20240829_032837_071.jpg" },
  { "id": 73, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469499/proofs/ynolkpkcm3vigeygcrg1.jpg", "label": "IMG_20240829_032841_270.jpg" },
  { "id": 74, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469501/proofs/flbyxhjg6vf1e6u1eqq9.jpg", "label": "IMG_20240829_032843_640.jpg" },
  { "id": 75, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469503/proofs/z38g1srtec0k3bi46nnf.jpg", "label": "IMG_20240829_032847_082.jpg" },
  { "id": 76, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469505/proofs/fstpptva9xjmhbgmrzui.jpg", "label": "IMG_20240829_032850_981.jpg" },
  { "id": 77, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469508/proofs/rpokoj6k12272thesdai.jpg", "label": "IMG_20240829_032854_900.jpg" },
  { "id": 78, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469510/proofs/ygluc7qvqlnio3jnbk8w.jpg", "label": "IMG_20240829_032859_225.jpg" },
  { "id": 79, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469512/proofs/tr81r1zkgi8sc9opg09c.jpg", "label": "IMG_20240829_032902_829.jpg" },
  { "id": 80, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469514/proofs/xcjkj9tr29gyhccqneuk.jpg", "label": "IMG_20240829_032907_545.jpg" },
  { "id": 81, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469518/proofs/yoniue6g2its5bsp5gvo.jpg", "label": "IMG_20240829_032910_338.jpg" },
  { "id": 82, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469520/proofs/v3qkxgmwnlraio0venhr.jpg", "label": "IMG_20240829_032944_079.jpg" },
  { "id": 83, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469522/proofs/xbgn170zqzepqr1xpz5c.jpg", "label": "IMG_20240829_032947_814.jpg" },
  { "id": 84, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469525/proofs/mipgnvvjwvv362uvd1ww.jpg", "label": "IMG_20240829_032957_535.jpg" },
  { "id": 85, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469528/proofs/qkjzc1voomb0s6jshafd.jpg", "label": "IMG_20240829_033007_936.jpg" },
  { "id": 86, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469530/proofs/hlbbftio2cyhzyt7oxqi.jpg", "label": "IMG_20240829_033013_278.jpg" },
  { "id": 87, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469532/proofs/xzzdsqcprl8fd628bzyr.jpg", "label": "IMG_20240829_033036_547.jpg" },
  { "id": 88, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469535/proofs/jzcdrhgrkoxusrwoknc8.jpg", "label": "IMG_20240829_033040_147.jpg" },
  { "id": 89, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469538/proofs/sfswwdj1kvwncs6qqocz.jpg", "label": "IMG_20240829_033045_317.jpg" },
  { "id": 90, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469540/proofs/qpn5xbc56xg7l7ri5hpg.jpg", "label": "IMG_20240829_033051_252.jpg" },
  { "id": 91, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469542/proofs/wspsw9brtdckl41ulmdn.jpg", "label": "IMG_20240921_014757_873.jpg" },
  { "id": 92, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469544/proofs/xn8hus0rkim4wgrsoqm0.jpg", "label": "IMG_20240921_014759_230.jpg" },
  { "id": 93, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469547/proofs/koplkwqixjigcr8r8ldc.jpg", "label": "IMG_20240921_014759_965.jpg" },
  { "id": 94, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469548/proofs/dllziy4aret49kikegvh.jpg", "label": "IMG_20240921_014800_679.jpg" },
  { "id": 95, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469551/proofs/eb9ehtqduyqpz0ltkwi9.jpg", "label": "IMG_20240921_014801_814.jpg" },
  { "id": 96, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469552/proofs/rsbu3atosvx9dfvcvxno.jpg", "label": "IMG_20240921_014803_405.jpg" },
  { "id": 97, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469556/proofs/qff2h7ten1v0gncxojde.jpg", "label": "IMG_20240921_014803_886.jpg" },
  { "id": 98, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469558/proofs/yp5mqhihsfdlzzd7eibs.jpg", "label": "IMG_20240921_014805_874.jpg" },
  { "id": 99, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469560/proofs/bi439iyyfwbnsttj5kyc.jpg", "label": "IMG_20240921_014806_490.jpg" },
  { "id": 100, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469561/proofs/ch0wxoxj3caws5tnte2y.jpg", "label": "IMG_20240921_014807_239.jpg" },
  { "id": 101, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469562/proofs/ixm3x0hnjiqeqcdsnj4s.jpg", "label": "IMG_20240921_014808_621.jpg" },
  { "id": 102, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469565/proofs/jddzpxsfy54ovzmhpya2.jpg", "label": "IMG_20240921_014810_166.jpg" },
  { "id": 103, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469566/proofs/hewxm2xj33riwnmulf0f.jpg", "label": "IMG_20240921_014810_877.jpg" },
  { "id": 104, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469569/proofs/xkfqfsemfnajq4jlpozz.jpg", "label": "IMG_20240921_014811_603.jpg" },
  { "id": 105, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469570/proofs/da1spja4ihnrrsxekwtv.jpg", "label": "IMG_20240921_014813_979.jpg" },
  { "id": 106, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469572/proofs/xs49zch4h7jbbtgxuicm.jpg", "label": "IMG_20240921_014814_858.jpg" },
  { "id": 107, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469574/proofs/dp3h6nshtpzfb9qpag3u.jpg", "label": "IMG_20240921_014816_986.jpg" },
  { "id": 108, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469575/proofs/l3wbcszalmblvqi13jlj.jpg", "label": "IMG_20240921_014817_855.jpg" },
  { "id": 109, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469581/proofs/jwq9xxiw2tocavhqy2br.jpg", "label": "IMG_20240921_014818_951.jpg" },
  { "id": 110, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469582/proofs/o9o7donkctrapwxql3vs.jpg", "label": "IMG_20240921_014820_250.jpg" },
  { "id": 111, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469584/proofs/dwksjero6ffcpyk24fr1.jpg", "label": "IMG_20240921_014822_026.jpg" },
  { "id": 112, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469586/proofs/bhjstrolb5oyw6svxrxo.jpg", "label": "IMG_20240921_014822_409.jpg" },
  { "id": 113, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469587/proofs/ak8fz13een25a0liu8tj.jpg", "label": "IMG_20240921_014823_457.jpg" },
  { "id": 114, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469592/proofs/fzupt7a2xobxyi5x7o5z.jpg", "label": "IMG_20240921_014825_600.jpg" },
  { "id": 115, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469594/proofs/z9yt3vylzq6hyhyepvtp.jpg", "label": "IMG_20240921_014827_215.jpg" },
  { "id": 116, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469596/proofs/gmfvxohcbq3r94iy9hap.jpg", "label": "IMG_20240921_015129_109.jpg" },
  { "id": 117, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469599/proofs/agqmlnhomcprqshz39b5.jpg", "label": "IMG_20240921_015131_212.jpg" },
  { "id": 118, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469602/proofs/rrs4wgnpasjd5o8ddroc.jpg", "label": "IMG_20240921_015131_989.jpg" },
  { "id": 119, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469604/proofs/ulmthniyg5mwnk62losb.jpg", "label": "IMG_20240921_015133_615.jpg" },
  { "id": 120, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469606/proofs/h5bhrpkj1i4vpbba15ut.jpg", "label": "IMG_20240921_015135_076.jpg" },
  { "id": 121, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469608/proofs/rwaqwa1nhewg2amvsryd.jpg", "label": "IMG_20240921_015136_289.jpg" },
  { "id": 122, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469613/proofs/sndmk0c3mglpj8jaqsbw.jpg", "label": "IMG_20240921_015138_829.jpg" },
  { "id": 123, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469615/proofs/etrkrucnmqpgs2hyu3j9.jpg", "label": "IMG_20240921_015140_209.jpg" },
  { "id": 124, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469616/proofs/n069fx6bokusp02vwief.jpg", "label": "IMG_20240921_015141_402.jpg" },
  { "id": 125, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469618/proofs/adnqyd8xhnocexyvi3nz.jpg", "label": "IMG_20240921_015142_096.jpg" },
  { "id": 126, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469620/proofs/rmgo4vskq1srwmkpgwe4.jpg", "label": "IMG_20240921_015144_075.jpg" },
  { "id": 127, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469621/proofs/a9kvdtxg5ycsuixjtaaw.jpg", "label": "IMG_20240921_015145_716.jpg" },
  { "id": 128, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469623/proofs/voyfsisteribccfrkjxs.jpg", "label": "IMG_20240921_015149_108.jpg" },
  { "id": 129, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469624/proofs/xryptdz8uosxjkxuvp8h.jpg", "label": "IMG_20240921_015150_914.jpg" },
  { "id": 130, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469625/proofs/lyzth99bbaecfw15ss0z.jpg", "label": "IMG_20240921_015151_365.jpg" },
  { "id": 131, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469628/proofs/qfrqp0x9t8kfhw5ori3x.jpg", "label": "IMG_20240921_015153_505.jpg" },
  { "id": 132, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469630/proofs/eoryforijcytszzkjut9.jpg", "label": "IMG_20240921_015155_102.jpg" },
  { "id": 133, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469631/proofs/h1ljx3u6qrmhds58nwbg.jpg", "label": "IMG_20240921_015157_538.jpg" },
  { "id": 134, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469633/proofs/y0g4admi8ryjwn99p94u.jpg", "label": "IMG_20240921_015158_990.jpg" },
  { "id": 135, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469637/proofs/xkwtjh4g5fxzh0svk5lq.jpg", "label": "IMG_20240921_015200_281.jpg" },
  { "id": 136, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469638/proofs/w8wwvj7itfyuix3aj4wb.jpg", "label": "IMG_20240921_015201_771.jpg" },
  { "id": 137, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469640/proofs/wdbwajvkgdevu0wse6oe.jpg", "label": "IMG_20240921_015203_836.jpg" },
  { "id": 138, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469642/proofs/bfr6qge4ov4xniawgunh.jpg", "label": "IMG_20240921_015204_982.jpg" },
  { "id": 139, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469643/proofs/ypahf4ten9oah1qzywub.jpg", "label": "IMG_20240921_015206_341.jpg" },
  { "id": 140, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469647/proofs/in0k0saiveflrjng04op.jpg", "label": "IMG_20240921_015207_833.jpg" },
  { "id": 141, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469650/proofs/j98d8gy0kto29vdk0h4h.jpg", "label": "IMG_20240921_015209_121.jpg" },
  { "id": 142, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469652/proofs/lvsxs6swlwdrjb5sre5w.jpg", "label": "IMG_20240921_015210_421.jpg" },
  { "id": 143, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469654/proofs/ekj8zhq0yz8kxn0l2vjo.jpg", "label": "IMG_20240921_015212_135.jpg" },
  { "id": 144, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469656/proofs/lwupvqjq4uxc0bxg4e7e.jpg", "label": "IMG_20240921_015212_851.jpg" },
  { "id": 145, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469658/proofs/puvkn0dexa35bcypvaw4.jpg", "label": "IMG_20240921_015214_146.jpg" },
  { "id": 146, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469660/proofs/hszbfrovu4swu45dr93v.jpg", "label": "IMG_20240921_015215_188.jpg" },
  { "id": 147, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469661/proofs/gpmfkh8pppuqopl3wmgx.jpg", "label": "IMG_20240921_015217_651.jpg" },
  { "id": 148, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469664/proofs/xwjg7jqrptbsxekeou1r.jpg", "label": "IMG_20240921_015218_449.jpg" },
  { "id": 149, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469666/proofs/muxt6qmqofezvfkqifls.jpg", "label": "IMG_20240921_015219_844.jpg" },
  
];

// Kept below the dummy set's length on purpose — with only 12 dummy items and
// a preview count of 12, `proofImages.length > PROOFS_PREVIEW_COUNT` was
// always false, so the "show more" button never rendered. 8 leaves headroom
// for both the dummy set and real per-product data from the backend.
const PROOFS_PREVIEW_COUNT = 5;

const USD_TO_INR_RATE = 99;

function convertUsdToInr(usdAmount) {
  const n = Number(usdAmount);
  if (Number.isNaN(n)) return null;
  return Math.round(n * USD_TO_INR_RATE);
}

// Fires a lightweight, dependency-free confetti burst from the top of the
// viewport. Particles are plain <span> elements animated with the
// `confettiFall` keyframes defined above, and remove themselves once the
// animation finishes.
function fireConfetti() {
  const colors = ["#8B5CF6", "#FF63B0", "#37E6C9", "#F6F7FB"];
  const count = 70;

  const container = document.createElement("div");
  container.className = "pp-confetti-container";
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "pp-confetti-piece";

    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const duration = 2.2 + Math.random() * 1.6;
    const delay = Math.random() * 0.35;
    const width = 6 + Math.random() * 6;
    const height = width * (0.35 + Math.random() * 0.3);
    const rotate = Math.random() * 360;
    const drift = (Math.random() - 0.5) * 180;

    piece.style.left = `${left}vw`;
    piece.style.background = color;
    piece.style.width = `${width}px`;
    piece.style.height = `${height}px`;
    piece.style.animationDuration = `${duration}s`;
    piece.style.animationDelay = `${delay}s`;
    piece.style.transform = `rotate(${rotate}deg)`;
    piece.style.setProperty("--drift", `${drift}px`);

    container.appendChild(piece);
  }

  setTimeout(() => {
    container.remove();
  }, 4200);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ProductPage = () => {
  const navigate = useNavigate();

  const [product,   setProduct]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState("");
  const [showAllProofs, setShowAllProofs] = useState(false);
  const [proofsHidden, setProofsHidden] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  // Index into product.plans — plans are embedded sub-documents with
  // `{ _id: false }` in the schema, so there's no plan id to key off of.
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);

  const [showStickyBar, setShowStickyBar] = useState(false);

  // Email-only checkout: no OTP, no login — just collect an email right
  // before handing off to the payment page.
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");

  // Countdown target: midnight tonight (00:00 the next calendar day), computed
  // once via the lazy initializer so it stays fixed for the whole session
  // instead of drifting on every render/refresh. Same target for everyone on
  // a given day, and it naturally resets once the clock rolls past midnight.
  const [countdownEnd] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  });

  const { id } = useParams();
  const buyBtnAnchorRef = useRef(null);
  const proofsSectionRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setError("");
    setIsLoading(true);

    if (!id || !/^\d+$/.test(id)) {
      setError("Invalid product ID format. ID must be a number.");
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const apiBase = process.env.REACT_APP_API_BASE || "https://chartvault.shop/api";
        const response = await fetch(`${apiBase}/products/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch product");
        if (!Array.isArray(data.plans) || data.plans.length === 0) {
          throw new Error("This product has no pricing plans configured.");
        }
        setProduct(data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching the product.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Reset plan selection whenever a (new) product loads — default to the
  // first in-stock plan so shoppers don't land on a sold-out option.
  useEffect(() => {
    if (!product?.plans) return;
    const firstAvailableIdx = product.plans.findIndex(isPlanAvailable);
    setSelectedPlanIndex(firstAvailableIdx !== -1 ? firstAvailableIdx : 0);
  }, [product]);

  // Show a sticky Buy Now bar once the main buy button scrolls out of view,
  // so the CTA is always reachable no matter how far down the page the
  // person scrolls.
  useEffect(() => {
    if (!product || !buyBtnAnchorRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(buyBtnAnchorRef.current);
    return () => observer.disconnect();
  }, [product, isLoading]);

  // Focus the email field as soon as the modal opens.
  useEffect(() => {
    if (showEmailModal) {
      setEmailInput("");
      setEmailError("");
      setTimeout(() => emailInputRef.current?.focus(), 50);
    }
  }, [showEmailModal]);

  // ── Buy Now handler ───────────────────────────────────────────────────
  // No OTP, no login gate — clicking Buy Now just opens a small modal
  // asking for an email address, then hands off to the payment page.
  const handleBuyNowClick = () => {
    const plan = product?.plans?.[selectedPlanIndex];
    if (!product || !plan || typeof plan.price === "undefined") {
      alert("Error: Could not retrieve plan pricing. Please try again in a moment.");
      return;
    }
    if (!isPlanAvailable(plan)) {
      return; // button is disabled in this state, this is just a guard
    }
    setShowEmailModal(true);
  };

  // ── Email submit handler ──────────────────────────────────────────────
  // Validates the email, fires the confetti burst, then redirects to the
  // payment page with the plan + email in the route state. Wire up your
  // payment flow (checkout page, modal, gateway SDK, etc.) using this data
  // — `plan` carries name/durationInMonths/price/strikeThroughPrice.
  const handleEmailSubmit = (e) => {
    e.preventDefault();

    const trimmedEmail = emailInput.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    const plan = product.plans[selectedPlanIndex];
    const amountInINR = convertUsdToInr(plan.price);
    if (amountInINR === null) {
      setEmailError("Could not calculate the payment amount. Please try again.");
      return;
    }

    fireConfetti();
    setShowEmailModal(false);

    // Small delay so the confetti burst is visible before navigating away.
    setTimeout(() => {
      navigate("/payment", {
        state: {
          productId: product.id ?? product._id,
          productName: product.name,
          planName: formatPlanDuration(plan),
          amount: amountInINR,       // rupees — what PaymentPage.js's UPI flow expects
          amountUSD: plan.price,     // kept too, in case you want it for crypto display later
          email: trimmedEmail,
        },
      });
    }, 650);
  };

  // Compact renderer used for the countdown chip inside the sticky Buy Now
  // bar — same countdownEnd target as the main timer, just a smaller display
  // so it fits next to the price and button.
  const renderStickyCountdown = ({ hours, minutes, seconds, completed }) => {
    if (completed) return <span className="pp-sticky-timer-expired">Offer expired</span>;
    return (
      <span className="pp-sticky-timer">
        <span className="pp-sticky-timer-value">
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </span>
    );
  };

  // Smoothly scrolls to the proofs section. Un-hides it first if the user
  // had previously collapsed it, so they always land on visible content.
  const scrollToProofs = () => {
    setProofsHidden(false);
    requestAnimationFrame(() => {
      proofsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (isLoading) {
    return (
      <>
        <style>{style}</style>
        <div className="pp-root">
          <div className="pp-aurora-field">
            <span className="pp-aurora-blob b1" />
            <span className="pp-aurora-blob b2" />
          </div>
          <div className="pp-grain" />
          <div className="pp-loading">
            <div className="pp-loading-dots">
              <div className="pp-loading-dot" /><div className="pp-loading-dot" /><div className="pp-loading-dot" />
            </div>
            <p>Loading product details…</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <style>{style}</style>
        <div className="pp-root">
          <div className="pp-aurora-field">
            <span className="pp-aurora-blob b1" />
            <span className="pp-aurora-blob b2" />
          </div>
          <div className="pp-grain" />
          <div className="pp-error">
            <span className="pp-error-icon">⚠</span>
            <p>{error || "Product not found"}</p>
          </div>
        </div>
      </>
    );
  }

  // ── Real pricing, taken directly from the model's embedded plans ──────
  const plans = product.plans; // guaranteed non-empty by the fetch check above
  const isMultiPlan = plans.length > 1;
  const selectedPlan = plans[selectedPlanIndex] || plans[0];
  const isSelectedPlanAvailable = isPlanAvailable(selectedPlan);

  const displayPrice  = formatUSD(selectedPlan.price);
  const hasSelectedPlanStrike = Boolean(selectedPlan.strikeThroughPrice) && Number(selectedPlan.strikeThroughPrice) > Number(selectedPlan.price);
  const displayStrike = hasSelectedPlanStrike ? formatUSD(selectedPlan.strikeThroughPrice) : null;
  const discount = hasSelectedPlanStrike
    ? Math.round(((selectedPlan.strikeThroughPrice - selectedPlan.price) / selectedPlan.strikeThroughPrice) * 100)
    : 0;
  // ───────────────────────────────────────────────────────────────────────────

  // The sticky bottom bar always mirrors whatever plan is currently selected.
  const stickyPriceDisplay = displayPrice;
  const stickyStrikeDisplay = displayStrike;

  // Proofs: prefer real per-product data from the backend, fall back to dummy set.
  const proofImages = (product.proofs && product.proofs.length > 0) ? product.proofs : dummyProofImages;
  const visibleProofs = showAllProofs ? proofImages : proofImages.slice(0, PROOFS_PREVIEW_COUNT);
  const hasMoreProofs = proofImages.length > PROOFS_PREVIEW_COUNT;

  const carouselSettings = {
    dots: true, infinite: true, speed: 800,
    slidesToShow: 1, slidesToScroll: 1,
    autoplay: true, autoplaySpeed: 4000, arrows: false,
  };

  const openLightbox = (idx) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const showPrev = (e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + proofImages.length) % proofImages.length); };
  const showNext = (e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % proofImages.length); };

  return (
    <>
      <style>{style}</style>
      <div className="pp-root">

        <div className="pp-aurora-field">
          <span className="pp-aurora-blob b1" />
          <span className="pp-aurora-blob b2" />
        </div>
        <div className="pp-grain" />

        <div className="pp-shell-grid">

          <div className="pp-image-col">
            <div className="pp-image-wrap">
              {discount ? <span className="pp-discount-badge"><strong>{discount}%</strong> off</span> : null}
              <img src={product.image} alt={product.name} className="pp-product-img" />
            </div>
            <div className="pp-trust-row">
              {trustItems.map(t => (
                <span key={t.label} className="pp-trust-pill">
                  <span className="pp-trust-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {t.icon}
                    </svg>
                  </span>
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          <div className="pp-detail-col">
            <span className="pp-eyebrow">
              <span className="pp-eyebrow-dot" />
              {product.brand ? `${product.brand} · Digital Product` : "Digital Product · Premium"}
            </span>
            <h1 className="pp-title">{product.name}</h1>

            <div className="pp-countdown-card">
              <p className="pp-countdown-label"><span className="pp-live-dot" />Offer ends in</p>
              <Countdown
                date={countdownEnd}
                renderer={({ hours, minutes, seconds, completed }) => {
                  if (completed) return <span className="pp-expired">Offer expired</span>;
                  return (
                    <div className="pp-countdown-display">
                      {[{ val: hours, label: "HRS" }, { val: minutes, label: "MIN" }, { val: seconds, label: "SEC" }].map(({ val, label }, i) => (
                        <React.Fragment key={label}>
                          {i > 0 && <span className="pp-colon">:</span>}
                          <div className="pp-time-block">
                            <span className="pp-time-num">{String(val).padStart(2, "0")}</span>
                            <span className="pp-time-label">{label}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  );
                }}
              />
            </div>

            {/* Single-plan products show one price up top (or an out-of-stock
                banner if that plan isn't available). Multi-plan products show
                price per-card in the plan list instead. */}
            {!isMultiPlan && (
              <div className="pp-pricing">
                {isSelectedPlanAvailable ? (
                  <>
                    <span className="pp-price-current">{displayPrice}</span>
                    {displayStrike && <span className="pp-price-strike">{displayStrike}</span>}
                    {discount ? <span className="pp-price-save">Save {discount}%</span> : null}
                  </>
                ) : (
                  <span className="pp-outofstock-banner">Out of stock</span>
                )}
              </div>
            )}

            {/* This ref marks where the "main" buy button lives. Once it scrolls
                out of view, the sticky bottom bar takes over as the CTA. */}
            <div ref={buyBtnAnchorRef}>
              {isMultiPlan && (
                <div className="pp-plans">
                  <span className="pp-plan-label">Choose your plan</span>
                  {plans.map((plan, idx) => {
                    const isActive = selectedPlanIndex === idx;
                    const planAvailable = isPlanAvailable(plan);
                    const hasStrike = Boolean(plan.strikeThroughPrice) && Number(plan.strikeThroughPrice) > Number(plan.price);
                    return (
                      <button
                        key={`${plan.name}-${idx}`}
                        type="button"
                        className={`pp-plan-card ${isActive ? "pp-plan-card--active" : ""} ${!planAvailable ? "pp-plan-card--soldout" : ""}`}
                        onClick={() => planAvailable && setSelectedPlanIndex(idx)}
                        disabled={!planAvailable}
                      >
                        <span className="pp-plan-main">
                          <span className="pp-plan-radio"><span className="pp-plan-radio-dot" /></span>
                          <span className="pp-plan-duration">{formatPlanDuration(plan)}</span>
                          {!planAvailable ? (
                            <span className="pp-plan-badge pp-plan-badge--soldout">Out of stock</span>
                          ) : idx === plans.length - 1 ? (
                            <span className="pp-plan-badge">Best value</span>
                          ) : null}
                        </span>
                        <span className="pp-plan-price-col">
                          {hasStrike && (
                            <span className="pp-plan-price-strike">{formatUSD(plan.strikeThroughPrice)}</span>
                          )}
                          <span className="pp-plan-price">{formatUSD(plan.price)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <button className="pp-buy-btn" onClick={handleBuyNowClick} disabled={!isSelectedPlanAvailable}>
                {isSelectedPlanAvailable ? (
                  <>Buy now — {displayPrice} <span className="pp-btn-arrow">→</span></>
                ) : (
                  "Out of stock"
                )}
              </button>
            </div>

            <div className="pp-proofs-link-row">
              <button type="button" className="pp-proofs-link" onClick={scrollToProofs}>
                View delivery proof <span aria-hidden="true">↓</span>
              </button>
            </div>

            <p className="pp-cta-note">
              Just enter your email to continue — no account or verification needed. Instant delivery after payment.
            </p>

            <div className="pp-description">
              <h3 className="pp-desc-heading">What's included</h3>
              {product.description ? (
                <div
                  className="pp-desc-body"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="pp-desc-empty">No description available for this product yet.</p>
              )}
            </div>

            {error && <p className="pp-inline-error">{error}</p>}
          </div>
        </div>

        {/* ---------- Purchase process ---------- */}
        <section className="pp-section">
          <p className="pp-section-eyebrow">How it works</p>
          <h2 className="pp-section-title">From click to access, in minutes</h2>
          <p className="pp-section-sub">No manual approval, no waiting on hold — the entire process is built to be fast and self-serve.</p>
          <div className="pp-steps">
            {purchaseSteps.map((s, i) => (
              <div className="pp-step" key={s.title}>
                <div className="pp-step-num">{i + 1}</div>
                <div className="pp-step-title">{s.title}</div>
                <div className="pp-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Proofs gallery ---------- */}
        <section className="pp-section" ref={proofsSectionRef}>
          <p className="pp-section-eyebrow">Proof, not promises</p>
          <h2 className="pp-section-title">Real orders, real deliveries</h2>
          <p className="pp-section-sub">A sample of confirmation screenshots from past buyers of this product. Tap any image to view it larger.</p>

          <div className="pp-proofs-header-row">
            <button
              type="button"
              className="pp-proofs-toggle-btn"
              onClick={() => setProofsHidden(h => !h)}
            >
              {proofsHidden ? "Show proofs" : "Hide proofs"}
            </button>
          </div>

          {proofsHidden ? (
            <p className="pp-proofs-hidden-note">Proofs section hidden — click "Show proofs" above to view them.</p>
          ) : (
            <>
              <div className="pp-proofs-grid">
                {visibleProofs.map((proof, idx) => (
                  <div className="pp-proof-thumb" key={proof.id} onClick={() => openLightbox(idx)}>
                    <img src={proof.url} alt={proof.label || `Proof ${idx + 1}`} loading="lazy" />
                    <div className="pp-proof-overlay"><span>{proof.label || `Proof ${idx + 1}`}</span></div>
                  </div>
                ))}
              </div>
              {!showAllProofs && hasMoreProofs && (
                <div className="pp-proofs-more">
                  <button onClick={() => setShowAllProofs(true)}>
                    Show all {proofImages.length} proofs
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="pp-section">
          <p className="pp-section-eyebrow">Good to know</p>
          <h2 className="pp-section-title">Frequently asked questions</h2>
          <p className="pp-section-sub">Still unsure? Here's what most buyers ask before checking out.</p>
          <div className="pp-faq">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div className={`pp-faq-item ${isOpen ? "pp-faq-item--open" : ""}`} key={item.q}>
                  <button className="pp-faq-q" onClick={() => setOpenFaq(isOpen ? null : idx)}>
                    {item.q}
                    <span className={`pp-faq-q-icon ${isOpen ? "pp-faq-q-icon--open" : ""}`}>+</span>
                  </button>
                  <div className={`pp-faq-a ${isOpen ? "pp-faq-a--open" : ""}`}>
                    <p>{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------- Reviews ---------- */}
        <section className="pp-reviews">
          <div className="pp-reviews-inner">
            <p className="pp-section-eyebrow">Customer testimonials</p>
            <h2 className="pp-section-title">What our customers say</h2>
            <div style={{ marginTop: 44 }}>
              <Slider {...carouselSettings}>
                {reviews.map(review => (
                  <div key={review.id}>
                    <div className="pp-review-card">
                      <div className="pp-review-stars">★★★★★</div>
                      <p className="pp-review-text">{review.review}</p>
                      <p className="pp-review-name">{review.name} <span>— {review.city}</span></p>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        </section>

      </div>

      {/* ---------- Sticky Buy Now bar (appears once the main CTA scrolls out of view) ---------- */}
      {showStickyBar && (
        <div className="pp-sticky-buybar">
          <div className="pp-sticky-info">
            <span className="pp-sticky-name">
              {product.name}{isMultiPlan ? ` — ${formatPlanDuration(selectedPlan)}` : ""}
            </span>
            <span className="pp-sticky-price">
              {isSelectedPlanAvailable ? (
                <>
                  {stickyStrikeDisplay && (
                    <span className="pp-sticky-price-strike">{stickyStrikeDisplay}</span>
                  )}
                  {stickyPriceDisplay}
                </>
              ) : (
                "Out of stock"
              )}
            </span>
          </div>
          <Countdown date={countdownEnd} renderer={renderStickyCountdown} />
          <button className="pp-sticky-buy-btn" onClick={handleBuyNowClick} disabled={!isSelectedPlanAvailable}>
            {isSelectedPlanAvailable ? <>Buy now <span className="pp-btn-arrow">→</span></> : "Sold out"}
          </button>
        </div>
      )}

      {/* ---------- Email capture modal (replaces the old OTP flow) ---------- */}
      {showEmailModal && (
        <div className="pp-email-modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="pp-email-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pp-email-modal-close"
              onClick={() => setShowEmailModal(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="pp-email-modal-title">Where should we send access?</h3>
            <p className="pp-email-modal-sub">
              Enter your email to continue to payment. No account, no verification code — just this.
            </p>
            <form onSubmit={handleEmailSubmit}>
              <input
                ref={emailInputRef}
                type="email"
                className="pp-email-modal-input"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); if (emailError) setEmailError(""); }}
                autoComplete="email"
              />
              {emailError && <p className="pp-email-modal-error">{emailError}</p>}
              <button type="submit" className="pp-email-modal-submit">
                Continue to payment — {displayPrice}
              </button>
            </form>
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <div className="pp-lightbox" onClick={closeLightbox}>
          <button className="pp-lightbox-close" onClick={closeLightbox} aria-label="Close">✕</button>
          <button className="pp-lightbox-nav pp-lightbox-nav--prev" onClick={showPrev} aria-label="Previous">‹</button>
          <img
            src={proofImages[lightboxIndex].url}
            alt={proofImages[lightboxIndex].label || "Proof"}
            className="pp-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="pp-lightbox-nav pp-lightbox-nav--next" onClick={showNext} aria-label="Next">›</button>
          <span className="pp-lightbox-count">{lightboxIndex + 1} / {proofImages.length}</span>
        </div>
      )}
    </>
  );
};

export default ProductPage;