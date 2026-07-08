import { useParams } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Countdown from "react-countdown";

// ── Price formatting helper ───────────────────────────────────────────────────
// Prices come from the backend in INR. We display the real value — no fake
// pricing, no currency conversion.
function formatINR(amount) {
  if (amount === null || amount === undefined || amount === "") return null;
  const n = Number(amount);
  if (Number.isNaN(n)) return null;
  return `₹${n.toLocaleString("en-IN")}`;
}
// ─────────────────────────────────────────────────────────────────────────────

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@300;400;500;600&display=swap');

  :root {
    --violet: #8B5CF6;
    --violet-light: #C4B5FD;
    --cyan: #22D3EE;
    --dark: #05050A;
    --dark2: #0A0A13;
    --dark3: #111119;
    --dark4: #181822;
    --white: #F4F2FF;
    --white-dim: rgba(244,242,255,0.62);
    --white-faint: rgba(244,242,255,0.08);
    --border: rgba(255,255,255,0.09);
    --surface: rgba(255,255,255,0.045);
    --grad: linear-gradient(92deg, #8B5CF6 0%, #22D3EE 100%);
  }

  .pp-root {
    background: var(--dark);
    color: var(--white);
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    padding-top: 88px;
  }

  .pp-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    gap: 20px;
    background: var(--dark);
    color: var(--white-dim);
    font-size: 15px;
    font-weight: 300;
    font-family: 'Inter', sans-serif;
  }

  .pp-loading-dots { display: flex; gap: 8px; }

  .pp-loading-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--violet);
    animation: dotBounce 1.2s infinite;
  }

  .pp-loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .pp-loading-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes dotBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-8px); opacity: 1; }
  }

  .pp-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    gap: 16px;
    background: var(--dark);
    font-family: 'Inter', sans-serif;
    text-align: center;
    padding: 24px;
  }

  .pp-error-icon { font-size: 48px; }

  .pp-error p {
    font-size: 16px;
    color: var(--white-dim);
    font-weight: 300;
    max-width: 400px;
  }

  .pp-grid {
    max-width: 1180px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: start;
  }

  .pp-image-col { position: sticky; top: 100px; }

  .pp-image-wrap {
    position: relative;
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    background: var(--dark2);
  }

  .pp-product-img {
    width: 100%;
    aspect-ratio: 4/3;
    object-fit: cover;
    display: block;
    transition: transform 0.5s ease;
  }

  .pp-image-wrap:hover .pp-product-img { transform: scale(1.03); }

  .pp-discount-badge {
    position: absolute;
    top: 16px; left: 16px;
    background: var(--grad);
    color: #0A0A13;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 6px;
    z-index: 2;
  }

  .pp-trust-row {
    display: flex;
    gap: 0;
    margin-top: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  .pp-trust-pill {
    flex: 1;
    text-align: center;
    font-size: 11px;
    font-weight: 400;
    color: var(--white-dim);
    padding: 12px 6px;
    border-right: 1px solid var(--border);
    letter-spacing: 0.3px;
  }

  .pp-trust-pill:last-child { border-right: none; }

  .pp-detail-col { display: flex; flex-direction: column; gap: 0; }

  .pp-eyebrow {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--violet-light);
    font-weight: 600;
    margin-bottom: 12px;
    display: block;
  }

  .pp-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(1.8rem, 3.5vw, 2.6rem);
    font-weight: 700;
    letter-spacing: -0.5px;
    line-height: 1.15;
    margin-bottom: 28px;
    color: var(--white);
  }

  .pp-countdown-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px 24px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
  }

  .pp-countdown-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--grad);
  }

  .pp-countdown-label {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--white-dim);
    font-weight: 500;
    margin-bottom: 14px;
  }

  .pp-countdown-display { display: flex; align-items: center; gap: 8px; }

  .pp-time-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--dark3);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 16px;
    min-width: 64px;
  }

  .pp-time-num {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--violet-light);
    line-height: 1;
  }

  .pp-time-label {
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--white-dim);
    margin-top: 5px;
    font-weight: 500;
  }

  .pp-colon {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.6rem;
    color: var(--violet-light);
    font-weight: 700;
    margin-bottom: 14px;
  }

  .pp-expired { font-size: 14px; color: rgba(255,80,80,0.8); font-weight: 400; }

  .pp-pricing {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }

  .pp-price-current {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--white);
    line-height: 1;
  }

  .pp-price-strike {
    font-size: 1.1rem;
    color: var(--white-dim);
    text-decoration: line-through;
    font-weight: 300;
  }

  .pp-price-save {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #0A0A13;
    background: var(--grad);
    padding: 4px 10px;
    border-radius: 6px;
  }

  /* ---------- Plan selector (TradingView-style multi-duration products) ---------- */
  .pp-plans {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .pp-plan-label {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--white-dim);
    font-weight: 500;
    margin-bottom: 4px;
  }

  .pp-plan-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 18px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
    text-align: left;
    width: 100%;
    color: var(--white);
    font-family: 'Inter', sans-serif;
  }

  .pp-plan-card:hover { transform: translateY(-1px); border-color: rgba(139,92,246,0.35); }

  .pp-plan-card--active {
    border-color: var(--violet);
    background: rgba(139,92,246,0.08);
    box-shadow: 0 0 0 1px rgba(139,92,246,0.25);
  }

  .pp-plan-card--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pp-plan-radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1.5px solid var(--border);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s;
  }

  .pp-plan-card--active .pp-plan-radio { border-color: var(--violet); }

  .pp-plan-radio-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--grad);
    transform: scale(0);
    transition: transform 0.15s;
  }

  .pp-plan-card--active .pp-plan-radio-dot { transform: scale(1); }

  .pp-plan-main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .pp-plan-duration {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14.5px;
    font-weight: 600;
  }

  .pp-plan-badge {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: #0A0A13;
    background: var(--grad);
    padding: 3px 8px;
    border-radius: 5px;
    flex-shrink: 0;
  }

  .pp-plan-price-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
  }

  .pp-plan-price {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14.5px;
    font-weight: 700;
    color: var(--violet-light);
  }

  .pp-plan-price-strike {
    font-size: 11.5px;
    color: var(--white-dim);
    text-decoration: line-through;
    font-weight: 300;
  }

  .pp-plan-price--loading {
    font-size: 12px;
    font-weight: 400;
    color: var(--white-dim);
  }

  .pp-buy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    background: var(--grad);
    color: #0A0A13;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.2px;
    padding: 18px 32px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 0 40px rgba(139,92,246,0.2);
    margin-bottom: 12px;
  }

  .pp-buy-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 48px rgba(139,92,246,0.4);
  }

  .pp-buy-btn:active { transform: translateY(0); }

  .pp-buy-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .pp-btn-arrow { font-size: 18px; transition: transform 0.2s; }
  .pp-buy-btn:hover .pp-btn-arrow { transform: translateX(4px); }

  .pp-cta-note {
    font-size: 12px;
    color: var(--white-dim);
    text-align: center;
    font-weight: 300;
    margin-bottom: 36px;
    line-height: 1.6;
  }

  .pp-description {
    border-top: 1px solid var(--border);
    padding-top: 32px;
  }

  .pp-desc-heading {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 16px;
    color: var(--white);
  }

  /*
    .pp-desc-body renders arbitrary HTML that comes from the backend for each
    product. To keep the page looking consistent no matter what markup a
    given product's description uses, every element inside is force-
    normalized to the store's own type system below.
  */
  .pp-desc-body {
    font-size: 14.5px;
    color: var(--white-dim);
    line-height: 1.85;
    font-weight: 300;
  }

  .pp-desc-body * {
    color: inherit !important;
    background: transparent !important;
    font-family: 'Inter', sans-serif !important;
    max-width: 100%;
  }

  .pp-desc-body h1, .pp-desc-body h2, .pp-desc-body h3,
  .pp-desc-body h4, .pp-desc-body h5, .pp-desc-body h6 {
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 700 !important;
    font-size: 1.05rem !important;
    color: var(--white) !important;
    margin: 22px 0 12px !important;
    line-height: 1.4 !important;
  }

  .pp-desc-body h1:first-child, .pp-desc-body h2:first-child,
  .pp-desc-body h3:first-child, .pp-desc-body h4:first-child { margin-top: 0 !important; }

  .pp-desc-body p { margin: 0 0 14px !important; font-size: 14.5px !important; font-weight: 300 !important; }
  .pp-desc-body p:last-child { margin-bottom: 0 !important; }

  .pp-desc-body ul, .pp-desc-body ol { padding-left: 0 !important; list-style: none !important; margin: 0 0 16px !important; }

  .pp-desc-body li {
    padding: 7px 0 !important;
    border-bottom: 1px solid var(--white-faint) !important;
    display: flex !important;
    gap: 10px !important;
    font-size: 14.5px !important;
    font-weight: 300 !important;
  }

  .pp-desc-body li::before {
    content: '✦' !important;
    color: var(--violet-light) !important;
    font-size: 10px !important;
    flex-shrink: 0 !important;
    margin-top: 4px !important;
  }

  .pp-desc-body li:last-child { border-bottom: none !important; }
  .pp-desc-body strong, .pp-desc-body b { color: var(--white) !important; font-weight: 500 !important; }
  .pp-desc-body em, .pp-desc-body i { font-style: italic !important; }
  .pp-desc-body a { color: var(--violet-light) !important; text-decoration: underline !important; }
  .pp-desc-body img { max-width: 100% !important; height: auto !important; border: 1px solid var(--border) !important; border-radius: 10px !important; margin: 12px 0 !important; display: block !important; }
  .pp-desc-body table { width: 100% !important; border-collapse: collapse !important; margin: 12px 0 20px !important; font-size: 13.5px !important; }
  .pp-desc-body th, .pp-desc-body td { border: 1px solid var(--border) !important; padding: 8px 10px !important; text-align: left !important; }
  .pp-desc-body th { color: var(--violet-light) !important; font-weight: 500 !important; text-transform: uppercase !important; font-size: 11px !important; letter-spacing: 0.5px !important; }
  .pp-desc-body blockquote { border-left: 2px solid var(--violet) !important; padding: 4px 0 4px 16px !important; margin: 16px 0 !important; font-style: italic !important; color: var(--white-dim) !important; }
  .pp-desc-body code { font-family: monospace !important; background: var(--dark3) !important; padding: 2px 6px !important; border-radius: 4px !important; font-size: 13px !important; color: var(--violet-light) !important; }
  .pp-desc-body hr { border: none !important; border-top: 1px solid var(--border) !important; margin: 20px 0 !important; }

  .pp-desc-empty { font-size: 14px; color: var(--white-dim); font-weight: 300; font-style: italic; }
  .pp-inline-error { font-size: 13px; color: rgba(255,100,100,0.8); font-weight: 300; margin-top: 12px; }

  /* ---------- Shared section header ---------- */
  .pp-section {
    max-width: 1180px;
    margin: 0 auto;
    padding: 72px 32px;
    border-top: 1px solid var(--border);
  }
  .pp-section-eyebrow {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--violet-light);
    font-weight: 600;
    text-align: center;
    margin-bottom: 12px;
  }
  .pp-section-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(1.7rem, 3.2vw, 2.3rem);
    font-weight: 700;
    letter-spacing: -0.5px;
    text-align: center;
    margin-bottom: 12px;
    color: var(--white);
  }
  .pp-section-sub {
    font-size: 14.5px;
    color: var(--white-dim);
    font-weight: 300;
    text-align: center;
    max-width: 520px;
    margin: 0 auto 48px;
  }

  /* ---------- Purchase process ---------- */
  .pp-steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    position: relative;
  }
  .pp-step {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 26px 22px;
    position: relative;
    transition: transform 0.2s, border-color 0.2s;
  }
  .pp-step:hover { transform: translateY(-3px); border-color: rgba(139,92,246,0.35); }
  .pp-step-num {
    width: 34px; height: 34px;
    border-radius: 10px;
    background: var(--grad);
    color: #0A0A13;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
  }
  .pp-step-title { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 600; margin-bottom: 8px; color: var(--white); }
  .pp-step-desc { font-size: 13px; color: var(--white-dim); line-height: 1.6; font-weight: 300; }

  /* ---------- Proofs gallery ---------- */
  .pp-proofs-header-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .pp-proofs-toggle-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--violet-light);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.4px;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    white-space: nowrap;
  }
  .pp-proofs-toggle-btn:hover { background: rgba(139,92,246,0.12); border-color: rgba(139,92,246,0.35); }
  .pp-proofs-hidden-note {
    text-align: center;
    font-size: 13.5px;
    color: var(--white-dim);
    font-weight: 300;
    padding: 24px 0 4px;
  }
  .pp-proofs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  .pp-proof-thumb {
    position: relative;
    aspect-ratio: 9/16;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border);
    cursor: pointer;
    background: var(--dark3);
  }
  .pp-proof-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease, filter 0.35s ease; }
  .pp-proof-thumb:hover img { transform: scale(1.06); }
  .pp-proof-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(5,5,10,0.55), transparent 55%);
    display: flex; align-items: flex-end; padding: 8px 10px;
    opacity: 0; transition: opacity 0.25s;
  }
  .pp-proof-thumb:hover .pp-proof-overlay { opacity: 1; }
  .pp-proof-overlay span { font-size: 10.5px; color: var(--white); font-weight: 500; }

  .pp-proofs-more {
    text-align: center;
    margin-top: 24px;
  }
  .pp-proofs-more button {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--white);
    font-size: 13px;
    font-weight: 500;
    padding: 11px 24px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .pp-proofs-more button:hover { background: var(--surface-hover, rgba(255,255,255,0.08)); }

  /* ---------- Floating "Hide Proofs" button ----------
     Appears whenever the proofs gallery is open and scrolled into view, so
     the user can collapse it without scrolling all the way back up to the
     toggle at the top of the section. */
  .pp-floating-hide-btn {
    position: fixed;
    left: 24px;
    z-index: 1900;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(17,17,25,0.85);
    backdrop-filter: blur(14px);
    border: 1px solid var(--border);
    color: var(--white);
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.2px;
    padding: 12px 20px;
    border-radius: 30px;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    transition: transform 0.15s, background 0.2s, border-color 0.2s;
    animation: floatHideBtnIn 0.25s ease;
  }
  .pp-floating-hide-btn:hover {
    background: rgba(139,92,246,0.18);
    border-color: rgba(139,92,246,0.4);
    transform: translateY(-2px);
  }
  .pp-floating-hide-btn:active { transform: translateY(0); }
  .pp-floating-hide-btn-icon { font-size: 13px; line-height: 1; color: var(--violet-light); }
  @keyframes floatHideBtnIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .pp-lightbox {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(5,5,10,0.92);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 40px 20px;
  }
  .pp-lightbox-img { max-height: 86vh; max-width: 92vw; border-radius: 14px; border: 1px solid var(--border); object-fit: contain; }
  .pp-lightbox-close, .pp-lightbox-nav {
    position: absolute;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--white);
    width: 42px; height: 42px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 18px;
    transition: background 0.2s;
  }
  .pp-lightbox-close:hover, .pp-lightbox-nav:hover { background: rgba(139,92,246,0.2); }
  .pp-lightbox-close { top: 24px; right: 24px; }
  .pp-lightbox-nav--prev { left: 24px; top: 50%; transform: translateY(-50%); }
  .pp-lightbox-nav--next { right: 24px; top: 50%; transform: translateY(-50%); }
  .pp-lightbox-count { position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); font-size: 12px; color: var(--white-dim); }

  /* ---------- Sticky Buy Now bar ---------- */
  .pp-sticky-buybar {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    z-index: 1800;
    background: rgba(10,10,19,0.88);
    backdrop-filter: blur(14px);
    border-top: 1px solid var(--border);
    padding: 14px 20px;
    padding-bottom: max(14px, env(safe-area-inset-bottom));
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 -8px 32px rgba(0,0,0,0.35);
    animation: stickySlideUp 0.25s ease;
  }
  @keyframes stickySlideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .pp-sticky-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .pp-sticky-name {
    font-size: 12.5px;
    color: var(--white-dim);
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pp-sticky-price {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--white);
    white-space: nowrap;
  }
  .pp-sticky-buy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--grad);
    color: #0A0A13;
    font-size: 14.5px;
    font-weight: 700;
    letter-spacing: 0.2px;
    padding: 13px 24px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    font-family: 'Inter', sans-serif;
    transition: transform 0.15s;
  }
  .pp-sticky-buy-btn:hover { transform: translateY(-1px); }
  .pp-sticky-buy-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  /* ---------- Video section ---------- */
  .pp-video-wrap {
    position: relative;
    max-width: 780px;
    margin: 0 auto;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid var(--border);
    aspect-ratio: 16/9;
    background: var(--dark3);
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  }
  .pp-video-wrap iframe { width: 100%; height: 100%; border: none; display: block; }

  /* ---------- FAQ ---------- */
  .pp-faq { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
  .pp-faq-item {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  .pp-faq-q {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    color: var(--white);
    font-size: 14.5px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    padding: 18px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .pp-faq-q-icon { color: var(--violet-light); font-size: 18px; transition: transform 0.25s; flex-shrink: 0; }
  .pp-faq-q-icon--open { transform: rotate(45deg); }
  .pp-faq-a {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s ease;
    padding: 0 20px;
  }
  .pp-faq-a--open { max-height: 240px; padding: 0 20px 18px; }
  .pp-faq-a p { font-size: 13.5px; color: var(--white-dim); line-height: 1.7; font-weight: 300; }

  /* ---------- Reviews (existing) ---------- */
  .pp-reviews {
    background: var(--dark2);
    border-top: 1px solid var(--border);
    padding: 80px 32px 90px;
  }
  .pp-reviews-inner { max-width: 860px; margin: 0 auto; }
  .pp-review-card {
    background: var(--dark3);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 44px 44px 36px;
    margin: 0 12px;
    position: relative;
    overflow: hidden;
  }
  .pp-review-card::before {
    content: '"';
    font-family: 'Space Grotesk', sans-serif;
    font-size: 120px;
    color: rgba(139,92,246,0.12);
    position: absolute;
    top: -20px; left: 20px;
    line-height: 1;
    pointer-events: none;
  }
  .pp-review-stars { color: var(--violet-light); font-size: 16px; letter-spacing: 3px; margin-bottom: 18px; }
  .pp-review-text { font-size: clamp(1rem, 2vw, 1.15rem); color: var(--white); font-style: italic; font-weight: 300; line-height: 1.8; margin-bottom: 24px; }
  .pp-review-divider { width: 36px; height: 2px; background: var(--grad); margin-bottom: 14px; border-radius: 2px; }
  .pp-review-name { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--violet-light); font-weight: 600; }

  .pp-reviews .slick-dots li button:before { color: var(--violet) !important; opacity: 0.3; font-size: 8px; }
  .pp-reviews .slick-dots li.slick-active button:before { opacity: 1; color: var(--violet-light) !important; }

  @media (max-width: 900px) {
    .pp-grid { grid-template-columns: 1fr; gap: 40px; padding: 40px 24px 64px; }
    .pp-image-col { position: static; }
    .pp-trust-row { flex-wrap: wrap; border-radius: 12px; }
    .pp-trust-pill { min-width: 50%; }
    .pp-steps { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 480px) {
    .pp-review-card { padding: 32px 24px 28px; margin: 0; }
    .pp-time-block { min-width: 52px; padding: 8px 10px; }
    .pp-time-num { font-size: 1.4rem; }
    .pp-steps { grid-template-columns: 1fr; }
    .pp-section { padding: 56px 20px; }
    .pp-plan-main { gap: 8px; }
    .pp-plan-badge { display: none; }
    .pp-sticky-name { display: none; }
    .pp-sticky-buybar { padding: 12px 16px; padding-bottom: max(12px, env(safe-area-inset-bottom)); }
    .pp-floating-hide-btn { left: 16px; font-size: 12px; padding: 10px 16px; }
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
  { title: "Click Buy Now", desc: "You're redirected to our secure, encrypted payment page." },
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

/**
 * Proof-of-delivery / proof-of-results screenshots shown for every product.
 * DUMMY DATA: replace `proofImages` below with `product.proofs` (an array of
 * real screenshot URLs) once the backend returns them per-product. Falls
 * back to placeholders so the section always has content to show.
 */
const dummyProofImages = [
  { id: 1, url: "https://res.cloudinary.com/rblaguvf/image/upload/v1783469538/proofs/sfswwdj1kvwncs6qqocz.jpg", label: "4965327411218590780.jpg" },
];

const PROOFS_PREVIEW_COUNT = 12;

// TradingView-style products offer 3 duration tiers, each of which is its
// own product record (with its own id/price) in the backend. We fetch each
// plan's real price on mount so "Buy Now" can go straight to the payment
// page instead of bouncing the user to another product page first.
const tradingViewPlans = [
  { id: "6",  duration: "3 Months" },
  { id: "12", duration: "6 Months" },
  { id: "18", duration: "12 Months" },
];

const ProductPage = () => {
  const [product,   setProduct]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState("");
  const [showAllProofs, setShowAllProofs] = useState(false);
  const [proofsHidden, setProofsHidden] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(tradingViewPlans[0].id);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showFloatingHideBtn, setShowFloatingHideBtn] = useState(false);

  // Countdown target: midnight tonight (00:00 the next calendar day), computed
  // once via the lazy initializer so it stays fixed for the whole session
  // instead of drifting on every render/refresh. Same target for everyone on
  // a given day, and it naturally resets once the clock rolls past midnight.
  const [countdownEnd] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  });

  // Real per-plan prices, fetched from the backend. Keyed by plan id.
  // { "6": { price: 999, strikeThroughPrice: 1499 }, ... }
  const [planPrices, setPlanPrices] = useState({});
  const [planPricesLoading, setPlanPricesLoading] = useState(false);

  const { id } = useParams();
  const buyBtnAnchorRef = useRef(null);
  const proofsSectionRef = useRef(null);

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
        setProduct(data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching the product.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Once we know this is a TradingView-style product, fetch the real price
  // (and strike-through price) for every plan up front so the selector and
  // Buy Now button can show/use accurate numbers without an extra round
  // trip when the user clicks.
  useEffect(() => {
    if (!product) return;
    const isTV = (product.name || "").toLowerCase().includes("tradingview");
    if (!isTV) return;

    let cancelled = false;
    const apiBase = process.env.REACT_APP_API_BASE || "https://chartvault.shop/api";

    const fetchPlanPrices = async () => {
      setPlanPricesLoading(true);
      try {
        const results = await Promise.all(
          tradingViewPlans.map(async (plan) => {
            try {
              const res = await fetch(`${apiBase}/products/${plan.id}`);
              const data = await res.json();
              if (!res.ok) throw new Error(data.message || "Failed to fetch plan price");
              return [plan.id, { price: data.price, strikeThroughPrice: data.strikeThroughPrice }];
            } catch {
              return [plan.id, { price: null, strikeThroughPrice: null }];
            }
          })
        );
        if (!cancelled) {
          setPlanPrices(Object.fromEntries(results));
        }
      } finally {
        if (!cancelled) setPlanPricesLoading(false);
      }
    };

    fetchPlanPrices();
    return () => { cancelled = true; };
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

  // Show a floating "Hide Proofs" button whenever the proofs gallery is open
  // and scrolled into view, so the person can collapse it without scrolling
  // back up to the toggle button at the top of the section.
  useEffect(() => {
    if (!product || proofsHidden || !proofsSectionRef.current) {
      setShowFloatingHideBtn(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setShowFloatingHideBtn(entry.isIntersecting),
      { threshold: 0 } // fire as soon as ANY part of the section is on screen —
                        // ratio-based thresholds (e.g. 0.15) break once the
                        // section grows huge after "Show 100+ more" is clicked,
                        // because 15% of a very tall element is bigger than
                        // one viewport and can never be satisfied again.
    );
    observer.observe(proofsSectionRef.current);
    return () => observer.disconnect();
  }, [product, isLoading, proofsHidden]);

  const handleBuyNowClick = () => {
    if (!product || typeof product.price === "undefined") {
      alert("Error: Could not retrieve product details. Please try again later.");
      return;
    }
    const encodedProductName = encodeURIComponent(product.name || "Product");
    // Pass the real INR price straight through
    const paymentUrl = `${window.location.origin}/#/payment?amount=${product.price}&productId=${id}&productName=${encodedProductName}`;
    window.location.href = paymentUrl;
  };

  // TradingView-style: "Buy Now" now goes straight to the payment page for
  // the selected plan, using that plan's real fetched price — no more
  // detour through the plan's own product page.
  const handleTradingViewBuyNowClick = () => {
    const plan = tradingViewPlans.find(p => p.id === selectedPlanId);
    const price = planPrices[selectedPlanId]?.price;

    if (!plan || price === null || typeof price === "undefined") {
      alert("Error: Could not retrieve plan pricing. Please try again in a moment.");
      return;
    }

    const encodedProductName = encodeURIComponent(`${product?.name || "Product"} — ${plan.duration}`);
    const paymentUrl = `${window.location.origin}/#/payment?amount=${price}&productId=${plan.id}&productName=${encodedProductName}`;
    window.location.href = paymentUrl;
  };

  if (isLoading) {
    return (
      <>
        <style>{style}</style>
        <div className="pp-loading">
          <div className="pp-loading-dots">
            <div className="pp-loading-dot" /><div className="pp-loading-dot" /><div className="pp-loading-dot" />
          </div>
          <p>Loading product details…</p>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <style>{style}</style>
        <div className="pp-error">
          <span className="pp-error-icon">⚠️</span>
          <p>{error || "Product not found"}</p>
        </div>
      </>
    );
  }

  // ── Real prices, taken directly from the product record ──────────────────────
  const displayPrice  = formatINR(product.price);
  const displayStrike = product.strikeThroughPrice ? formatINR(product.strikeThroughPrice) : null;
  const discount = (product.strikeThroughPrice && product.price)
    ? Math.round(((product.strikeThroughPrice - product.price) / product.strikeThroughPrice) * 100)
    : null;
  // ───────────────────────────────────────────────────────────────────────────

  const isTradingView = (product?.name || "").toLowerCase().includes("tradingview");
  const selectedPlanPrice = planPrices[selectedPlanId]?.price;
  const selectedPlanStrike = planPrices[selectedPlanId]?.strikeThroughPrice;
  const selectedPlanDuration = tradingViewPlans.find(p => p.id === selectedPlanId)?.duration;

  // Values the sticky bar and its Buy Now button use, regardless of product type.
  const stickyPrice = isTradingView ? selectedPlanPrice : product.price;
  const stickyPriceDisplay = formatINR(stickyPrice);
  const stickyDisabled = isTradingView && (planPricesLoading || selectedPlanPrice === null || typeof selectedPlanPrice === "undefined");
  const stickyHandler = isTradingView ? handleTradingViewBuyNowClick : handleBuyNowClick;

  // Proofs: prefer real per-product data from the backend, fall back to dummy set.
  const proofImages = (product.proofs && product.proofs.length > 0) ? product.proofs : dummyProofImages;
  const visibleProofs = showAllProofs ? proofImages : proofImages.slice(0, PROOFS_PREVIEW_COUNT);

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

        <div className="pp-grid">

          <div className="pp-image-col">
            <div className="pp-image-wrap">
              {discount ? <span className="pp-discount-badge">{discount}% OFF</span> : null}
              <img src={product.image} alt={product.name} className="pp-product-img" />
            </div>
            <div className="pp-trust-row">
              {["⚡ Instant Delivery","🔒 Secure Payment","♾️ Lifetime Access","🔄 Replacement Guarantee"].map(t => (
                <span key={t} className="pp-trust-pill">{t}</span>
              ))}
            </div>
          </div>

          <div className="pp-detail-col">
            <span className="pp-eyebrow">Digital Product · Premium</span>
            <h1 className="pp-title">{product.name}</h1>

            <div className="pp-countdown-card">
              <p className="pp-countdown-label">⏳ Limited time offer ends in</p>
              <Countdown
                date={countdownEnd}
                renderer={({ hours, minutes, seconds, completed }) => {
                  if (completed) return <span className="pp-expired">Offer Expired</span>;
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

            {/* ── Real pricing, straight from the backend ── */}
            {!isTradingView && (
              <div className="pp-pricing">
                <span className="pp-price-current">{displayPrice}</span>
                {displayStrike && <span className="pp-price-strike">{displayStrike}</span>}
                {discount ? <span className="pp-price-save">Save {discount}%</span> : null}
              </div>
            )}

            {/* This ref marks where the "main" buy button lives. Once it scrolls
                out of view, the sticky bottom bar takes over as the CTA. */}
            <div ref={buyBtnAnchorRef}>
              {isTradingView ? (
                <>
                  <div className="pp-plans">
                    <span className="pp-plan-label">Choose your plan</span>
                    {tradingViewPlans.map((plan, idx) => {
                      const isActive = selectedPlanId === plan.id;
                      const price = planPrices[plan.id]?.price;
                      const strikePrice = planPrices[plan.id]?.strikeThroughPrice;
                      const hasPrice = price !== null && typeof price !== "undefined";
                      const hasStrike = hasPrice && strikePrice && Number(strikePrice) > Number(price);
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          className={`pp-plan-card ${isActive ? "pp-plan-card--active" : ""}`}
                          onClick={() => setSelectedPlanId(plan.id)}
                        >
                          <span className="pp-plan-main">
                            <span className="pp-plan-radio"><span className="pp-plan-radio-dot" /></span>
                            <span className="pp-plan-duration">{plan.duration}</span>
                            {idx === tradingViewPlans.length - 1 && (
                              <span className="pp-plan-badge">Best Value</span>
                            )}
                          </span>
                          {hasPrice ? (
                            <span className="pp-plan-price-col">
                              {hasStrike && (
                                <span className="pp-plan-price-strike">{formatINR(strikePrice)}</span>
                              )}
                              <span className="pp-plan-price">{formatINR(price)}</span>
                            </span>
                          ) : (
                            <span className="pp-plan-price pp-plan-price--loading">
                              {planPricesLoading ? "Loading…" : "—"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="pp-buy-btn"
                    onClick={handleTradingViewBuyNowClick}
                    disabled={planPricesLoading || selectedPlanPrice === null || typeof selectedPlanPrice === "undefined"}
                  >
                    Buy Now{selectedPlanPrice ? ` — ${formatINR(selectedPlanPrice)}` : ""} <span className="pp-btn-arrow">→</span>
                  </button>
                </>
              ) : (
                <button className="pp-buy-btn" onClick={handleBuyNowClick}>
                  Buy Now — {displayPrice} <span className="pp-btn-arrow">→</span>
                </button>
              )}
            </div>

            <p className="pp-cta-note">
              You'll be redirected to our secure payment page. Instant delivery after payment.
            </p>

            <div className="pp-description">
              <h3 className="pp-desc-heading">What's Included</h3>
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
          <p className="pp-section-eyebrow">How It Works</p>
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
          <p className="pp-section-eyebrow">Proof, Not Promises</p>
          <h2 className="pp-section-title">Real orders, real deliveries</h2>
          <p className="pp-section-sub">A sample of confirmation screenshots from past buyers of this product. Tap any image to view it larger.</p>

          <div className="pp-proofs-header-row">
            <button
              type="button"
              className="pp-proofs-toggle-btn"
              onClick={() => setProofsHidden(h => !h)}
            >
              {proofsHidden ? "Show Proofs" : "Hide Proofs"}
            </button>
          </div>

          {proofsHidden ? (
            <p className="pp-proofs-hidden-note">Proofs section hidden — click "Show Proofs" above to view them.</p>
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
              {!showAllProofs && proofImages.length > PROOFS_PREVIEW_COUNT && (
                <div className="pp-proofs-more">
                  <button onClick={() => setShowAllProofs(true)}>Show 100+ more</button>
                </div>
              )}
            </>
          )}
        </section>



        {/* ---------- FAQ ---------- */}
        <section className="pp-section">
          <p className="pp-section-eyebrow">Good To Know</p>
          <h2 className="pp-section-title">Frequently asked questions</h2>
          <p className="pp-section-sub">Still unsure? Here's what most buyers ask before checking out.</p>
          <div className="pp-faq">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div className="pp-faq-item" key={item.q}>
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
            <p className="pp-section-eyebrow">Customer Testimonials</p>
            <h2 className="pp-section-title">What our customers say</h2>
            <div style={{ marginTop: 48 }}>
              <Slider {...carouselSettings}>
                {reviews.map(review => (
                  <div key={review.id}>
                    <div className="pp-review-card">
                      <div className="pp-review-stars">★★★★★</div>
                      <p className="pp-review-text">{review.review}</p>
                      <div className="pp-review-divider" />
                      <p className="pp-review-name">{review.name} — {review.city}</p>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        </section>

      </div>

      {/* ---------- Floating "Hide Proofs" button ----------
          Shown while the proofs gallery is open and in view. Its bottom
          offset shifts up when the sticky Buy Now bar is also visible, so
          the two never overlap. */}
      {showFloatingHideBtn && (
        <button
          type="button"
          className="pp-floating-hide-btn"
          style={{ bottom: showStickyBar ? 96 : 28 }}
          onClick={() => setProofsHidden(true)}
        >
          <span className="pp-floating-hide-btn-icon">✕</span> Hide Proofs
        </button>
      )}

      {/* ---------- Sticky Buy Now bar (appears once the main CTA scrolls out of view) ---------- */}
      {showStickyBar && (
        <div className="pp-sticky-buybar">
          <div className="pp-sticky-info">
            <span className="pp-sticky-name">
              {product.name}{isTradingView && selectedPlanDuration ? ` — ${selectedPlanDuration}` : ""}
            </span>
            <span className="pp-sticky-price">
              {stickyPriceDisplay || (isTradingView ? "Loading…" : "")}
            </span>
          </div>
          <button
            className="pp-sticky-buy-btn"
            onClick={stickyHandler}
            disabled={stickyDisabled}
          >
            Buy Now <span className="pp-btn-arrow">→</span>
          </button>
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