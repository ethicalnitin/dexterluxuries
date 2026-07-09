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

// ── UPI payment config ────────────────────────────────────────────────────────
// TODO: replace with your real UPI ID (VPA) and payee/merchant display name
// before going live. This is what actually receives the money.
const UPI_VPA = "paytm.s2znhpg@pty";
const UPI_PAYEE_NAME = "ChartVault";

// Backend endpoint that receives the order details (email/username + phone +
// amount) and relays them to your Telegram bot server-side. This MUST happen
// on the backend — never call the Telegram Bot API directly from the browser,
// since that would expose your bot token to anyone who opens devtools.
// Expected contract: POST { productId, productName, amount, email, phone, method }
// -> the backend forwards a formatted message to your Telegram chat via the
// Bot API (https://api.telegram.org/bot<token>/sendMessage).
function getNotifyEndpoint() {
  const apiBase = process.env.REACT_APP_API_BASE || "https://chartvault.shop/api";
  return `${apiBase}/orders/notify`;
}

// Builds a standard UPI deep link. On a phone this opens the user's UPI app
// (GPay, PhonePe, Paytm, etc.) directly into a pre-filled payment screen.
function buildUpiDeepLink({ amount, note }) {
  const params = new URLSearchParams({
    pa: UPI_VPA,                 // payee address (your UPI ID)
    pn: UPI_PAYEE_NAME,          // payee name
    am: String(amount),          // amount
    cu: "INR",
    tn: note || "Order payment", // transaction note
  });
  return `upi://pay?${params.toString()}`;
}

// WhatsApp number that both the "Pay with Bank Transfer" button and the
// post-UPI-payment "Proceed to WhatsApp" button send buyers to.
const WHATSAPP_NUMBER = "919289847981";

// Builds a wa.me deep link with a pre-filled message describing the order.
// `context` controls the wording: "bank" for a fresh bank-transfer request,
// "upi-confirm" for a buyer confirming a UPI payment they already made.
function buildWhatsAppLink({ amount, productName, context }) {
  const price = formatINR(amount) || `₹${amount}`;
  const text =
    context === "upi-confirm"
      ? `Hi, I've completed the UPI payment for ${productName} (${price}). Please confirm my order.`
      : `Hi, I'd like to pay via bank transfer for ${productName} (${price}). Please share the bank details.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function isValidEmailOrUsername(value) {
  // Accept either an email address or a plain TradingView username (no spaces).
  const v = (value || "").trim();
  if (!v) return false;
  const looksLikeEmail = /\S+@\S+\.\S+/.test(v);
  const looksLikeUsername = /^\S{3,}$/.test(v);
  return looksLikeEmail || looksLikeUsername;
}

function isValidIndianPhone(value) {
  const digits = (value || "").replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
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
    background: linear-gradient(150deg, rgba(139,92,246,0.10), rgba(34,211,238,0.05) 60%, rgba(139,92,246,0.06));
    border: 1px solid rgba(139,92,246,0.28);
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 36px rgba(139,92,246,0.14), inset 0 1px 0 rgba(255,255,255,0.05);
  }

  .pp-countdown-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--grad);
    background-size: 200% 100%;
    box-shadow: 0 0 14px rgba(139,92,246,0.55);
    animation: countdownShimmer 3.5s linear infinite;
  }

  .pp-countdown-card::after {
    content: '';
    position: absolute;
    top: -40%; right: -10%;
    width: 220px; height: 220px;
    background: radial-gradient(circle, rgba(34,211,238,0.16), transparent 70%);
    pointer-events: none;
  }

  @keyframes countdownShimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }

  .pp-countdown-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--white-dim);
    font-weight: 600;
    margin-bottom: 14px;
    position: relative;
    z-index: 1;
  }

  .pp-live-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #FF5C5C;
    box-shadow: 0 0 0 rgba(255,92,92,0.6);
    flex-shrink: 0;
    animation: liveDotPulse 1.6s ease-out infinite;
  }

  @keyframes liveDotPulse {
    0% { box-shadow: 0 0 0 0 rgba(255,92,92,0.55); }
    70% { box-shadow: 0 0 0 7px rgba(255,92,92,0); }
    100% { box-shadow: 0 0 0 0 rgba(255,92,92,0); }
  }

  .pp-countdown-display { display: flex; align-items: center; gap: 8px; position: relative; z-index: 1; }

  .pp-time-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(165deg, var(--dark4), var(--dark3));
    border: 1px solid rgba(139,92,246,0.25);
    border-radius: 11px;
    padding: 10px 16px;
    min-width: 64px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04);
  }

  .pp-time-num {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--violet-light);
    line-height: 1;
    text-shadow: 0 0 18px rgba(196,181,253,0.45);
    font-variant-numeric: tabular-nums;
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
    animation: colonBlink 1s steps(1) infinite;
  }

  @keyframes colonBlink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0.35; }
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

  .pp-proofs-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--violet-light);
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: 0.3px;
    padding: 14px 20px;
    border-radius: 10px;
    cursor: pointer;
    margin-top: 20px;
    font-family: 'Inter', sans-serif;
    transition: background 0.2s, border-color 0.2s, transform 0.15s;
  }
  .pp-proofs-cta:hover {
    background: rgba(139,92,246,0.1);
    border-color: rgba(139,92,246,0.35);
    transform: translateY(-1px);
  }

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
  .pp-sticky-timer {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(139,92,246,0.14);
    border: 1px solid rgba(139,92,246,0.32);
    border-radius: 9px;
    padding: 8px 12px;
    flex-shrink: 0;
    white-space: nowrap;
  }
  .pp-sticky-timer-icon { font-size: 12px; line-height: 1; }
  .pp-sticky-timer-value {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13.5px;
    font-weight: 700;
    letter-spacing: 0.4px;
    color: var(--violet-light);
    font-variant-numeric: tabular-nums;
  }
  .pp-sticky-timer-expired {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255,80,80,0.85);
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
    .pp-sticky-buybar { padding: 12px 16px; padding-bottom: max(12px, env(safe-area-inset-bottom)); gap: 10px; }
    .pp-sticky-timer { padding: 7px 9px; }
    .pp-sticky-timer-value { font-size: 12.5px; }
    .pp-floating-hide-btn { left: 16px; font-size: 12px; padding: 10px 16px; }
  }

  /* ---------- Payment modal ---------- */
  .pp-modal-overlay {
    position: fixed; inset: 0; z-index: 2200;
    background: rgba(5,5,10,0.82);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: modalFadeIn 0.2s ease;
  }
  @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }

  .pp-modal-card {
    width: 100%;
    max-width: 420px;
    background: var(--dark3);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 28px 26px 24px;
    position: relative;
    box-shadow: 0 24px 70px rgba(0,0,0,0.5);
    animation: modalSlideUp 0.25s ease;
  }
  @keyframes modalSlideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .pp-modal-close {
    position: absolute; top: 16px; right: 16px;
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--white-dim);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 15px;
    transition: background 0.2s;
  }
  .pp-modal-close:hover { background: rgba(139,92,246,0.2); }

  .pp-modal-eyebrow {
    font-size: 10px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--violet-light);
    font-weight: 600;
    margin-bottom: 8px;
  }

  .pp-modal-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 4px;
  }

  .pp-modal-amount {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    background: var(--grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin: 10px 0 20px;
  }

  .pp-modal-field { margin-bottom: 14px; }
  .pp-modal-label {
    display: block;
    font-size: 12px;
    color: var(--white-dim);
    font-weight: 400;
    margin-bottom: 6px;
    letter-spacing: 0.2px;
  }
  .pp-modal-input {
    width: 100%;
    background: var(--dark2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    color: var(--white);
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .pp-modal-input:focus { border-color: var(--violet); }
  .pp-modal-input::placeholder { color: rgba(244,242,255,0.32); }

  .pp-modal-error {
    font-size: 12.5px;
    color: rgba(255,110,110,0.9);
    margin: -4px 0 14px;
  }

  .pp-modal-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 18px;
  }

  .pp-modal-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px 18px;
    border-radius: 10px;
    font-size: 14.5px;
    font-weight: 700;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    border: none;
    transition: transform 0.15s, opacity 0.15s;
  }
  .pp-modal-btn:hover { transform: translateY(-1px); }
  .pp-modal-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .pp-modal-btn--upi { background: var(--grad); color: #0A0A13; }
  .pp-modal-btn--bank {
    background: var(--surface);
    color: var(--white);
    border: 1px solid var(--border);
  }

  .pp-modal-note {
    font-size: 11.5px;
    color: var(--white-dim);
    text-align: center;
    margin-top: 16px;
    line-height: 1.6;
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
  {
    "id": 1,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469334/proofs/fmvjx8nf4m0qkytv1tm9.jpg",
    "label": "4965327411218590780.jpg"
  },
  {
    "id": 2,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469340/proofs/lapgci9ggunou3ooyo4b.jpg",
    "label": "4965327411218590781.jpg"
  },
  {
    "id": 3,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469344/proofs/dljlnvnndba4h3kp8j97.jpg",
    "label": "5010499051149437833.jpg"
  },
  {
    "id": 4,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469348/proofs/edowg2cntli4p13akpdh.jpg",
    "label": "5010499051149437834.jpg"
  },
  {
    "id": 5,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469351/proofs/rwsickhxkeew0cta2ags.jpg",
    "label": "5010499051149437835.jpg"
  },
  {
    "id": 6,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469354/proofs/aaaiyotd3xqajabx1udk.jpg",
    "label": "6066875063946303840.jpg"
  },
  {
    "id": 7,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469355/proofs/lfyo6h6p4hemnjm6v30z.jpg",
    "label": "6066875063946303841.jpg"
  },
  {
    "id": 8,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469357/proofs/dzgygxhpqeuifm0ys4xg.jpg",
    "label": "6066875063946303842.jpg"
  },
  {
    "id": 9,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469359/proofs/igqrahru8hy01x722qsz.jpg",
    "label": "6066875063946303845.jpg"
  },
  {
    "id": 10,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469361/proofs/okzo2goo1rdugpafgszn.jpg",
    "label": "6066875063946303846.jpg"
  },
  {
    "id": 11,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469363/proofs/beq1c5ory4btbv2zyve0.jpg",
    "label": "6066875063946303848.jpg"
  },
  {
    "id": 12,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469364/proofs/gc23wfcnjhml5fiupvuk.jpg",
    "label": "6066875063946303853.jpg"
  },
  {
    "id": 13,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469366/proofs/izhegzwyq8tdh3yxalis.jpg",
    "label": "6066875063946303854.jpg"
  },
  {
    "id": 14,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469368/proofs/vwg4rjt7masyuneeioky.jpg",
    "label": "6066875063946303858.jpg"
  },
  {
    "id": 15,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469370/proofs/orefau6fvz4gwo04tl6y.jpg",
    "label": "6066875063946303862.jpg"
  },
  {
    "id": 16,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469372/proofs/skrzjtyu6xu1sc9xeewx.jpg",
    "label": "6066875063946303863.jpg"
  },
  {
    "id": 17,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469374/proofs/py97wyo9qsk2mufyyxrs.jpg",
    "label": "6066875063946303864.jpg"
  },
  {
    "id": 18,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469375/proofs/wc0vzrwusvju5pssipcx.jpg",
    "label": "6066875063946303865.jpg"
  },
  {
    "id": 19,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469377/proofs/gryk4w9bccjas115bvvm.jpg",
    "label": "6087093317549536791.jpg"
  },
  {
    "id": 20,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469379/proofs/pi6rqm0lqbqbnxmt7aib.jpg",
    "label": "6087093317549536792.jpg"
  },
  {
    "id": 21,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469381/proofs/rnzjj1j5ykn9clkggrkh.jpg",
    "label": "6087093317549536793.jpg"
  },
  {
    "id": 22,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469384/proofs/xatg9sjvcfiqrycg9kbx.jpg",
    "label": "6087093317549536794.jpg"
  },
  {
    "id": 23,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469387/proofs/hgidhrhrgazpjtpafcdr.jpg",
    "label": "6087093317549536795.jpg"
  },
  {
    "id": 24,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469389/proofs/ogwcn2puovjrvb97d4sn.jpg",
    "label": "6087093317549536796.jpg"
  },
  {
    "id": 25,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469391/proofs/a0qya4binyo2k5go9puu.jpg",
    "label": "6087093317549536797.jpg"
  },
  {
    "id": 26,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469393/proofs/x6t3hhwpu3exycrwi99l.jpg",
    "label": "6095723483100199925.jpg"
  },
  {
    "id": 27,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469395/proofs/c8yabvlemb0nisx9xaat.jpg",
    "label": "6095723483100199926.jpg"
  },
  {
    "id": 28,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469397/proofs/knltyik56mbf9ockuakf.jpg",
    "label": "6095723483100199927.jpg"
  },
  {
    "id": 29,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469401/proofs/m6nxmorpy14dy15umjnr.jpg",
    "label": "6095723483100199928.jpg"
  },
  {
    "id": 30,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469407/proofs/qwhve5hjuxxbngrcw2he.jpg",
    "label": "6095723483100199929.jpg"
  },
  {
    "id": 31,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469409/proofs/umosdw5lm4rwlfaaszps.jpg",
    "label": "6095723483100199932.jpg"
  },
  {
    "id": 32,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469412/proofs/blekmsqt4xhdmrmrns4p.jpg",
    "label": "6095723483100199935.jpg"
  },
  {
    "id": 33,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469415/proofs/qfdvbql67mvbee1dx0jz.jpg",
    "label": "6095723483100199936.jpg"
  },
  {
    "id": 34,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469417/proofs/d2jnrrvsjqlspj2maryi.jpg",
    "label": "6095723483100199937.jpg"
  },
  {
    "id": 35,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469419/proofs/kw5tnszsmzxonvybdxn1.jpg",
    "label": "6102680325097372645.jpg"
  },
  {
    "id": 36,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469420/proofs/lvolb9mwthgztgqyzrag.jpg",
    "label": "6102680325097372646.jpg"
  },
  {
    "id": 37,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469422/proofs/ohg3cm7jhhlnpwb9f7fg.jpg",
    "label": "6102680325097372647.jpg"
  },
  {
    "id": 38,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469425/proofs/mcahbeds7dfjjokswubs.jpg",
    "label": "6248919615019266447.jpg"
  },
  {
    "id": 39,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469427/proofs/icoljyzxeillzmyvdewx.jpg",
    "label": "6248919615019266449.jpg"
  },
  {
    "id": 40,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469429/proofs/j2mnyt1reogty1i7cdwl.jpg",
    "label": "6253423214646636824.jpg"
  },
  {
    "id": 41,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469431/proofs/qi8iychdfh5s4gssi9r6.jpg",
    "label": "6253423214646636825.jpg"
  },
  {
    "id": 42,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469433/proofs/oybl2pksvjddf1e4vtii.jpg",
    "label": "6264694785084341909.jpg"
  },
  {
    "id": 43,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469437/proofs/fyrhljj4ndjwbki3wbm8.jpg",
    "label": "6276209583814981608.jpg"
  },
  {
    "id": 44,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469439/proofs/ibfheetux6blo1nghk9q.jpg",
    "label": "6276209583814981609 (1).jpg"
  },
  {
    "id": 45,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469442/proofs/mfoqp1r2wm05nlmjxycb.jpg",
    "label": "6276209583814981609.jpg"
  },
  {
    "id": 46,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469444/proofs/bwsd6pz9uxmrqdhq9hj3.jpg",
    "label": "6276209583814981610.jpg"
  },
  {
    "id": 47,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469447/proofs/cxmmodaga7vang7qgrlm.jpg",
    "label": "6276209583814981611.jpg"
  },
  {
    "id": 48,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469449/proofs/z5n8u81ljy83b8vm19v8.jpg",
    "label": "6276209583814981612.jpg"
  },
  {
    "id": 49,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469451/proofs/nuxa25e6ii9oh9vxdzss.jpg",
    "label": "IMG_20240829_032555_785.jpg"
  },
  {
    "id": 50,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469452/proofs/sur7job6tppdqpjreann.jpg",
    "label": "IMG_20240829_032610_415.jpg"
  },
  {
    "id": 51,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469454/proofs/xkwf3qhuhvhz4z8blh2p.jpg",
    "label": "IMG_20240829_032617_985.jpg"
  },
  {
    "id": 52,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469456/proofs/mi67lixidhhqphrfw0bo.jpg",
    "label": "IMG_20240829_032627_779.jpg"
  },
  {
    "id": 53,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469458/proofs/lbwrtqs5uhiojiunxsgj.jpg",
    "label": "IMG_20240829_032639_961.jpg"
  },
  {
    "id": 54,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469460/proofs/qfcfeolxhfquqdsnbnpq.jpg",
    "label": "IMG_20240829_032643_716.jpg"
  },
  {
    "id": 55,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469462/proofs/rtg47rvsvbgvxfyjwkne.jpg",
    "label": "IMG_20240829_032646_997.jpg"
  },
  {
    "id": 56,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469465/proofs/pa4qpounbu2p6dm3ruir.jpg",
    "label": "IMG_20240829_032650_209.jpg"
  },
  {
    "id": 57,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469466/proofs/lvpw797dyhavv3vlptb7.jpg",
    "label": "IMG_20240829_032657_219.jpg"
  },
  {
    "id": 58,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469468/proofs/xyrcryvu3d71cz2agyzo.jpg",
    "label": "IMG_20240829_032701_257.jpg"
  },
  {
    "id": 59,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469470/proofs/mcyur70fsebxuabznoe8.jpg",
    "label": "IMG_20240829_032704_854.jpg"
  },
  {
    "id": 60,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469473/proofs/oxrv0occaqjcmu7un5ih.jpg",
    "label": "IMG_20240829_032708_164.jpg"
  },
  {
    "id": 61,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469475/proofs/lma8hw7adrs454fwvjys.jpg",
    "label": "IMG_20240829_032715_213.jpg"
  },
  {
    "id": 62,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469477/proofs/qixa5mx2irmdoc2dkjeg.jpg",
    "label": "IMG_20240829_032725_315.jpg"
  },
  {
    "id": 63,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469479/proofs/lxlrdrdyjnomyc8vvdou.jpg",
    "label": "IMG_20240829_032729_506.jpg"
  },
  {
    "id": 64,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469481/proofs/nqpf7mc5ryacasbwfufh.jpg",
    "label": "IMG_20240829_032733_541.jpg"
  },
  {
    "id": 65,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469483/proofs/wrcbbfybnhoqiwvz2ydl.jpg",
    "label": "IMG_20240829_032744_498.jpg"
  },
  {
    "id": 66,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469485/proofs/j45wppbdko5fq6i4drwu.jpg",
    "label": "IMG_20240829_032748_020.jpg"
  },
  {
    "id": 67,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469487/proofs/se09cl1w6t3qiaeg29kp.jpg",
    "label": "IMG_20240829_032757_562.jpg"
  },
  {
    "id": 68,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469489/proofs/jmxjnc0epdly8gvkflzz.jpg",
    "label": "IMG_20240829_032804_641.jpg"
  },
  {
    "id": 69,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469491/proofs/g22hkr3s18o0m6idg7ck.jpg",
    "label": "IMG_20240829_032808_491.jpg"
  },
  {
    "id": 70,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469493/proofs/bfv0svn0lt8mwrvz9jul.jpg",
    "label": "IMG_20240829_032821_445.jpg"
  },
  {
    "id": 71,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469495/proofs/ypf4crmiyw8my3fsmhdu.jpg",
    "label": "IMG_20240829_032825_443.jpg"
  },
  {
    "id": 72,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469497/proofs/awplv8lk4zcjtasvtava.jpg",
    "label": "IMG_20240829_032837_071.jpg"
  },
  {
    "id": 73,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469499/proofs/ynolkpkcm3vigeygcrg1.jpg",
    "label": "IMG_20240829_032841_270.jpg"
  },
  {
    "id": 74,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469501/proofs/flbyxhjg6vf1e6u1eqq9.jpg",
    "label": "IMG_20240829_032843_640.jpg"
  },
  {
    "id": 75,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469503/proofs/z38g1srtec0k3bi46nnf.jpg",
    "label": "IMG_20240829_032847_082.jpg"
  },
  {
    "id": 76,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469505/proofs/fstpptva9xjmhbgmrzui.jpg",
    "label": "IMG_20240829_032850_981.jpg"
  },
  {
    "id": 77,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469508/proofs/rpokoj6k12272thesdai.jpg",
    "label": "IMG_20240829_032854_900.jpg"
  },
  {
    "id": 78,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469510/proofs/ygluc7qvqlnio3jnbk8w.jpg",
    "label": "IMG_20240829_032859_225.jpg"
  },
  {
    "id": 79,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469512/proofs/tr81r1zkgi8sc9opg09c.jpg",
    "label": "IMG_20240829_032902_829.jpg"
  },
  {
    "id": 80,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469514/proofs/xcjkj9tr29gyhccqneuk.jpg",
    "label": "IMG_20240829_032907_545.jpg"
  },
  {
    "id": 81,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469518/proofs/yoniue6g2its5bsp5gvo.jpg",
    "label": "IMG_20240829_032910_338.jpg"
  },
  {
    "id": 82,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469520/proofs/v3qkxgmwnlraio0venhr.jpg",
    "label": "IMG_20240829_032944_079.jpg"
  },
  {
    "id": 83,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469522/proofs/xbgn170zqzepqr1xpz5c.jpg",
    "label": "IMG_20240829_032947_814.jpg"
  },
  {
    "id": 84,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469525/proofs/mipgnvvjwvv362uvd1ww.jpg",
    "label": "IMG_20240829_032957_535.jpg"
  },
  {
    "id": 85,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469528/proofs/qkjzc1voomb0s6jshafd.jpg",
    "label": "IMG_20240829_033007_936.jpg"
  },
  {
    "id": 86,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469530/proofs/hlbbftio2cyhzyt7oxqi.jpg",
    "label": "IMG_20240829_033013_278.jpg"
  },
  {
    "id": 87,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469532/proofs/xzzdsqcprl8fd628bzyr.jpg",
    "label": "IMG_20240829_033036_547.jpg"
  },
  {
    "id": 88,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469535/proofs/jzcdrhgrkoxusrwoknc8.jpg",
    "label": "IMG_20240829_033040_147.jpg"
  },
  {
    "id": 89,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469538/proofs/sfswwdj1kvwncs6qqocz.jpg",
    "label": "IMG_20240829_033045_317.jpg"
  },
  {
    "id": 90,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469540/proofs/qpn5xbc56xg7l7ri5hpg.jpg",
    "label": "IMG_20240829_033051_252.jpg"
  },
  {
    "id": 91,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469542/proofs/wspsw9brtdckl41ulmdn.jpg",
    "label": "IMG_20240921_014757_873.jpg"
  },
  {
    "id": 92,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469544/proofs/xn8hus0rkim4wgrsoqm0.jpg",
    "label": "IMG_20240921_014759_230.jpg"
  },
  {
    "id": 93,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469547/proofs/koplkwqixjigcr8r8ldc.jpg",
    "label": "IMG_20240921_014759_965.jpg"
  },
  {
    "id": 94,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469548/proofs/dllziy4aret49kikegvh.jpg",
    "label": "IMG_20240921_014800_679.jpg"
  },
  {
    "id": 95,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469551/proofs/eb9ehtqduyqpz0ltkwi9.jpg",
    "label": "IMG_20240921_014801_814.jpg"
  },
  {
    "id": 96,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469552/proofs/rsbu3atosvx9dfvcvxno.jpg",
    "label": "IMG_20240921_014803_405.jpg"
  },
  {
    "id": 97,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469556/proofs/qff2h7ten1v0gncxojde.jpg",
    "label": "IMG_20240921_014803_886.jpg"
  },
  {
    "id": 98,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469558/proofs/yp5mqhihsfdlzzd7eibs.jpg",
    "label": "IMG_20240921_014805_874.jpg"
  },
  {
    "id": 99,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469560/proofs/bi439iyyfwbnsttj5kyc.jpg",
    "label": "IMG_20240921_014806_490.jpg"
  },
  {
    "id": 100,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469561/proofs/ch0wxoxj3caws5tnte2y.jpg",
    "label": "IMG_20240921_014807_239.jpg"
  },
  {
    "id": 101,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469562/proofs/ixm3x0hnjiqeqcdsnj4s.jpg",
    "label": "IMG_20240921_014808_621.jpg"
  },
  {
    "id": 102,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469565/proofs/jddzpxsfy54ovzmhpya2.jpg",
    "label": "IMG_20240921_014810_166.jpg"
  },
  {
    "id": 103,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469566/proofs/hewxm2xj33riwnmulf0f.jpg",
    "label": "IMG_20240921_014810_877.jpg"
  },
  {
    "id": 104,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469569/proofs/xkfqfsemfnajq4jlpozz.jpg",
    "label": "IMG_20240921_014811_603.jpg"
  },
  {
    "id": 105,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469570/proofs/da1spja4ihnrrsxekwtv.jpg",
    "label": "IMG_20240921_014813_979.jpg"
  },
  {
    "id": 106,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469572/proofs/xs49zch4h7jbbtgxuicm.jpg",
    "label": "IMG_20240921_014814_858.jpg"
  },
  {
    "id": 107,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469574/proofs/dp3h6nshtpzfb9qpag3u.jpg",
    "label": "IMG_20240921_014816_986.jpg"
  },
  {
    "id": 108,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469575/proofs/l3wbcszalmblvqi13jlj.jpg",
    "label": "IMG_20240921_014817_855.jpg"
  },
  {
    "id": 109,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469581/proofs/jwq9xxiw2tocavhqy2br.jpg",
    "label": "IMG_20240921_014818_951.jpg"
  },
  {
    "id": 110,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469582/proofs/o9o7donkctrapwxql3vs.jpg",
    "label": "IMG_20240921_014820_250.jpg"
  },
  {
    "id": 111,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469584/proofs/dwksjero6ffcpyk24fr1.jpg",
    "label": "IMG_20240921_014822_026.jpg"
  },
  {
    "id": 112,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469586/proofs/bhjstrolb5oyw6svxrxo.jpg",
    "label": "IMG_20240921_014822_409.jpg"
  },
  {
    "id": 113,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469587/proofs/ak8fz13een25a0liu8tj.jpg",
    "label": "IMG_20240921_014823_457.jpg"
  },
  {
    "id": 114,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469592/proofs/fzupt7a2xobxyi5x7o5z.jpg",
    "label": "IMG_20240921_014825_600.jpg"
  },
  {
    "id": 115,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469594/proofs/z9yt3vylzq6hyhyepvtp.jpg",
    "label": "IMG_20240921_014827_215.jpg"
  },
  {
    "id": 116,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469596/proofs/gmfvxohcbq3r94iy9hap.jpg",
    "label": "IMG_20240921_015129_109.jpg"
  },
  {
    "id": 117,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469599/proofs/agqmlnhomcprqshz39b5.jpg",
    "label": "IMG_20240921_015131_212.jpg"
  },
  {
    "id": 118,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469602/proofs/rrs4wgnpasjd5o8ddroc.jpg",
    "label": "IMG_20240921_015131_989.jpg"
  },
  {
    "id": 119,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469604/proofs/ulmthniyg5mwnk62losb.jpg",
    "label": "IMG_20240921_015133_615.jpg"
  },
  {
    "id": 120,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469606/proofs/h5bhrpkj1i4vpbba15ut.jpg",
    "label": "IMG_20240921_015135_076.jpg"
  },
  {
    "id": 121,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469608/proofs/rwaqwa1nhewg2amvsryd.jpg",
    "label": "IMG_20240921_015136_289.jpg"
  },
  {
    "id": 122,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469613/proofs/sndmk0c3mglpj8jaqsbw.jpg",
    "label": "IMG_20240921_015138_829.jpg"
  },
  {
    "id": 123,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469615/proofs/etrkrucnmqpgs2hyu3j9.jpg",
    "label": "IMG_20240921_015140_209.jpg"
  },
  {
    "id": 124,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469616/proofs/n069fx6bokusp02vwief.jpg",
    "label": "IMG_20240921_015141_402.jpg"
  },
  {
    "id": 125,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469618/proofs/adnqyd8xhnocexyvi3nz.jpg",
    "label": "IMG_20240921_015142_096.jpg"
  },
  {
    "id": 126,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469620/proofs/rmgo4vskq1srwmkpgwe4.jpg",
    "label": "IMG_20240921_015144_075.jpg"
  },
  {
    "id": 127,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469621/proofs/a9kvdtxg5ycsuixjtaaw.jpg",
    "label": "IMG_20240921_015145_716.jpg"
  },
  {
    "id": 128,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469623/proofs/voyfsisteribccfrkjxs.jpg",
    "label": "IMG_20240921_015149_108.jpg"
  },
  {
    "id": 129,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469624/proofs/xryptdz8uosxjkxuvp8h.jpg",
    "label": "IMG_20240921_015150_914.jpg"
  },
  {
    "id": 130,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469625/proofs/lyzth99bbaecfw15ss0z.jpg",
    "label": "IMG_20240921_015151_365.jpg"
  },
  {
    "id": 131,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469628/proofs/qfrqp0x9t8kfhw5ori3x.jpg",
    "label": "IMG_20240921_015153_505.jpg"
  },
  {
    "id": 132,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469630/proofs/eoryforijcytszzkjut9.jpg",
    "label": "IMG_20240921_015155_102.jpg"
  },
  {
    "id": 133,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469631/proofs/h1ljx3u6qrmhds58nwbg.jpg",
    "label": "IMG_20240921_015157_538.jpg"
  },
  {
    "id": 134,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469633/proofs/y0g4admi8ryjwn99p94u.jpg",
    "label": "IMG_20240921_015158_990.jpg"
  },
  {
    "id": 135,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469637/proofs/xkwtjh4g5fxzh0svk5lq.jpg",
    "label": "IMG_20240921_015200_281.jpg"
  },
  {
    "id": 136,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469638/proofs/w8wwvj7itfyuix3aj4wb.jpg",
    "label": "IMG_20240921_015201_771.jpg"
  },
  {
    "id": 137,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469640/proofs/wdbwajvkgdevu0wse6oe.jpg",
    "label": "IMG_20240921_015203_836.jpg"
  },
  {
    "id": 138,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469642/proofs/bfr6qge4ov4xniawgunh.jpg",
    "label": "IMG_20240921_015204_982.jpg"
  },
  {
    "id": 139,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469643/proofs/ypahf4ten9oah1qzywub.jpg",
    "label": "IMG_20240921_015206_341.jpg"
  },
  {
    "id": 140,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469647/proofs/in0k0saiveflrjng04op.jpg",
    "label": "IMG_20240921_015207_833.jpg"
  },
  {
    "id": 141,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469650/proofs/j98d8gy0kto29vdk0h4h.jpg",
    "label": "IMG_20240921_015209_121.jpg"
  },
  {
    "id": 142,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469652/proofs/lvsxs6swlwdrjb5sre5w.jpg",
    "label": "IMG_20240921_015210_421.jpg"
  },
  {
    "id": 143,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469654/proofs/ekj8zhq0yz8kxn0l2vjo.jpg",
    "label": "IMG_20240921_015212_135.jpg"
  },
  {
    "id": 144,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469656/proofs/lwupvqjq4uxc0bxg4e7e.jpg",
    "label": "IMG_20240921_015212_851.jpg"
  },
  {
    "id": 145,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469658/proofs/puvkn0dexa35bcypvaw4.jpg",
    "label": "IMG_20240921_015214_146.jpg"
  },
  {
    "id": 146,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469660/proofs/hszbfrovu4swu45dr93v.jpg",
    "label": "IMG_20240921_015215_188.jpg"
  },
  {
    "id": 147,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469661/proofs/gpmfkh8pppuqopl3wmgx.jpg",
    "label": "IMG_20240921_015217_651.jpg"
  },
  {
    "id": 148,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469664/proofs/xwjg7jqrptbsxekeou1r.jpg",
    "label": "IMG_20240921_015218_449.jpg"
  },
  {
    "id": 149,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469666/proofs/muxt6qmqofezvfkqifls.jpg",
    "label": "IMG_20240921_015219_844.jpg"
  },
  {
    "id": 150,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469668/proofs/awdtfsw09onj47wtrw4s.jpg",
    "label": "IMG_20240921_015225_765.jpg"
  },
  {
    "id": 151,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469671/proofs/r8yjb9r8vsjf1qqpk0kx.jpg",
    "label": "IMG_20240921_015227_341.jpg"
  },
  {
    "id": 152,
    "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469673/proofs/p9fcchhgnqdszjvv5zfd.jpg",
    "label": "Screenshot_2024-09-21-01-49-35-18_948cd9899890cbd5c2798760b2b95377.jpg"
  }
  
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

  // ── Payment modal state ─────────────────────────────────────────────────
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalOrder, setModalOrder] = useState(null); // { amount, productId, productName }
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [modalError, setModalError] = useState("");
  const [submittingMethod, setSubmittingMethod] = useState(null); // "upi" | "bank" | null
  // Tracks the post-UPI-click "did the buyer leave and come back" flow: once
  // they tap "Pay with UPI" we set upiInitiated, then watch for the tab
  // becoming visible again (they've returned from their UPI app) to flip the
  // button into "Proceed to WhatsApp".
  const [upiInitiated, setUpiInitiated] = useState(false);
  const [showUpiWhatsappCta, setShowUpiWhatsappCta] = useState(false);

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

  // Buy Now no longer navigates straight to the payment page — it opens the
  // payment modal (amount + contact details + UPI/bank choice) instead.
  const handleBuyNowClick = () => {
    if (!product || typeof product.price === "undefined") {
      alert("Error: Could not retrieve product details. Please try again later.");
      return;
    }
    openPaymentModal({ amount: product.price, productId: id, productName: product.name || "Product" });
  };

  // TradingView-style: "Buy Now" opens the same payment modal, using the
  // selected plan's real fetched price.
  const handleTradingViewBuyNowClick = () => {
    const plan = tradingViewPlans.find(p => p.id === selectedPlanId);
    const price = planPrices[selectedPlanId]?.price;

    if (!plan || price === null || typeof price === "undefined") {
      alert("Error: Could not retrieve plan pricing. Please try again in a moment.");
      return;
    }

    openPaymentModal({
      amount: price,
      productId: plan.id,
      productName: `${product?.name || "Product"} — ${plan.duration}`,
    });
  };

  const openPaymentModal = (order) => {
    setModalOrder(order);
    setContactEmail("");
    setContactPhone("");
    setModalError("");
    setSubmittingMethod(null);
    setUpiInitiated(false);
    setShowUpiWhatsappCta(false);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    if (submittingMethod) return; // don't let them close mid-submit
    setShowPaymentModal(false);
    setModalOrder(null);
    setUpiInitiated(false);
    setShowUpiWhatsappCta(false);
  };

  // Once the buyer has tapped "Pay with UPI" (upiInitiated), watch for them
  // returning to this tab — that's our signal they've been over to their UPI
  // app and (hopefully) finished paying. When they come back, flip the UPI
  // button into "Proceed to WhatsApp" so they can go confirm the order.
  useEffect(() => {
    if (!showPaymentModal || !upiInitiated) return;

    const handleReturn = () => {
      if (document.visibilityState === "visible") {
        setShowUpiWhatsappCta(true);
      }
    };

    document.addEventListener("visibilitychange", handleReturn);
    window.addEventListener("focus", handleReturn); // fallback for in-app webviews
    return () => {
      document.removeEventListener("visibilitychange", handleReturn);
      window.removeEventListener("focus", handleReturn);
    };
  }, [showPaymentModal, upiInitiated]);

  // Sends the buyer straight to WhatsApp — used for bank transfer (always)
  // and for the "Proceed to WhatsApp" state of the UPI button (after they've
  // already paid and come back to the tab).
  const goToWhatsApp = (context) => {
    if (!modalOrder) return;
    const link = buildWhatsAppLink({
      amount: modalOrder.amount,
      productName: modalOrder.productName,
      context,
    });
    window.location.href = link;
  };

  // Validates the contact fields, notifies the backend (which relays the
  // order to Telegram), then either fires the UPI deep link or sends the
  // buyer straight to WhatsApp for bank transfer.
  const submitPayment = async (method) => {
    if (!modalOrder) return;

    if (!isValidEmailOrUsername(contactEmail)) {
      setModalError("Please enter a valid email or TradingView username.");
      return;
    }
    if (!isValidIndianPhone(contactPhone)) {
      setModalError("Please enter a valid 10-digit phone number.");
      return;
    }
    setModalError("");
    setSubmittingMethod(method);

    const orderPayload = {
      productId: modalOrder.productId,
      productName: modalOrder.productName,
      amount: modalOrder.amount,
      email: contactEmail.trim(),
      phone: contactPhone.trim(),
      method,
    };

    try {
      await fetch(getNotifyEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
    } catch (err) {
      // Don't block the payment flow on a notify failure — the buyer still
      // needs to be able to pay. Just log it for now.
      console.error("Failed to notify backend of order:", err);
    }

    if (method === "upi") {
      const upiLink = buildUpiDeepLink({
        amount: modalOrder.amount,
        note: `${modalOrder.productName} - ${id}`,
      });
      setUpiInitiated(true);
      window.location.href = upiLink;
      // Give the deep link a brief moment to hand off to the UPI app before
      // resetting the button state (in case it doesn't leave the page, e.g.
      // on desktop where no UPI app is installed).
      setTimeout(() => setSubmittingMethod(null), 2500);
    } else {
      // Bank transfer now goes straight to WhatsApp instead of a separate
      // payment page.
      goToWhatsApp("bank");
    }
  };

  // Compact renderer used for the countdown chip inside the sticky Buy Now
  // bar — same countdownEnd target as the main timer, just a smaller display
  // so it fits next to the price and button.
  const renderStickyCountdown = ({ hours, minutes, seconds, completed }) => {
    if (completed) return <span className="pp-sticky-timer-expired">Offer Expired</span>;
    return (
      <span className="pp-sticky-timer">
        <span className="pp-sticky-timer-icon">⏳</span>
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
              {["⚡ Fast Delivery","🔒 Secure Payment","♾️ Single Ownership","🔄 Replacement Guarantee"].map(t => (
                <span key={t} className="pp-trust-pill">{t}</span>
              ))}
            </div>
          </div>

          <div className="pp-detail-col">
            <span className="pp-eyebrow">Digital Product · Premium</span>
            <h1 className="pp-title">{product.name}</h1>

            <div className="pp-countdown-card">
              <p className="pp-countdown-label"><span className="pp-live-dot" />⏳ Limited time offer ends in</p>
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
                     <button type="button" className="pp-proofs-cta" onClick={scrollToProofs}>
              🔍 Show me some proofs first
            </button>
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
          <Countdown date={countdownEnd} renderer={renderStickyCountdown} />
          <button
            className="pp-sticky-buy-btn"
            onClick={stickyHandler}
            disabled={stickyDisabled}
          >
            Buy Now <span className="pp-btn-arrow">→</span>
          </button>
        </div>
      )}

      {/* ---------- UPI / Bank payment modal ---------- */}
      {showPaymentModal && modalOrder && (
        <div className="pp-modal-overlay" onClick={closePaymentModal}>
          <div className="pp-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pp-modal-close"
              onClick={closePaymentModal}
              aria-label="Close"
              disabled={!!submittingMethod}
            >
              ✕
            </button>

            <span className="pp-modal-eyebrow">Complete Your Order</span>
            <div className="pp-modal-title">{modalOrder.productName}</div>
            <div className="pp-modal-amount">{formatINR(modalOrder.amount)}</div>

            <div className="pp-modal-field">
              <label className="pp-modal-label" htmlFor="pp-modal-email">
                Email / TradingView username
              </label>
              <input
                id="pp-modal-email"
                className="pp-modal-input"
                type="text"
                placeholder="you@example.com or tv_username"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={!!submittingMethod}
              />
            </div>

            <div className="pp-modal-field">
              <label className="pp-modal-label" htmlFor="pp-modal-phone">
                Phone number
              </label>
              <input
                id="pp-modal-phone"
                className="pp-modal-input"
                type="tel"
                placeholder="10-digit mobile number"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={!!submittingMethod}
              />
            </div>

            {modalError && <p className="pp-modal-error">{modalError}</p>}

            <div className="pp-modal-actions">
              <button
                type="button"
                className="pp-modal-btn pp-modal-btn--upi"
                onClick={() => (showUpiWhatsappCta ? goToWhatsApp("upi-confirm") : submitPayment("upi"))}
                disabled={!!submittingMethod}
              >
                {showUpiWhatsappCta
                  ? "Proceed to WhatsApp"
                  : submittingMethod === "upi"
                  ? "Opening UPI app…"
                  : "Pay with UPI"}
              </button>
              <button
                type="button"
                className="pp-modal-btn pp-modal-btn--bank"
                onClick={() => submitPayment("bank")}
                disabled={!!submittingMethod}
              >
                {submittingMethod === "bank" ? "Redirecting…" : "Pay with Bank Transfer"}
              </button>
            </div>

            <p className="pp-modal-note">
              {showUpiWhatsappCta
                ? "Tap \"Proceed to WhatsApp\" to confirm your payment and get your order delivered."
                : "\"Pay with UPI\" opens your UPI app directly with the amount pre-filled. Your details are used only to confirm and deliver this order."}
            </p>
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