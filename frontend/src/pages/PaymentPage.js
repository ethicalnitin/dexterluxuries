import React, { useState, useMemo, useEffect, useLayoutEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const WHATSAPP_NUMBER = "+12403013547";
const BRAND_NAME = "MKR Tools & Softwares";

// ── UPI config ───────────────────────────────────────────────────────────
const UPI_ID = "paytm.s2znhpg@pty";
const PAYEE_NAME = "MKR Tools & Softwares";
const QR_IMAGE_URL = "https://i.ibb.co/cSFGRFqY/image.png";

// Flip to false if the bank's UPI servers go down again.
const UPI_AVAILABLE = true;

const PAYMENT_WINDOW_SECONDS = 10 * 60; // starts the moment the page loads
const UTR_LENGTH = 12;

// Backend base URL. Leave empty when Express serves the React build itself.
const API_BASE = "https://dexterluxuries-production.up.railway.app";

// ── Helpers ──────────────────────────────────────────────────────────────
function formatINR(amount) {
  const num = Number(amount);
  if (isNaN(num)) return null;
  return num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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

// ── Brand logos (inline SVG, no external requests) ───────────────────────
// Simplified marks. To use the official artwork, download it from each
// brand's asset page and swap the contents of these components for an <img>.
function GPayLogo() {
  return (
    <span className="logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      <span className="logo-text" style={{ color: "#5F6368", fontWeight: 600 }}>Pay</span>
    </span>
  );
}

function PhonePeLogo() {
  return (
    <span className="logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22">
        <circle cx="12" cy="12" r="12" fill="#5F259F" />
        <text x="12" y="16.4" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#fff" fontFamily="'Noto Sans Devanagari','Nirmala UI',sans-serif">
          पे
        </text>
      </svg>
      <span className="logo-text" style={{ color: "#5F259F", fontWeight: 700 }}>PhonePe</span>
    </span>
  );
}

function PaytmLogo() {
  return (
    <span className="logo logo-text" aria-hidden="true" style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.6px" }}>
      <span style={{ color: "#002E6E" }}>pay</span>
      <span style={{ color: "#00BAF2" }}>tm</span>
    </span>
  );
}

const WA_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347";

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Data passed from ProductPage.js via navigate("/payment", { state: {...} }).
  const orderData = location.state || null;

  const [orderRef] = useState(makeOrderRef);
  const [phase, setPhase] = useState("pay"); // 'pay' -> 'delivery'

  const [qrRevealed, setQrRevealed] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utr, setUtr] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const isMobile = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  }, []);

  // ── Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderData) navigate("/", { replace: true });
  }, [orderData, navigate]);

  // ── Scroll fixes ─────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase]);

  const displayAmount = orderData?.amount != null ? formatINR(orderData.amount) : null;
  const productName = orderData?.productName || "Product";
  const planName = orderData?.planName || null;
  const buyerEmail = orderData?.email || "";

  // ── 10-minute payment countdown ─────────────────────────────────────
  const [deadline] = useState(() => Date.now() + PAYMENT_WINDOW_SECONDS * 1000);
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_WINDOW_SECONDS);

  useEffect(() => {
    if (phase !== "pay") return;
    const tick = () => setSecondsLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, phase]);

  const expired = phase === "pay" && secondsLeft <= 0;
  const urgent = phase === "pay" && !expired && secondsLeft <= 60;
  const progressPct = Math.max(0, Math.min(100, (secondsLeft / PAYMENT_WINDOW_SECONDS) * 100));

  // ── UTR ──────────────────────────────────────────────────────────────
  const utrValid = utr.length === UTR_LENGTH;
  const canConfirm = utrValid && !expired && !confirming;

  function handleUtrChange(e) {
    // Digits only, hard-capped at 12 (also cleans up pasted values).
    setUtr(e.target.value.replace(/\D/g, "").slice(0, UTR_LENGTH));
    if (confirmError) setConfirmError("");
  }

  // ── UPI deep links ───────────────────────────────────────────────────
  const buildUpiLink = useCallback(
    (scheme) => {
      const params = new URLSearchParams();
      params.set("pa", UPI_ID);
      params.set("pn", PAYEE_NAME);
      if (orderData?.amount != null) params.set("am", String(orderData.amount));
      params.set("cu", "INR");
      params.set("tn", `${productName} ${orderRef}`);
      return `${scheme}?${params.toString()}`;
    },
    [orderData, productName, orderRef]
  );

  const genericUpiLink = useMemo(() => buildUpiLink("upi://pay"), [buildUpiLink]);
  const gpayLink = useMemo(() => buildUpiLink("tez://upi/pay"), [buildUpiLink]);
  const phonepeLink = useMemo(() => buildUpiLink("phonepe://pay"), [buildUpiLink]);
  const paytmLink = useMemo(() => buildUpiLink("paytmmp://pay"), [buildUpiLink]);

  function handleCopy(text, setFlag) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setFlag(true);
      setTimeout(() => setFlag(false), 1800);
    });
  }

  const openWhatsApp = useCallback(
    (extraLine) => {
      const lines = [
        `Hi, I'd like to place an order on ${BRAND_NAME}.`,
        ``,
        `Product: ${productName}`,
        planName ? `Plan: ${planName}` : null,
        displayAmount !== null ? `Amount: Rs. ${displayAmount}` : null,
        `Order ref: ${orderRef}`,
        utrValid ? `UTR: ${utr}` : null,
        buyerEmail ? `Account: ${buyerEmail}` : null,
        extraLine || null,
      ]
        .filter((l) => l !== null)
        .join("\n");
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`, "_blank");
    },
    [productName, planName, displayAmount, orderRef, buyerEmail, utr, utrValid]
  );

  async function confirmPayment() {
    if (!canConfirm) return;
    setConfirming(true);
    setConfirmError("");
    try {
      const res = await fetch(`${API_BASE}/api/orders/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: orderData?.productId,
          productName,
          planName,
          amount: orderData?.amount,
          email: buyerEmail,
          orderRef,
          utr,
          method: "UPI",
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const err = new Error(data.error || "Something went wrong. Please try again.");
        // 4xx = the server understood and rejected it (bad or reused UTR).
        // Keep the buyer on this screen so they can fix it.
        err.rejected = res.status >= 400 && res.status < 500;
        throw err;
      }
      setPhase("delivery");
    } catch (err) {
      if (err.rejected) {
        setConfirmError(err.message);
      } else {
        // Network or server failure: never trap a buyer who has already paid.
        // The UTR travels in the WhatsApp message as the fallback.
        setConfirmError("We couldn't record this automatically. Send us the WhatsApp message below and we'll take it from there.");
        setPhase("delivery");
      }
    } finally {
      setConfirming(false);
    }
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #F4F5F7;
      --surface: #FFFFFF;
      --surface-2: #F9FAFB;
      --border: #E4E7EC;
      --border-strong: #CBD1DA;
      --text: #0F1729;
      --text-dim: #4B5565;
      --text-faint: #8A94A6;
      --accent: #2F4BDB;
      --accent-hover: #2540BF;
      --accent-soft: #EEF1FD;
      --success: #15803D;
      --success-soft: #ECFDF3;
      --danger: #C62828;
      --danger-soft: #FEF2F2;
      --wa: #1FAF55;
      --radius: 14px;
    }

    body { background: var(--bg); font-family: 'Inter', system-ui, sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }

    .page { min-height: 100dvh; background: var(--bg); display: flex; justify-content: center; padding: 36px 16px 48px; }
    .wrap { width: 100%; max-width: 440px; animation: rise .3s ease both; }
    @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

    .brandbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding: 0 2px; }
    .brand { font-size: 15px; font-weight: 700; letter-spacing: -.2px; }
    .brand-sub { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; color: var(--text-faint); }
    .brand-sub svg { width: 13px; height: 13px; }

    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: 0 1px 2px rgba(15,23,41,.05), 0 12px 32px rgba(15,23,41,.05); overflow: hidden; }

    /* ── Order summary ─────────────────────────────────── */
    .order-summary { padding: 20px 24px; border-bottom: 1px solid var(--border); background: var(--surface-2); }
    .order-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .order-name { font-size: 15px; font-weight: 600; line-height: 1.35; }
    .order-plan { font-size: 12.5px; color: var(--text-dim); margin-top: 2px; }
    .order-amount { font-size: 24px; font-weight: 700; letter-spacing: -.5px; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .order-meta { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border-strong); display: grid; gap: 7px; }
    .order-meta-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .order-meta-key { font-size: 12px; color: var(--text-faint); flex-shrink: 0; }
    .order-meta-val { font-size: 12px; color: var(--text-dim); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .order-meta-val.mono { font-family: 'IBM Plex Mono', monospace; }

    .main { padding: 22px 24px 24px; }

    /* ── Timer ─────────────────────────────────────────── */
    .timer { margin-bottom: 22px; }
    .timer-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .timer-label { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text-dim); }
    .timer-label svg { width: 13px; height: 13px; color: var(--text-faint); }
    .timer-value { font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600; }
    .timer--urgent .timer-value, .timer--expired .timer-value { color: var(--danger); }
    .timer-track { height: 4px; background: var(--border); border-radius: 3px; overflow: hidden; }
    .timer-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 1s linear, background .3s; }
    .timer--urgent .timer-fill, .timer--expired .timer-fill { background: var(--danger); }

    /* ── Steps ─────────────────────────────────────────── */
    .step-head { display: flex; align-items: center; gap: 11px; margin-bottom: 14px; }
    .step-num { width: 24px; height: 24px; border-radius: 50%; background: var(--text); color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .step-num.done { background: var(--success); }
    .step-num svg { width: 12px; height: 12px; }
    .step-title { font-size: 14.5px; font-weight: 600; letter-spacing: -.1px; }
    .step-sub { font-size: 12px; color: var(--text-dim); margin-top: 1px; }
    .step-gap { height: 1px; background: var(--border); margin: 24px 0 22px; }

    /* ── Buttons ───────────────────────────────────────── */
    .btn-primary {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 20px;
      background: var(--accent); border: none; border-radius: 10px; color: #fff; font-family: inherit;
      font-size: 15px; font-weight: 600; cursor: pointer; transition: background .15s, transform .1s;
    }
    .btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
    .btn-primary:active:not(:disabled) { transform: translateY(1px); }
    .btn-primary:disabled { opacity: .45; cursor: not-allowed; }
    .btn-primary svg { width: 16px; height: 16px; }

    .app-btn-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
    .app-btn {
      display: flex; align-items: center; justify-content: center; min-height: 46px; padding: 8px 6px;
      background: var(--surface); border: 1px solid var(--border-strong); border-radius: 10px; cursor: pointer;
      transition: border-color .15s, box-shadow .15s;
    }
    .app-btn:hover:not(:disabled) { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .app-btn:disabled { opacity: .45; cursor: not-allowed; }
    .logo { display: inline-flex; align-items: center; gap: 5px; line-height: 1; }
    .logo-text { font-family: 'Inter', sans-serif; font-size: 13.5px; }

    .paid-btn {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 20px;
      background: var(--success); border: none; border-radius: 10px; color: #fff; font-family: inherit;
      font-size: 15px; font-weight: 600; cursor: pointer; transition: background .15s, transform .1s, opacity .15s;
    }
    .paid-btn:hover:not(:disabled) { background: #116A32; }
    .paid-btn:active:not(:disabled) { transform: translateY(1px); }
    .paid-btn:disabled { background: #B6BDC9; cursor: not-allowed; }
    .paid-btn svg { width: 16px; height: 16px; }

    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .divider-row { display: flex; align-items: center; gap: 10px; margin: 18px 0 16px; }
    .divider-line { flex: 1; height: 1px; background: var(--border); }
    .divider-text { font-size: 12px; color: var(--text-faint); }

    /* ── QR ────────────────────────────────────────────── */
    .qr-block { display: flex; flex-direction: column; align-items: center; }
    .qr-shell { position: relative; width: 196px; height: 196px; background: #fff; border-radius: 12px; border: 1px solid var(--border-strong); padding: 8px; overflow: hidden; }
    .qr-shell img { width: 100%; height: 100%; object-fit: contain; display: block; border-radius: 4px; filter: blur(11px); transform: scale(1.04); transition: filter .4s ease, transform .4s ease; }
    .qr-shell.is-revealed img { filter: none; transform: scale(1); }
    .qr-shell.is-expired img { filter: blur(11px) grayscale(1); opacity: .35; }
    .qr-veil { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,.6); border: none; cursor: pointer; font-family: inherit; padding: 0; }
    .qr-veil:disabled { cursor: not-allowed; }
    .qr-veil-icon { width: 38px; height: 38px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(47,75,219,.35); }
    .qr-veil-icon svg { width: 17px; height: 17px; }
    .qr-veil-text { font-size: 13px; font-weight: 600; color: var(--text); }
    .qr-veil-sub { font-size: 11.5px; color: var(--text-dim); }
    .qr-caption { font-size: 12px; color: var(--text-dim); margin-top: 12px; text-align: center; line-height: 1.5; }

    .upi-chip { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: border-color .15s; }
    .upi-chip:hover { border-color: var(--accent); }
    .upi-chip-text { font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
    .upi-chip svg { width: 13px; height: 13px; color: var(--text-dim); flex-shrink: 0; }
    .copied-note { font-size: 11.5px; color: var(--success); margin-top: 6px; }

    /* ── UTR field ─────────────────────────────────────── */
    .field-label { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; font-weight: 500; margin-bottom: 7px; }
    .field-count { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--text-faint); }
    .field-count.ok { color: var(--success); }
    .utr-wrap { position: relative; }
    .utr-input {
      width: 100%; padding: 13px 42px 13px 14px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 10px;
      font-family: 'IBM Plex Mono', monospace; font-size: 17px; font-weight: 500; letter-spacing: 2px; color: var(--text);
      transition: border-color .15s, box-shadow .15s;
    }
    .utr-input::placeholder { color: #B4BBC8; letter-spacing: 2px; }
    .utr-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .utr-input.valid { border-color: var(--success); }
    .utr-input.valid:focus { box-shadow: 0 0 0 3px var(--success-soft); }
    .utr-input:disabled { background: var(--surface-2); cursor: not-allowed; }
    .utr-check { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: var(--success); }
    .field-help { font-size: 12px; color: var(--text-dim); margin-top: 8px; line-height: 1.5; }

    .paid-hint { font-size: 12px; color: var(--text-faint); text-align: center; margin-top: 10px; line-height: 1.55; }

    .status-note { margin-top: 14px; display: flex; align-items: flex-start; justify-content: center; gap: 6px; font-size: 12.5px; text-align: center; line-height: 1.5; }
    .status-note--danger { color: var(--danger); }
    .status-note svg { width: 13px; height: 13px; flex-shrink: 0; margin-top: 2px; }

    .form-error { display: flex; align-items: flex-start; gap: 8px; background: var(--danger-soft); border: 1px solid #FECACA; border-radius: 8px; padding: 10px 12px; margin: 12px 0 0; font-size: 12.5px; color: #991B1B; line-height: 1.5; text-align: left; }
    .form-error svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }

    .notice-banner { display: flex; align-items: flex-start; gap: 9px; background: var(--danger-soft); border: 1px solid #FECACA; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; font-size: 12.5px; color: #991B1B; line-height: 1.5; }
    .notice-banner svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; color: var(--danger); }
    .notice-banner b { color: #7F1D1D; }

    /* ── Delivery ──────────────────────────────────────── */
    .success-wrap { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 4px 0 0; }
    .success-icon { width: 54px; height: 54px; border-radius: 50%; background: var(--success-soft); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .success-icon svg { width: 24px; height: 24px; color: var(--success); }
    .success-title { font-size: 19px; font-weight: 700; margin-bottom: 8px; letter-spacing: -.3px; }
    .success-sub { font-size: 13.5px; color: var(--text-dim); line-height: 1.6; max-width: 320px; margin-bottom: 20px; }
    .success-sub b { color: var(--text); font-weight: 600; }
    .success-actions { width: 100%; }
    .success-meta { width: 100%; margin-top: 22px; padding: 14px 16px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; display: grid; gap: 8px; text-align: left; }
    .success-meta-row { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; }
    .success-meta-key { color: var(--text-faint); }
    .success-meta-val { font-family: 'IBM Plex Mono', monospace; color: var(--text); font-size: 12px; }

    .wa-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 9px; padding: 14px 20px; background: var(--wa); border: none; border-radius: 10px; color: #fff; font-family: inherit; font-size: 15px; font-weight: 600; cursor: pointer; transition: background .15s; }
    .wa-btn:hover { background: #189449; }
    .wa-btn svg { width: 17px; height: 17px; flex-shrink: 0; }

    .trust-line { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 18px; font-size: 12px; color: var(--text-faint); }
    .trust-line svg { width: 12px; height: 12px; }
    .footer { margin-top: 6px; text-align: center; font-size: 11.5px; color: var(--text-faint); }

    :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    @media (prefers-reduced-motion: reduce) {
      .wrap { animation: none; }
      .qr-shell img, .timer-fill { transition: none; }
    }
    @media (max-width: 400px) {
      .main { padding: 18px; }
      .order-summary { padding: 16px 18px; }
      .qr-shell { width: 176px; height: 176px; }
      .logo-text { font-size: 12.5px; }
    }
  `;

  if (!orderData) {
    return (
      <div className="page">
        <style>{css}</style>
      </div>
    );
  }

  const payLabel = displayAmount !== null ? `Pay ₹${displayAmount} with UPI` : "Pay with UPI";

  const qrPanel = (
    <div className="qr-block">
      <div className={`qr-shell ${qrRevealed ? "is-revealed" : ""} ${expired ? "is-expired" : ""}`}>
        <img src={QR_IMAGE_URL} alt="UPI QR code" />
        {!qrRevealed && (
          <button className="qr-veil" type="button" onClick={() => setQrRevealed(true)} disabled={expired} aria-label="Show QR code">
            <span className="qr-veil-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <span className="qr-veil-text">Show QR code</span>
            <span className="qr-veil-sub">{expired ? "Window closed" : "Scan from another phone"}</span>
          </button>
        )}
      </div>
      <div className="qr-caption">{qrRevealed ? "Scan with any UPI app, then come back here." : "Hidden until you need it."}</div>
      <div
        className="upi-chip"
        onClick={() => handleCopy(UPI_ID, setCopiedUpi)}
        role="button"
        tabIndex={0}
        aria-label="Copy UPI ID"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCopy(UPI_ID, setCopiedUpi); }}
      >
        <span className="upi-chip-text">{UPI_ID}</span>
        {copiedUpi ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L19 7" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
        )}
      </div>
      {copiedUpi && <div className="copied-note">UPI ID copied</div>}
    </div>
  );

  const payButtons = (
    <>
      <button className="btn-primary" disabled={expired} onClick={() => (window.location.href = genericUpiLink)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" /></svg>
        {payLabel}
      </button>
      <div className="app-btn-row">
        <button className="app-btn" disabled={expired} onClick={() => (window.location.href = gpayLink)} aria-label="Pay with Google Pay" title="Google Pay">
          <GPayLogo />
        </button>
        <button className="app-btn" disabled={expired} onClick={() => (window.location.href = phonepeLink)} aria-label="Pay with PhonePe" title="PhonePe">
          <PhonePeLogo />
        </button>
        <button className="app-btn" disabled={expired} onClick={() => (window.location.href = paytmLink)} aria-label="Pay with Paytm" title="Paytm">
          <PaytmLogo />
        </button>
      </div>
    </>
  );

  const errorIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
  );

  return (
    <div className="page">
      <style>{css}</style>

      <div className="wrap">
        <div className="brandbar">
          <div className="brand">{BRAND_NAME}</div>
          <div className="brand-sub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="1.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Secure checkout
          </div>
        </div>

        <div className="card">
          <div className="order-summary">
            <div className="order-row">
              <div>
                <div className="order-name">{productName}</div>
                {planName && <div className="order-plan">{planName}</div>}
              </div>
              <div className="order-amount">{displayAmount !== null ? `₹${displayAmount}` : "—"}</div>
            </div>
            <div className="order-meta">
              {buyerEmail && (
                <div className="order-meta-row">
                  <span className="order-meta-key">Delivering to</span>
                  <span className="order-meta-val">{buyerEmail}</span>
                </div>
              )}
              <div className="order-meta-row">
                <span className="order-meta-key">Order reference</span>
                <span className="order-meta-val mono">{orderRef}</span>
              </div>
            </div>
          </div>

          <div className="main">
            {/* ================= PAY ================= */}
            {phase === "pay" && (
              <>
                {!UPI_AVAILABLE ? (
                  <>
                    <div className="notice-banner">
                      {errorIcon}
                      <span><b>UPI is down right now.</b> Our bank's servers aren't accepting payments. Message us and we'll send you a working payment link in a minute.</span>
                    </div>
                    <button className="wa-btn" onClick={() => openWhatsApp("UPI is showing as unavailable — please send me a payment link.")}>
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d={WA_PATH} /></svg>
                      Get a payment link
                    </button>
                  </>
                ) : (
                  <>
                    <div className={`timer ${expired ? "timer--expired" : urgent ? "timer--urgent" : ""}`}>
                      <div className="timer-top">
                        <span className="timer-label">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                          {expired ? "Payment window closed" : "Price held for"}
                        </span>
                        {!expired && <span className="timer-value">{formatMMSS(secondsLeft)}</span>}
                      </div>
                      <div className="timer-track">
                        <div className="timer-fill" style={{ width: `${expired ? 0 : progressPct}%` }} />
                      </div>
                    </div>

                    {/* Step 1 — pay */}
                    <div className="step-head">
                      <span className="step-num">1</span>
                      <div>
                        <div className="step-title">Make the payment</div>
                        <div className="step-sub">Pay using any UPI app</div>
                      </div>
                    </div>

                    {isMobile ? (
                      <>
                        {payButtons}
                        <div className="divider-row">
                          <div className="divider-line" />
                          <div className="divider-text">or scan</div>
                          <div className="divider-line" />
                        </div>
                        {qrPanel}
                      </>
                    ) : (
                      <>
                        {qrPanel}
                        <div className="divider-row">
                          <div className="divider-line" />
                          <div className="divider-text">or open an app</div>
                          <div className="divider-line" />
                        </div>
                        {payButtons}
                      </>
                    )}

                    <div className="step-gap" />

                    {/* Step 2 — confirm with UTR */}
                    <div className="step-head">
                      <span className={`step-num ${utrValid ? "done" : ""}`}>
                        {utrValid ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><path d="M5 12l5 5L19 7" /></svg>
                        ) : (
                          "2"
                        )}
                      </span>
                      <div>
                        <div className="step-title">Confirm your payment</div>
                        <div className="step-sub">Enter the UTR from your payment receipt</div>
                      </div>
                    </div>

                    <label className="field-label" htmlFor="utr-input">
                      <span>UTR number</span>
                      <span className={`field-count ${utrValid ? "ok" : ""}`}>{utr.length}/{UTR_LENGTH}</span>
                    </label>
                    <div className="utr-wrap">
                      <input
                        id="utr-input"
                        className={`utr-input ${utrValid ? "valid" : ""}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={UTR_LENGTH}
                        placeholder="000000000000"
                        value={utr}
                        onChange={handleUtrChange}
                        disabled={expired || confirming}
                        aria-describedby="utr-help"
                      />
                      {utrValid && (
                        <svg className="utr-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                          <path d="M5 12l5 5L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="field-help" id="utr-help">
                      Find the 12-digit UTR (also called UPI Ref No.) in your app under the payment's transaction details.
                    </div>

                    {confirmError && (
                      <div className="form-error" role="alert">
                        {errorIcon}
                        {confirmError}
                      </div>
                    )}

                    <button className="paid-btn" style={{ marginTop: 16 }} disabled={!canConfirm} onClick={confirmPayment}>
                      {confirming ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12l5 5L19 7" /></svg>
                          I've paid — get my access
                        </>
                      )}
                    </button>
                    <div className="paid-hint">
                      We match the UTR against our bank statement before delivering. Access arrives on WhatsApp within 15–30 minutes.
                    </div>

                    {expired && (
                      <div className="status-note status-note--danger">
                        {errorIcon}
                        This window closed. Message us on WhatsApp and we'll reopen it.
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ================= DELIVERY ================= */}
            {phase === "delivery" && (
              <div className="success-wrap">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L19 7" /></svg>
                </div>
                <div className="success-title">Payment submitted</div>
                <div className="success-sub">
                  Open WhatsApp to collect your access. We verify the transfer and deliver within <b>15–30 minutes</b>.
                </div>

                {confirmError && (
                  <div className="form-error" style={{ marginBottom: 18, width: "100%" }} role="alert">
                    {errorIcon}
                    {confirmError}
                  </div>
                )}

                <div className="success-actions">
                  <button className="wa-btn" onClick={() => openWhatsApp("I've completed my UPI payment — please confirm and deliver access.")}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d={WA_PATH} /></svg>
                    Collect my access
                  </button>
                </div>

                <div className="success-meta">
                  <div className="success-meta-row"><span className="success-meta-key">Order reference</span><span className="success-meta-val">{orderRef}</span></div>
                  <div className="success-meta-row"><span className="success-meta-key">UTR</span><span className="success-meta-val">{utr}</span></div>
                  <div className="success-meta-row"><span className="success-meta-key">Amount</span><span className="success-meta-val">{displayAmount !== null ? `₹${displayAmount}` : "—"}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="trust-line">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          Encrypted transfer · Manual verification
        </div>
        <div className="footer">© {BRAND_NAME}</div>
      </div>
    </div>
  );
}