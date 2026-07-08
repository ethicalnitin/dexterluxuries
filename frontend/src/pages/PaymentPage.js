import React, { useState, useMemo, useEffect, useLayoutEffect, useCallback, useRef } from "react";

const WHATSAPP_NUMBER = "919289847981";

// ── Payment config ────────────────────────────────────────────────────────
const UPI_ID = "paytm.s2znhpg@pty";
const PAYEE_NAME = "ChartVault";
const QR_IMAGE_URL = "https://i.ibb.co/cSFGRFqY/image.png";
const PAYMENT_WINDOW_SECONDS = 10 * 60; // 10 minutes

// Backend base URL. Leave empty when the Express server serves the React
// build itself (see index.js — express.static + catch-all), since then
// "/api/deposit" is same-origin. If you ever split frontend/backend across
// two hosts, set this to the backend's full origin instead, e.g.
// "https://dexterluxuries.onrender.com".
const API_BASE = "";
// ─────────────────────────────────────────────────────────────────────────

function getHashParams() {
  const hash = window.location.hash;
  const queryStart = hash.indexOf("?");
  if (queryStart === -1) return new URLSearchParams("");
  return new URLSearchParams(hash.slice(queryStart + 1));
}

function formatINR(amount) {
  const num = Number(amount);
  if (isNaN(num)) return null;
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatMMSS(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function makeOrderRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `DX-${suffix}`;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function PaymentPage() {
  const [step, setStep] = useState(1); // 1 = pay, 2 = confirm, 3 = done
  const [copied, setCopied] = useState(false);
  const [orderRef] = useState(makeOrderRef);

  // ── Step 2 form state ─────────────────────────────────────────────────
  const [identifier, setIdentifier] = useState(""); // email or username
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // ── Scroll fixes ─────────────────────────────────────────────────────
  // The route uses a hash with query params (e.g. "#/payment?amount=..."),
  // and some browsers treat anything after "#" as an anchor target and
  // auto-scroll to it on load. Force the viewport back to the top before
  // the first paint so the page never lands mid-scroll.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Every time the step changes (Pay → Confirm → Done), bring the top of
  // the page back into view instead of leaving the scroll wherever the
  // previous step happened to be — otherwise the new step's content (e.g.
  // the confirmation form) can render below the fold.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const urlParams = useMemo(() => {
    const params = getHashParams();
    const rawAmt = params.get("amount") || "";
    const rawName = params.get("productName") || "";

    let productName = "";
    try {
      productName = decodeURIComponent(rawName.replace(/\+/g, " "));
    } catch {
      productName = rawName;
    }

    const numericAmount = rawAmt && !isNaN(Number(rawAmt)) ? Number(rawAmt) : null;
    const displayAmount = numericAmount !== null ? formatINR(numericAmount) : null;

    return { numericAmount, displayAmount, productName };
  }, []);

  // ── 10-minute payment countdown ───────────────────────────────────────
  const [deadline] = useState(() => Date.now() + PAYMENT_WINDOW_SECONDS * 1000);
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_WINDOW_SECONDS);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.round((deadline - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, remaining));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const expired = step === 1 && secondsLeft <= 0;
  const urgent = step === 1 && !expired && secondsLeft <= 60;
  const progressPct = Math.max(0, Math.min(100, (secondsLeft / PAYMENT_WINDOW_SECONDS) * 100));
  // ─────────────────────────────────────────────────────────────────────

  const upiDeepLink = useMemo(() => {
    const params = new URLSearchParams();
    params.set("pa", UPI_ID);
    params.set("pn", PAYEE_NAME);
    if (urlParams.numericAmount !== null) {
      params.set("am", String(urlParams.numericAmount));
    }
    params.set("cu", "INR");
    params.set("tn", urlParams.productName || "Payment");
    return `upi://pay?${params.toString()}`;
  }, [urlParams]);

  function handlePayNow() {
    if (expired) return;
    window.location.href = upiDeepLink;
  }

  function handleCopyUpi() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(UPI_ID).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    }
  }

  const buildWhatsAppMessage = useCallback(() => {
    const lines = [
      `Hi, I'd like to place an order on ChartVault.`,
      ``,
      urlParams.productName ? `Product: ${urlParams.productName}` : null,
      urlParams.displayAmount !== null ? `Amount: Rs. ${urlParams.displayAmount}` : null,
      `Order ref: ${orderRef}`,
      utr.trim() ? `UTR: ${utr.trim()}` : null,
      identifier.trim() ? `Account: ${identifier.trim()}` : null,
      ``,
      step === 3
        ? `I've submitted my payment proof — please confirm and activate my order.`
        : `Please assist me with payment. Thank you!`,
    ]
      .filter((l) => l !== null)
      .join("\n");
    return lines;
  }, [urlParams, orderRef, utr, identifier, step]);

  const openWhatsApp = useCallback(() => {
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage())}`,
      "_blank"
    );
  }, [buildWhatsAppMessage]);

  // ── Step 2: file handling ───────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormError("Only JPG, PNG, WEBP or GIF screenshots are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Screenshot must be under 10MB.");
      return;
    }

    setFormError("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setScreenshot(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemoveScreenshot() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setScreenshot(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Step 2: submit proof to backend → Telegram ───────────────────────
  async function handleSubmitProof(e) {
    e.preventDefault();
    setFormError("");

    if (!identifier.trim() || identifier.trim().length < 3) {
      setFormError("Enter the email or username you used to sign up.");
      return;
    }
    if (!utr.trim() || utr.trim().length < 6) {
      setFormError("That UTR / transaction ID looks too short — double-check and re-enter it.");
      return;
    }
    if (!screenshot) {
      setFormError("Attach a screenshot of the payment confirmation.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("email", identifier.trim());
      fd.append("utr", utr.trim());
      fd.append("screenshot", screenshot);
      if (urlParams.numericAmount !== null) fd.append("amount", String(urlParams.numericAmount));
      fd.append("method", "UPI");
      if (urlParams.productName) fd.append("productName", urlParams.productName);
      fd.append("orderRef", orderRef);

      const res = await fetch(`${API_BASE}/api/deposit`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStep(3);
    } catch (err) {
      setFormError(err.message || "Couldn't submit — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --ink: #08090C;
      --panel: #14161C;
      --panel-2: #1B1E26;
      --gold: #C9A876;
      --gold-soft: #E8D9B8;
      --text: #F3F1EA;
      --text-dim: rgba(243,241,234,.52);
      --text-faint: rgba(243,241,234,.28);
      --line: rgba(243,241,234,.12);
      --wa: #25D366;
      --danger: #E2645A;
    }

    body { background: var(--ink); }

    .page {
      min-height: 100vh;
      background: var(--ink);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      position: relative;
      overflow: hidden;
    }

    .page::before {
      content: '';
      position: fixed;
      inset: 0;
      background: radial-gradient(ellipse 60% 45% at 50% 0%, rgba(201,168,118,.08) 0%, transparent 68%);
      pointer-events: none;
    }

    .wrap {
      width: 100%;
      max-width: 620px;
      position: relative;
      z-index: 1;
      animation: rise .6s cubic-bezier(.22,1,.36,1) both;
    }

    @keyframes rise {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .brandbar {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 18px;
      padding: 0 4px;
    }

    .brand {
      font-family: 'Fraunces', serif;
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--text);
      letter-spacing: .2px;
    }

    .brand em {
      font-style: normal;
      color: var(--gold);
    }

    .brand-sub {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1.6px;
      text-transform: uppercase;
      color: var(--text-faint);
    }

    .brand-sub svg { width: 11px; height: 11px; color: var(--gold); }

    /* ---------- Stepper ---------- */
    .stepper {
      display: flex;
      align-items: center;
      gap: 0;
      margin-bottom: 22px;
      padding: 0 2px;
    }

    .step-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-dot {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      border: 1.5px solid var(--line);
      color: var(--text-faint);
      flex-shrink: 0;
      transition: all .25s ease;
    }

    .step-item.is-active .step-dot {
      border-color: var(--gold);
      color: var(--gold);
      background: rgba(201,168,118,.1);
    }

    .step-item.is-done .step-dot {
      border-color: var(--gold);
      background: var(--gold);
      color: #14161C;
    }

    .step-item.is-done .step-dot svg { width: 11px; height: 11px; }

    .step-label {
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-faint);
      letter-spacing: .3px;
      white-space: nowrap;
    }

    .step-item.is-active .step-label,
    .step-item.is-done .step-label { color: var(--text-dim); }

    .step-connector {
      flex: 1;
      height: 1px;
      background: var(--line);
      margin: 0 10px;
      position: relative;
      top: -10px;
    }

    /* ---------- Ticket card ---------- */
    .ticket {
      display: flex;
      flex-direction: column;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 18px;
      box-shadow: 0 40px 90px rgba(0,0,0,.55);
      overflow: hidden;
    }

    @media (min-width: 680px) {
      .ticket { flex-direction: row; }
    }

    .stub {
      flex: 0 0 auto;
      padding: 30px 28px;
      display: flex;
      flex-direction: column;
    }

    @media (min-width: 680px) {
      .stub { width: 226px; }
    }

    .stub-label {
      font-family: 'Inter', sans-serif;
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--text-faint);
      margin-bottom: 10px;
    }

    .stub-name {
      font-family: 'Fraunces', serif;
      font-size: 1.15rem;
      font-weight: 500;
      color: var(--text);
      line-height: 1.3;
      margin-bottom: 22px;
    }

    .stub-amount-label {
      font-family: 'Inter', sans-serif;
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--text-faint);
      margin-bottom: 6px;
    }

    .stub-amount {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 2.15rem;
      font-weight: 600;
      color: var(--gold-soft);
      line-height: 1;
      font-variant-numeric: tabular-nums;
      margin-bottom: auto;
    }

    .stub-meta {
      margin-top: 26px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .stub-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .stub-meta-key {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      color: var(--text-faint);
      letter-spacing: .3px;
    }

    .stub-meta-val {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      color: var(--text-dim);
      font-variant-numeric: tabular-nums;
    }

    .stub-status {
      margin-top: 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      align-self: flex-start;
      padding: 4px 9px;
      border-radius: 20px;
      font-family: 'Inter', sans-serif;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: .4px;
      text-transform: uppercase;
      background: rgba(201,168,118,.12);
      color: var(--gold-soft);
    }

    .stub-status.stub-status--done {
      background: rgba(37,211,102,.12);
      color: var(--wa);
    }

    .stub-status svg { width: 10px; height: 10px; }

    /* ---------- Perforated divider ---------- */
    .perf {
      position: relative;
      flex-shrink: 0;
      background-image: repeating-linear-gradient(
        to bottom, var(--line) 0 6px, transparent 6px 14px
      );
      width: 1px;
      display: none;
    }

    @media (min-width: 680px) {
      .perf { display: block; }
    }

    .perf-notch {
      position: absolute;
      left: 50%;
      width: 18px;
      height: 18px;
      background: var(--ink);
      border-radius: 50%;
      transform: translateX(-50%);
    }

    .perf-notch--top { top: -9px; }
    .perf-notch--bottom { bottom: -9px; }

    .perf-h {
      position: relative;
      height: 1px;
      background-image: repeating-linear-gradient(
        to right, var(--line) 0 6px, transparent 6px 14px
      );
    }

    @media (min-width: 680px) {
      .perf-h { display: none; }
    }

    .perf-h-notch {
      position: absolute;
      top: 50%;
      width: 18px;
      height: 18px;
      background: var(--ink);
      border-radius: 50%;
      transform: translateY(-50%);
    }

    .perf-h-notch--left { left: -9px; }
    .perf-h-notch--right { right: -9px; }

    /* ---------- Main section ---------- */
    .main {
      flex: 1;
      padding: 30px 30px 26px;
      display: flex;
      flex-direction: column;
    }

    .timer { margin-bottom: 22px; }

    .timer-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .timer-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: var(--text-dim);
    }

    .timer-label svg { width: 12px; height: 12px; color: var(--text-faint); }

    .timer-value {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--gold-soft);
      font-variant-numeric: tabular-nums;
      letter-spacing: .5px;
    }

    .timer.timer--urgent .timer-value { color: var(--danger); }
    .timer.timer--expired .timer-value { color: var(--danger); }

    .timer-track {
      height: 3px;
      background: var(--line);
      border-radius: 3px;
      overflow: hidden;
    }

    .timer-fill {
      height: 100%;
      background: var(--gold);
      border-radius: 3px;
      transition: width 1s linear, background .3s;
    }

    .timer--urgent .timer-fill { background: var(--danger); }
    .timer--expired .timer-fill { background: var(--danger); }

    .scan-block {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-bottom: 20px;
    }

    .scan-frame {
      position: relative;
      flex-shrink: 0;
      width: 128px;
      height: 128px;
      background: #fff;
      border-radius: 10px;
      padding: 8px;
    }

    .scan-frame img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 3px;
      display: block;
    }

    .scan-frame.scan-frame--expired img {
      opacity: .2;
      filter: grayscale(1);
    }

    .scan-corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid var(--gold);
    }

    .scan-corner--tl { top: -6px; left: -6px; border-right: none; border-bottom: none; border-radius: 4px 0 0 0; }
    .scan-corner--tr { top: -6px; right: -6px; border-left: none; border-bottom: none; border-radius: 0 4px 0 0; }
    .scan-corner--bl { bottom: -6px; left: -6px; border-right: none; border-top: none; border-radius: 0 0 0 4px; }
    .scan-corner--br { bottom: -6px; right: -6px; border-left: none; border-top: none; border-radius: 0 0 4px 0; }

    .scan-expired-tag {
      position: absolute;
      inset: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(8,9,12,.78);
      border-radius: 3px;
      color: var(--text);
      font-family: 'Inter', sans-serif;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: .6px;
      text-transform: uppercase;
      text-align: center;
      padding: 6px;
    }

    .scan-info {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }

    .scan-info-title {
      font-family: 'Inter', sans-serif;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text);
    }

    .scan-info-sub {
      font-family: 'Inter', sans-serif;
      font-size: 11.5px;
      color: var(--text-dim);
      line-height: 1.5;
    }

    .upi-chip {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      align-self: flex-start;
      background: var(--panel-2);
      border: 1px solid var(--line);
      border-radius: 7px;
      padding: 6px 10px;
      cursor: pointer;
      transition: border-color .2s, background .2s;
    }

    .upi-chip:hover { border-color: rgba(201,168,118,.4); }

    .upi-chip-text {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11.5px;
      color: var(--text);
    }

    .upi-chip svg { width: 12px; height: 12px; color: var(--gold); flex-shrink: 0; }

    .copied-note {
      font-family: 'Inter', sans-serif;
      font-size: 10.5px;
      color: var(--gold);
      margin-top: -4px;
    }

    /* ---------- Buttons ---------- */
    .pay-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      padding: 15px 20px;
      background: var(--gold);
      border: none;
      border-radius: 9px;
      color: #14161C;
      font-family: 'Inter', sans-serif;
      font-size: 13.5px;
      font-weight: 700;
      letter-spacing: .2px;
      cursor: pointer;
      transition: background .2s, transform .15s, box-shadow .2s, opacity .2s;
      box-shadow: 0 14px 34px rgba(201,168,118,.18);
    }

    .pay-btn:hover { background: var(--gold-soft); transform: translateY(-1px); }
    .pay-btn:active { transform: translateY(0); }
    .pay-btn:disabled {
      opacity: .35;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .pay-btn svg { width: 15px; height: 15px; }

    .secondary-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 13px 20px;
      background: var(--panel-2);
      border: 1px solid var(--line);
      border-radius: 9px;
      color: var(--text);
      font-family: 'Inter', sans-serif;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: border-color .2s, background .2s;
      margin-top: 10px;
    }

    .secondary-btn:hover { border-color: rgba(201,168,118,.4); background: rgba(201,168,118,.06); }
    .secondary-btn svg { width: 14px; height: 14px; }

    .divider-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 16px 0;
    }

    .divider-line { flex: 1; height: 1px; background: var(--line); }

    .divider-text {
      font-family: 'Inter', sans-serif;
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 1.6px;
      text-transform: uppercase;
      color: var(--text-faint);
    }

    .wa-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      padding: 12.5px 20px;
      background: transparent;
      border: 1px solid var(--line);
      border-radius: 9px;
      color: var(--text-dim);
      font-family: 'Inter', sans-serif;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: border-color .2s, color .2s, background .2s;
    }

    .wa-btn:hover {
      border-color: rgba(37,211,102,.4);
      color: var(--wa);
      background: rgba(37,211,102,.05);
    }

    .wa-btn.wa-btn--solid {
      background: var(--wa);
      border-color: var(--wa);
      color: #08090C;
      font-weight: 700;
    }

    .wa-btn.wa-btn--solid:hover { background: #2fe07a; }

    .wa-btn svg { width: 15px; height: 15px; flex-shrink: 0; }

    .status-note {
      margin-top: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
    }

    .status-note--ok { color: var(--wa); }
    .status-note--danger { color: var(--danger); }
    .status-note svg { width: 13px; height: 13px; flex-shrink: 0; }

    /* ---------- Step 2: form ---------- */
    .form-head { margin-bottom: 18px; }

    .form-title {
      font-family: 'Fraunces', serif;
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 6px;
    }

    .form-sub {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: var(--text-dim);
      line-height: 1.5;
    }

    .form-group { margin-bottom: 16px; }

    .form-label {
      display: block;
      font-family: 'Inter', sans-serif;
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: .5px;
      text-transform: uppercase;
      color: var(--text-faint);
      margin-bottom: 7px;
    }

    .form-input {
      width: 100%;
      padding: 12px 14px;
      background: var(--panel-2);
      border: 1px solid var(--line);
      border-radius: 8px;
      color: var(--text);
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      transition: border-color .2s;
    }

    .form-input::placeholder { color: var(--text-faint); }
    .form-input:focus {
      outline: none;
      border-color: var(--gold);
    }

    .form-input--mono { font-family: 'IBM Plex Mono', monospace; letter-spacing: .3px; }

    .file-field {
      border: 1.5px dashed var(--line);
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      transition: border-color .2s, background .2s;
    }

    .file-field:hover { border-color: rgba(201,168,118,.5); background: rgba(201,168,118,.04); }

    .file-field svg { width: 20px; height: 20px; color: var(--gold); margin-bottom: 6px; }

    .file-field-text {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: var(--text-dim);
    }

    .file-field-hint {
      font-family: 'Inter', sans-serif;
      font-size: 10.5px;
      color: var(--text-faint);
      margin-top: 3px;
    }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      background: var(--panel-2);
    }

    .file-preview img {
      width: 52px;
      height: 52px;
      object-fit: cover;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .file-preview-name {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: var(--text);
      word-break: break-all;
    }

    .file-preview-remove {
      margin-left: auto;
      background: none;
      border: none;
      color: var(--text-faint);
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      flex-shrink: 0;
      padding: 6px 8px;
    }

    .file-preview-remove:hover { color: var(--danger); }

    .form-error {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: rgba(226,100,90,.1);
      border: 1px solid rgba(226,100,90,.3);
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 16px;
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      color: #F2A79F;
      line-height: 1.5;
    }

    .form-error svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: none;
      border: none;
      color: var(--text-faint);
      font-family: 'Inter', sans-serif;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 16px;
      align-self: flex-start;
      padding: 0;
    }

    .back-link:hover { color: var(--text-dim); }
    .back-link svg { width: 12px; height: 12px; }

    .submit-btn { position: relative; }

    .spinner {
      width: 15px;
      height: 15px;
      border: 2px solid rgba(20,22,28,.3);
      border-top-color: #14161C;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ---------- Step 3: success ---------- */
    .success-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 10px 4px 4px;
    }

    .success-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(37,211,102,.12);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
      animation: pop .5s cubic-bezier(.22,1,.36,1) both;
    }

    @keyframes pop {
      from { transform: scale(.6); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .success-icon svg { width: 26px; height: 26px; color: var(--wa); }

    .success-title {
      font-family: 'Fraunces', serif;
      font-size: 1.35rem;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 8px;
    }

    .success-sub {
      font-family: 'Inter', sans-serif;
      font-size: 12.5px;
      color: var(--text-dim);
      line-height: 1.6;
      max-width: 340px;
      margin-bottom: 22px;
    }

    .success-sub b { color: var(--gold-soft); font-weight: 600; }

    .success-actions { width: 100%; max-width: 320px; }

    .success-meta {
      display: flex;
      gap: 18px;
      margin-top: 20px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .success-meta-item { text-align: center; }

    .success-meta-key {
      font-family: 'Inter', sans-serif;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--text-faint);
      margin-bottom: 4px;
    }

    .success-meta-val {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11.5px;
      color: var(--text-dim);
    }

    /* ---------- Trust strip + footer ---------- */
    .trust-strip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 22px;
      margin-top: 20px;
      flex-wrap: wrap;
    }

    .trust-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      color: var(--text-faint);
      letter-spacing: .3px;
    }

    .trust-item svg { width: 12px; height: 12px; color: var(--gold); }

    .footer {
      margin-top: 18px;
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-size: 9px;
      letter-spacing: 1.6px;
      text-transform: uppercase;
      color: rgba(243,241,234,.15);
    }

    @media (max-width: 400px) {
      .scan-block { flex-direction: column; align-items: flex-start; }
      .scan-frame { width: 112px; height: 112px; }
      .trust-strip { gap: 14px 18px; }
      .step-label { display: none; }
    }
  `;

  return (
    <div className="page">
      <style>{css}</style>

      <div className="wrap">
        <div className="brandbar">
          <div className="brand">
            Chart<em>Vault</em>
          </div>
          <div className="brand-sub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="1.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Secure Checkout
          </div>
        </div>

        {/* ---------- Stepper ---------- */}
        <div className="stepper">
          {[
            { n: 1, label: "Pay" },
            { n: 2, label: "Confirm" },
            { n: 3, label: "Done" },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`step-item ${step === s.n ? "is-active" : ""} ${step > s.n ? "is-done" : ""}`}>
                <div className="step-dot">
                  {step > s.n ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12l5 5L19 7" />
                    </svg>
                  ) : (
                    s.n
                  )}
                </div>
                <span className="step-label">{s.label}</span>
              </div>
              {i < 2 && <div className="step-connector" />}
            </React.Fragment>
          ))}
        </div>

        <div className="ticket">
          <div className="stub">
            <div className="stub-label">Order</div>
            <div className="stub-name">
              {urlParams.productName || "ChartVault Product"}
            </div>

            <div className="stub-amount-label">Amount Due</div>
            <div className="stub-amount">
              {urlParams.displayAmount !== null ? `₹${urlParams.displayAmount}` : "—"}
            </div>

            <div className="stub-meta">
              <div className="stub-meta-row">
                <span className="stub-meta-key">Reference</span>
                <span className="stub-meta-val">{orderRef}</span>
              </div>
              <div className="stub-meta-row">
                <span className="stub-meta-key">Method</span>
                <span className="stub-meta-val">UPI</span>
              </div>
            </div>

            {step === 2 && (
              <div className="stub-status">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                Awaiting proof
              </div>
            )}
            {step === 3 && (
              <div className="stub-status stub-status--done">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12l5 5L19 7" />
                </svg>
                Submitted
              </div>
            )}
          </div>

          <div className="perf-h">
            <span className="perf-h-notch perf-h-notch--left" />
            <span className="perf-h-notch perf-h-notch--right" />
          </div>
          <div className="perf">
            <span className="perf-notch perf-notch--top" />
            <span className="perf-notch perf-notch--bottom" />
          </div>

          <div className="main">
            {/* ================= STEP 1: PAY ================= */}
            {step === 1 && (
              <>
                <div className={`timer ${expired ? "timer--expired" : urgent ? "timer--urgent" : ""}`}>
                  <div className="timer-top">
                    <span className="timer-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 3" />
                      </svg>
                      {expired ? "Window expired" : "Payment window"}
                    </span>
                    {!expired && <span className="timer-value">{formatMMSS(secondsLeft)}</span>}
                  </div>
                  <div className="timer-track">
                    <div className="timer-fill" style={{ width: `${expired ? 0 : progressPct}%` }} />
                  </div>
                </div>

                <div className="scan-block">
                  <div className={`scan-frame ${expired ? "scan-frame--expired" : ""}`}>
                    <span className="scan-corner scan-corner--tl" />
                    <span className="scan-corner scan-corner--tr" />
                    <span className="scan-corner scan-corner--bl" />
                    <span className="scan-corner scan-corner--br" />
                    <img src={QR_IMAGE_URL} alt="Scan to pay via UPI" />
                    {expired && <div className="scan-expired-tag">Expired</div>}
                  </div>

                  <div className="scan-info">
                    <div className="scan-info-title">Scan with any UPI app</div>
                    <div className="scan-info-sub">GPay, PhonePe, Paytm, or your bank's app.</div>
                    <div className="upi-chip" onClick={handleCopyUpi} role="button" tabIndex={0}>
                      <span className="upi-chip-text">{UPI_ID}</span>
                      {copied ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12l5 5L19 7" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="12" height="12" rx="2" />
                          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                        </svg>
                      )}
                    </div>
                    {copied && <div className="copied-note">Copied to clipboard</div>}
                  </div>
                </div>

                <button className="pay-btn" onClick={handlePayNow} disabled={expired}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
                  </svg>
                  Pay Now{urlParams.displayAmount !== null ? ` — ₹${urlParams.displayAmount}` : ""}
                </button>

                <button className="secondary-btn" onClick={() => setStep(2)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12l5 5L19 7" />
                  </svg>
                  I've completed the payment
                </button>

                <div className="divider-row">
                  <div className="divider-line" />
                  <div className="divider-text">or</div>
                  <div className="divider-line" />
                </div>

                <button className="wa-btn" onClick={openWhatsApp}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                  </svg>
                  Continue on WhatsApp instead
                </button>

                {expired && (
                  <div className="status-note status-note--danger">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v5M12 16h.01" />
                    </svg>
                    Window closed — message us on WhatsApp for a new link
                  </div>
                )}
              </>
            )}

            {/* ================= STEP 2: CONFIRM ================= */}
            {step === 2 && (
              <>
                <button className="back-link" onClick={() => setStep(1)} type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Back to payment
                </button>

                <div className="form-head">
                  <div className="form-title">Confirm your payment</div>
                  <div className="form-sub">
                    Enter your transaction details and attach the payment screenshot. We'll verify it and activate your order.
                  </div>
                </div>

                <form onSubmit={handleSubmitProof}>
                  {formError && (
                    <div className="form-error">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 8v5M12 16h.01" />
                      </svg>
                      {formError}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="identifier">Email address or username</label>
                    <input
                      id="identifier"
                      className="form-input"
                      type="text"
                      placeholder="you@example.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="utr">UTR / transaction ID</label>
                    <input
                      id="utr"
                      className="form-input form-input--mono"
                      type="text"
                      placeholder="e.g. 402913827461"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="screenshot">Payment screenshot</label>
                    <input
                      ref={fileInputRef}
                      id="screenshot"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />

                    {!screenshot ? (
                      <div className="file-field" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: "0 auto 6px" }}>
                          <path d="M12 16V4M7 9l5-5 5 5" />
                          <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                        </svg>
                        <div className="file-field-text">Tap to upload screenshot</div>
                        <div className="file-field-hint">JPG, PNG, WEBP or GIF · up to 10MB</div>
                      </div>
                    ) : (
                      <div className="file-preview">
                        <img src={previewUrl} alt="Payment screenshot preview" />
                        <div className="file-preview-name">{screenshot.name}</div>
                        <button type="button" className="file-preview-remove" onClick={handleRemoveScreenshot}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <button className="pay-btn submit-btn" type="submit" disabled={submitting}>
                    {submitting ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M5 12l5 5L19 7" />
                        </svg>
                        Submit for verification
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ================= STEP 3: DONE ================= */}
            {step === 3 && (
              <div className="success-wrap">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12l5 5L19 7" />
                  </svg>
                </div>
                <div className="success-title">Payment submitted</div>
                <div className="success-sub">
                  We're verifying your transaction now. Orders are usually confirmed within <b>15–30 minutes</b>. Tap below to reach us on WhatsApp if you need anything in the meantime.
                </div>

                <div className="success-actions">
                  <button className="wa-btn wa-btn--solid" onClick={openWhatsApp}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                    </svg>
                    Continue on WhatsApp
                  </button>
                </div>

                <div className="success-meta">
                  <div className="success-meta-item">
                    <div className="success-meta-key">Order Ref</div>
                    <div className="success-meta-val">{orderRef}</div>
                  </div>
                  <div className="success-meta-item">
                    <div className="success-meta-key">UTR</div>
                    <div className="success-meta-val">{utr.trim()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="trust-strip">
          <div className="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="1.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Encrypted transfer
          </div>
          <div className="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
            </svg>
            Verified merchant
          </div>
          <div className="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12l3 3 5-6" />
            </svg>
            Instant delivery
          </div>
        </div>

        <div className="footer">© ChartVault · All rights reserved</div>
      </div>
    </div>
  );
}