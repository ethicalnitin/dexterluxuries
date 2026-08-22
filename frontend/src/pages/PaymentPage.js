import React, { useState, useMemo, useEffect, useLayoutEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const WHATSAPP_NUMBER = "+12403013547";
const BRAND_NAME = "MKR Tools & Softwares";

// ── UPI config ───────────────────────────────────────────────────────────
const UPI_ID = "paytm.s2znhpg@pty";
const PAYEE_NAME = "MKR Tools & Softwares";
const QR_IMAGE_URL = "https://i.ibb.co/cSFGRFqY/image.png";

// ── Crypto config ────────────────────────────────────────────────────────
// TODO: replace with your real BEP20 wallet address before going live.
const CRYPTO_WALLET_ADDRESS = "0xYOUR_BEP20_WALLET_ADDRESS_HERE";
const CRYPTO_CHAIN_LABEL = "USDT · BEP20 (BNB Smart Chain)";

const PAYMENT_WINDOW_SECONDS = 10 * 60; // 10 minutes, starts once they reach the pay screen

// Backend base URL. Leave empty when Express serves the React build itself
// (same-origin). Set to the backend's full origin if frontend/backend are
// ever split across two hosts.
const API_BASE = "http://localhost:3046";

// ── Country codes for the phone field ─────────────────────────────────────
// NOTE: server.js's /api/orders/notify only validates India-format numbers
// (10 digits, or 12 digits starting with "91"). Numbers submitted under any
// other country code here will pass this page's own validation but will be
// rejected by the backend when "Payment completed" / "I've paid" is clicked.
// Keep +91 as default until the backend regex is updated to support others.
const COUNTRY_CODES = [
  { dial: "+91", label: "IN +91" },
  { dial: "+1", label: "US +1" },
  { dial: "+44", label: "UK +44" },
  { dial: "+971", label: "AE +971" },
  { dial: "+61", label: "AU +61" },
  { dial: "+65", label: "SG +65" },
];
// ─────────────────────────────────────────────────────────────────────────

function formatINR(amount) {
  const num = Number(amount);
  if (isNaN(num)) return null;
  return num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatUSD(amount) {
  const num = Number(amount);
  if (isNaN(num)) return null;
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

// Loose check used only to decide when to reveal the price and enable
// Continue — length-based, not country-specific. Actual backend acceptance
// still depends on the India-only rule noted above.
function isPhoneLongEnough(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 12;
}

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, isReady, isAuthenticated } = useAuth();

  // Data passed from ProductPage.js via navigate("/payment", { state: {...} })
  const orderData = location.state || null;

  const [orderRef] = useState(makeOrderRef);

  // phase: 'review' -> 'method' -> 'upi' | 'crypto' -> 'delivery'
  const [phase, setPhase] = useState("review");

  const [countryDial, setCountryDial] = useState("+91");
  const [phone, setPhone] = useState("");
  const [reviewError, setReviewError] = useState("");

  // Which method the buyer actually picked — determines which currency
  // the summary and delivery screen show.
  const [selectedMethod, setSelectedMethod] = useState(null); // 'UPI' | 'CRYPTO'

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  // ── Guards ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || !orderData) {
      navigate("/", { replace: true });
    }
  }, [isReady, isAuthenticated, orderData, navigate]);

  // ── Scroll fixes ─────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase]);

  const displayAmount = orderData?.amount != null ? formatINR(orderData.amount) : null; // INR
  const displayAmountUSD = orderData?.amountUSD != null ? formatUSD(orderData.amountUSD) : null; // USD
  const productName = orderData?.productName || "Product";
  const planName = orderData?.planName || null;

  const phoneEntered = isPhoneLongEnough(phone);

  // ── Which currency the order summary shows, driven by phase + choices ──
  // review:   hidden until a phone number is entered, then USD
  // method:   USD (method not chosen yet)
  // upi:      INR
  // crypto:   USD
  // delivery: whatever currency the chosen method used
  const summaryCurrency =
    phase === "review" ? (phoneEntered ? "USD" : null) :
    phase === "method" ? "USD" :
    phase === "upi" ? "INR" :
    phase === "crypto" ? "USD" :
    phase === "delivery" ? (selectedMethod === "UPI" ? "INR" : "USD") :
    null;

  const summaryAmountText =
    summaryCurrency === "INR" ? (displayAmount !== null ? `₹${displayAmount}` : "—") :
    summaryCurrency === "USD" ? (displayAmountUSD !== null ? `$${displayAmountUSD}` : "—") :
    null; // null -> render the placeholder instead

  // ── 10-minute payment countdown ─────────────────────────────────────
  const [deadline, setDeadline] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_WINDOW_SECONDS);

  useEffect(() => {
    if ((phase === "upi" || phase === "crypto") && deadline === null) {
      setDeadline(Date.now() + PAYMENT_WINDOW_SECONDS * 1000);
    }
  }, [phase, deadline]);

  useEffect(() => {
    if (deadline === null) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const expired = (phase === "upi" || phase === "crypto") && deadline !== null && secondsLeft <= 0;
  const urgent = (phase === "upi" || phase === "crypto") && !expired && secondsLeft <= 60;
  const progressPct = Math.max(0, Math.min(100, (secondsLeft / PAYMENT_WINDOW_SECONDS) * 100));

  // ── UPI deep links ───────────────────────────────────────────────────
  const buildUpiLink = useCallback(
    (scheme) => {
      const params = new URLSearchParams();
      params.set("pa", UPI_ID);
      params.set("pn", PAYEE_NAME);
      if (orderData?.amount != null) params.set("am", String(orderData.amount));
      params.set("cu", "INR");
      params.set("tn", productName || "Payment");
      return `${scheme}?${params.toString()}`;
    },
    [orderData, productName]
  );

  const genericUpiLink = useMemo(() => buildUpiLink("upi://pay"), [buildUpiLink]);
  const gpayLink = useMemo(() => buildUpiLink("tez://upi/pay"), [buildUpiLink]);
  const phonepeLink = useMemo(() => buildUpiLink("phonepe://pay"), [buildUpiLink]);

  function handleCopy(text, setFlag) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setFlag(true);
      setTimeout(() => setFlag(false), 1800);
    });
  }

  const openWhatsApp = useCallback(
    (extraLine) => {
      const amountLine =
        selectedMethod === "UPI"
          ? (displayAmount !== null ? `Amount: Rs. ${displayAmount}` : null)
          : (displayAmountUSD !== null ? `Amount: $${displayAmountUSD}` : null);
      const lines = [
        `Hi, I'd like to place an order on ${BRAND_NAME}.`,
        ``,
        `Product: ${productName}`,
        planName ? `Plan: ${planName}` : null,
        amountLine,
        `Order ref: ${orderRef}`,
        user?.email ? `Account: ${user.email}` : null,
        extraLine || null,
      ]
        .filter((l) => l !== null)
        .join("\n");
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`, "_blank");
    },
    [productName, planName, displayAmount, displayAmountUSD, selectedMethod, orderRef, user]
  );

  function handleReviewContinue(e) {
    e.preventDefault();
    if (!phoneEntered) {
      setReviewError("Enter a valid phone number to continue.");
      return;
    }
    setReviewError("");
    setPhase("method");
  }

  function chooseMethod(method) {
    setSelectedMethod(method);
    setPhase(method === "UPI" ? "upi" : "crypto");
  }

  async function notifyOrder(method) {
    setConfirming(true);
    setConfirmError("");
    try {
      const fullPhone = `${countryDial}${phone.replace(/\D/g, "")}`;
      const res = await fetch(`${API_BASE}/api/orders/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: orderData?.productId,
          productName,
          amount: method === "UPI" ? orderData?.amount : orderData?.amountUSD,
          email: user?.email,
          phone: fullPhone,
          method,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setPhase("delivery");
    } catch (err) {
      setConfirmError(err.message || "Couldn't confirm with our system — please message us on WhatsApp to be safe.");
      setPhase("delivery");
    } finally {
      setConfirming(false);
    }
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #F6F7F9;
      --surface: #FFFFFF;
      --surface-2: #FAFBFC;
      --border: #E4E7EC;
      --border-strong: #D0D5DD;
      --text: #101828;
      --text-dim: #475467;
      --text-faint: #98A2B3;
      --accent: #3958E9;
      --accent-hover: #2F49CC;
      --accent-soft: #EEF1FE;
      --success: #16A34A;
      --success-soft: #EEFBF3;
      --danger: #DC2626;
      --danger-soft: #FEF2F2;
      --wa: #25D366;
      --radius: 12px;
    }

    body { background: var(--bg); }

    .page {
      min-height: 100dvh;
      background: var(--bg);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 48px 16px;
    }

    .wrap {
      width: 100%;
      max-width: 480px;
      animation: rise .35s ease both;
    }
    @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    .brandbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .brand { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); letter-spacing: -.2px; }
    .brand-sub { display: flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif; font-size: 11.5px; font-weight: 500; color: var(--text-faint); }
    .brand-sub svg { width: 13px; height: 13px; color: var(--text-faint); }

    .stepper { display: flex; align-items: center; margin-bottom: 20px; }
    .step-item { display: flex; align-items: center; gap: 7px; }
    .step-dot {
      width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-family: 'Inter', sans-serif; font-size: 10.5px; font-weight: 700;
      border: 1.5px solid var(--border-strong); color: var(--text-faint); flex-shrink: 0; transition: all .2s ease; background: var(--surface);
    }
    .step-item.is-active .step-dot { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
    .step-item.is-done .step-dot { border-color: var(--accent); background: var(--accent); color: #fff; }
    .step-item.is-done .step-dot svg { width: 11px; height: 11px; }
    .step-label { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; color: var(--text-faint); white-space: nowrap; }
    .step-item.is-active .step-label { color: var(--text); font-weight: 600; }
    .step-item.is-done .step-label { color: var(--text-dim); }
    .step-connector { flex: 1; height: 1px; background: var(--border); margin: 0 10px; }

    .card {
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 8px 24px rgba(16,24,40,.04); overflow: hidden;
    }

    .order-summary { padding: 20px 24px; background: var(--surface-2); border-bottom: 1px solid var(--border); }
    .order-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
    .order-name { font-family: 'Inter', sans-serif; font-size: 14.5px; font-weight: 600; color: var(--text); }
    .order-plan { font-family: 'Inter', sans-serif; font-size: 12px; color: var(--text-dim); margin-top: 2px; }
    .order-amount { font-family: 'IBM Plex Mono', monospace; font-size: 18px; font-weight: 600; color: var(--text); white-space: nowrap; }
    .order-amount--placeholder { font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 500; color: var(--text-faint); }
    .order-meta-row { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
    .order-meta-key { font-family: 'Inter', sans-serif; font-size: 11.5px; color: var(--text-faint); }
    .order-meta-val { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--text-dim); }

    .status-pill {
      display: inline-flex; align-items: center; gap: 5px; margin-top: 10px;
      padding: 3px 9px; border-radius: 20px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600;
      background: var(--accent-soft); color: var(--accent);
    }
    .status-pill.status-pill--done { background: var(--success-soft); color: var(--success); }
    .status-pill svg { width: 10px; height: 10px; }

    .main { padding: 24px; }

    .form-head { margin-bottom: 18px; }
    .form-title { font-family: 'Inter', sans-serif; font-size: 17px; font-weight: 700; color: var(--text); letter-spacing: -.2px; margin-bottom: 4px; }
    .form-sub { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--text-dim); line-height: 1.5; }

    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 600; color: var(--text-dim); margin-bottom: 6px; }
    .form-input {
      width: 100%; padding: 11px 13px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 8px;
      color: var(--text); font-family: 'Inter', sans-serif; font-size: 14px; transition: border-color .15s, box-shadow .15s;
    }
    .form-input::placeholder { color: var(--text-faint); }
    .form-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .form-input:disabled { background: var(--surface-2); color: var(--text-dim); }
    .form-input--mono { font-family: 'IBM Plex Mono', monospace; }

    .phone-row { display: flex; gap: 8px; }
    .phone-country {
      flex: 0 0 108px; padding: 11px 10px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 8px;
      color: var(--text); font-family: 'IBM Plex Mono', monospace; font-size: 13px; cursor: pointer; transition: border-color .15s;
    }
    .phone-country:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .phone-row .form-input { flex: 1; min-width: 0; }
    .field-hint { font-family: 'Inter', sans-serif; font-size: 11px; color: var(--text-faint); margin-top: 6px; line-height: 1.5; }

    .form-error {
      display: flex; align-items: flex-start; gap: 8px; background: var(--danger-soft); border: 1px solid #FECACA;
      border-radius: 8px; padding: 10px 12px; margin-bottom: 16px; font-family: 'Inter', sans-serif; font-size: 12.5px; color: #B91C1C; line-height: 1.5;
    }
    .form-error svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }

    .back-link {
      display: inline-flex; align-items: center; gap: 4px; background: none; border: none; color: var(--text-faint);
      font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 600; cursor: pointer; margin-bottom: 16px; padding: 0;
    }
    .back-link:hover { color: var(--text-dim); }
    .back-link svg { width: 13px; height: 13px; }

    .btn-primary {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px;
      background: var(--accent); border: none; border-radius: 8px; color: #fff; font-family: 'Inter', sans-serif;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: background .15s, transform .1s;
    }
    .btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
    .btn-primary:active:not(:disabled) { transform: translateY(1px); }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary svg { width: 15px; height: 15px; }

    .btn-secondary {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 20px;
      background: var(--surface); border: 1px solid var(--border-strong); border-radius: 8px; color: var(--text);
      font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; cursor: pointer;
      transition: border-color .15s, background .15s; margin-top: 8px;
    }
    .btn-secondary:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
    .btn-secondary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-secondary svg { width: 14px; height: 14px; }

    .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
    .spinner--dark { border: 2px solid rgba(16,24,40,.15); border-top-color: var(--text-dim); }
    @keyframes spin { to { transform: rotate(360deg); } }

    .method-grid { display: flex; flex-direction: column; gap: 10px; }
    .method-card {
      display: flex; align-items: center; gap: 13px; width: 100%; text-align: left;
      background: var(--surface); border: 1px solid var(--border-strong); border-radius: 10px; padding: 14px 16px;
      cursor: pointer; transition: border-color .15s, background .15s; color: var(--text); font-family: 'Inter', sans-serif;
    }
    .method-card:hover { border-color: var(--accent); background: var(--accent-soft); }
    .method-icon {
      width: 38px; height: 38px; border-radius: 9px; background: var(--surface-2); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--accent);
    }
    .method-icon svg { width: 18px; height: 18px; }
    .method-text { flex: 1; min-width: 0; }
    .method-title { font-size: 13.5px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
    .method-sub { font-size: 11.5px; color: var(--text-dim); }
    .method-arrow { color: var(--text-faint); flex-shrink: 0; }
    .method-arrow svg { width: 15px; height: 15px; }

    .timer { margin-bottom: 18px; }
    .timer-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
    .timer-label { display: flex; align-items: center; gap: 5px; font-family: 'Inter', sans-serif; font-size: 12px; color: var(--text-dim); }
    .timer-label svg { width: 12px; height: 12px; color: var(--text-faint); }
    .timer-value { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; font-weight: 600; color: var(--text); }
    .timer.timer--urgent .timer-value { color: var(--danger); }
    .timer.timer--expired .timer-value { color: var(--danger); }
    .timer-track { height: 4px; background: var(--border); border-radius: 3px; overflow: hidden; }
    .timer-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 1s linear, background .3s; }
    .timer--urgent .timer-fill { background: var(--danger); }
    .timer--expired .timer-fill { background: var(--danger); }

    .scan-block { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
    .scan-frame { flex-shrink: 0; width: 92px; height: 92px; background: #fff; border-radius: 10px; padding: 6px; border: 1px solid var(--border-strong); }
    .scan-frame img { width: 100%; height: 100%; object-fit: contain; border-radius: 3px; display: block; }
    .scan-frame--expired img { opacity: .2; filter: grayscale(1); }
    .scan-info { display: flex; flex-direction: column; gap: 9px; min-width: 0; padding-top: 2px; }
    .scan-info-title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: var(--text); }
    .scan-info-sub { font-family: 'Inter', sans-serif; font-size: 12px; color: var(--text-dim); line-height: 1.5; }
    .upi-chip {
      display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; background: var(--surface-2);
      border: 1px solid var(--border); border-radius: 7px; padding: 6px 10px; cursor: pointer; transition: border-color .15s;
    }
    .upi-chip:hover { border-color: var(--accent); }
    .upi-chip-text { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--text); }
    .upi-chip svg { width: 12px; height: 12px; color: var(--text-dim); flex-shrink: 0; }
    .copied-note { font-family: 'Inter', sans-serif; font-size: 11px; color: var(--success); }

    .app-btn-row { display: flex; gap: 10px; margin-bottom: 8px; }
    .app-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 10px 10px;
      background: var(--surface); border: 1px solid var(--border-strong); border-radius: 8px; color: var(--text);
      font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 600; cursor: pointer;
      transition: border-color .15s, background .15s;
    }
    .app-btn:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-soft); }
    .app-btn:disabled { opacity: .5; cursor: not-allowed; }

    .divider-row { display: flex; align-items: center; gap: 10px; margin: 14px 0; }
    .divider-line { flex: 1; height: 1px; background: var(--border); }
    .divider-text { font-family: 'Inter', sans-serif; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--text-faint); }

    .status-note { margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; font-family: 'Inter', sans-serif; font-size: 12px; }
    .status-note--danger { color: var(--danger); }
    .status-note svg { width: 13px; height: 13px; flex-shrink: 0; }

    .chain-badge {
      display: inline-flex; align-items: center; gap: 6px; background: var(--accent-soft);
      color: var(--accent); font-family: 'IBM Plex Mono', monospace;
      font-size: 11.5px; font-weight: 600; padding: 6px 11px; border-radius: 7px; margin-bottom: 14px;
    }
    .chain-badge svg { width: 13px; height: 13px; }

    .wallet-box { background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
    .wallet-label { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; color: var(--text-faint); margin-bottom: 8px; }
    .wallet-address-row { display: flex; align-items: center; gap: 10px; }
    .wallet-address { flex: 1; min-width: 0; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: var(--text); word-break: break-all; line-height: 1.5; }
    .wallet-copy-btn {
      flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 6px;
      background: var(--accent); border: none; border-radius: 7px; color: #fff; font-family: 'Inter', sans-serif;
      font-size: 11.5px; font-weight: 600; padding: 8px 12px; cursor: pointer; transition: background .15s;
    }
    .wallet-copy-btn:hover { background: var(--accent-hover); }

    .crypto-warning {
      display: flex; align-items: flex-start; gap: 8px; background: var(--danger-soft); border: 1px solid #FECACA;
      border-radius: 8px; padding: 10px 12px; margin-bottom: 16px; font-family: 'Inter', sans-serif; font-size: 12px;
      color: #B91C1C; line-height: 1.55;
    }
    .crypto-warning svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }
    .crypto-warning b { color: #991B1B; }

    .success-wrap { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 6px 4px 4px; }
    .success-icon {
      width: 52px; height: 52px; border-radius: 50%; background: var(--success-soft); display: flex; align-items: center;
      justify-content: center; margin-bottom: 16px;
    }
    .success-icon svg { width: 24px; height: 24px; color: var(--success); }
    .success-title { font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px; letter-spacing: -.2px; }
    .success-sub { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--text-dim); line-height: 1.6; max-width: 320px; margin-bottom: 22px; }
    .success-sub b { color: var(--text); font-weight: 600; }
    .success-actions { width: 100%; max-width: 300px; }
    .success-meta { display: flex; gap: 24px; margin-top: 20px; flex-wrap: wrap; justify-content: center; }
    .success-meta-item { text-align: center; }
    .success-meta-key { font-family: 'Inter', sans-serif; font-size: 10.5px; font-weight: 600; color: var(--text-faint); margin-bottom: 4px; }
    .success-meta-val { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-dim); }

    .wa-btn {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 9px; padding: 12px 20px;
      background: var(--wa); border: none; border-radius: 8px; color: #fff;
      font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background .15s;
    }
    .wa-btn:hover { background: #1FB959; }
    .wa-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

    .trust-line {
      display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 20px;
      font-family: 'Inter', sans-serif; font-size: 11.5px; color: var(--text-faint);
    }
    .trust-line svg { width: 12px; height: 12px; color: var(--text-faint); }
    .footer { margin-top: 8px; text-align: center; font-family: 'Inter', sans-serif; font-size: 11px; color: var(--text-faint); }

    @media (max-width: 400px) {
      .step-label { display: none; }
      .app-btn-row { flex-direction: column; }
      .main { padding: 20px; }
      .order-summary { padding: 16px 20px; }
      .phone-country { flex-basis: 92px; }
    }
  `;

  if (!isReady || !isAuthenticated || !orderData) {
    return (
      <div className="page">
        <style>{css}</style>
      </div>
    );
  }

  const stepNumber = phase === "review" ? 1 : phase === "delivery" ? 3 : 2;

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

        <div className="stepper">
          {[{ n: 1, label: "Review" }, { n: 2, label: "Pay" }, { n: 3, label: "Delivery" }].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`step-item ${stepNumber === s.n ? "is-active" : ""} ${stepNumber > s.n ? "is-done" : ""}`}>
                <div className="step-dot">
                  {stepNumber > s.n ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L19 7" /></svg>
                  ) : s.n}
                </div>
                <span className="step-label">{s.label}</span>
              </div>
              {i < 2 && <div className="step-connector" />}
            </React.Fragment>
          ))}
        </div>

        <div className="card">
          <div className="order-summary">
            <div className="order-row">
              <div>
                <div className="order-name">{productName}</div>
                {planName && <div className="order-plan">{planName}</div>}
              </div>
              {summaryAmountText !== null ? (
                <div className="order-amount">{summaryAmountText}</div>
              ) : (
                <div className="order-amount--placeholder">Enter phone to view price</div>
              )}
            </div>
            <div className="order-meta-row">
              <span className="order-meta-key">Order reference</span>
              <span className="order-meta-val">{orderRef}</span>
            </div>

            {(phase === "upi" || phase === "crypto") && (
              <div className="status-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                Awaiting payment
              </div>
            )}
            {phase === "delivery" && (
              <div className="status-pill status-pill--done">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L19 7" /></svg>
                Payment recorded
              </div>
            )}
          </div>

          <div className="main">
            {/* ================= STEP 1: REVIEW ================= */}
            {phase === "review" && (
              <>
                <div className="form-head">
                  <div className="form-title">Review your order</div>
                  <div className="form-sub">Add a contact number to reveal the price and continue to payment.</div>
                </div>

                <form onSubmit={handleReviewContinue}>
                  {reviewError && (
                    <div className="form-error">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
                      {reviewError}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Signed in as</label>
                    <input className="form-input" type="text" value={user?.email || ""} disabled />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone number</label>
                    <div className="phone-row">
                      <select
                        className="phone-country"
                        value={countryDial}
                        onChange={(e) => setCountryDial(e.target.value)}
                        aria-label="Country code"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.dial} value={c.dial}>{c.label}</option>
                        ))}
                      </select>
                      <input
                        id="phone"
                        className="form-input form-input--mono"
                        type="tel"
                        placeholder="Mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoComplete="tel-national"
                      />
                    </div>
                  
                  </div>

                  <button className="btn-primary" type="submit" disabled={!phoneEntered}>
                    Continue to payment
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                </form>
              </>
            )}

            {/* ================= STEP 2a: METHOD SELECT ================= */}
            {phase === "method" && (
              <>
                <button className="back-link" onClick={() => setPhase("review")} type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
                  Back
                </button>

                <div className="form-head">
                  <div className="form-title">Choose payment method</div>
                  <div className="form-sub">UPI shows the price in rupees. Crypto shows the price in USDT.</div>
                </div>

                <div className="method-grid">
                  <button className="method-card" onClick={() => chooseMethod("UPI")} type="button">
                    <span className="method-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg>
                    </span>
                    <span className="method-text">
                      <div className="method-title">UPI</div>
                      <div className="method-sub">GPay, PhonePe, Paytm or any UPI app — price in ₹</div>
                    </span>
                    <span className="method-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 6l6 6-6 6" /></svg></span>
                  </button>

                  <button className="method-card" onClick={() => chooseMethod("CRYPTO")} type="button">
                    <span className="method-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 012.5-2h.5a2.5 2.5 0 010 5H12a2.5 2.5 0 000 5h.5a2.5 2.5 0 002.5-2M12 6v1.5M12 16.5V18" /></svg>
                    </span>
                    <span className="method-text">
                      <div className="method-title">Crypto (USDT)</div>
                      <div className="method-sub">BEP20 network only — price in $</div>
                    </span>
                    <span className="method-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 6l6 6-6 6" /></svg></span>
                  </button>
                </div>
              </>
            )}

            {/* ================= STEP 2b: UPI PAY ================= */}
            {phase === "upi" && (
              <>
                <button className="back-link" onClick={() => setPhase("method")} type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
                  Change method
                </button>

                <div className={`timer ${expired ? "timer--expired" : urgent ? "timer--urgent" : ""}`}>
                  <div className="timer-top">
                    <span className="timer-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                      {expired ? "Window expired" : "Payment window"}
                    </span>
                    {!expired && <span className="timer-value">{formatMMSS(secondsLeft)}</span>}
                  </div>
                  <div className="timer-track"><div className="timer-fill" style={{ width: `${expired ? 0 : progressPct}%` }} /></div>
                </div>

                <div className="scan-block">
                  <div className={`scan-frame ${expired ? "scan-frame--expired" : ""}`}>
                    <img src={QR_IMAGE_URL} alt="Scan to pay via UPI" />
                  </div>
                  <div className="scan-info">
                    <div className="scan-info-title">Scan or tap to pay</div>
                    <div className="scan-info-sub">Use any UPI app, or open GPay / PhonePe directly.</div>
                    <div className="upi-chip" onClick={() => handleCopy(UPI_ID, setCopiedUpi)} role="button" tabIndex={0}>
                      <span className="upi-chip-text">{UPI_ID}</span>
                      {copiedUpi ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L19 7" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                      )}
                    </div>
                    {copiedUpi && <div className="copied-note">Copied to clipboard</div>}
                  </div>
                </div>

                <div className="app-btn-row">
                  <button className="app-btn" disabled={expired} onClick={() => (window.location.href = gpayLink)}>
                    Google Pay
                  </button>
                  <button className="app-btn" disabled={expired} onClick={() => (window.location.href = phonepeLink)}>
                    PhonePe
                  </button>
                </div>

                <button className="btn-primary" disabled={expired} onClick={() => (window.location.href = genericUpiLink)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" /></svg>
                  Pay via UPI app{displayAmount !== null ? ` — ₹${displayAmount}` : ""}
                </button>

                <div className="divider-row"><div className="divider-line" /><div className="divider-text">Then</div><div className="divider-line" /></div>

                <button className="btn-secondary" disabled={expired || confirming} onClick={() => notifyOrder("UPI")}>
                  {confirming ? <span className="spinner spinner--dark" /> : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12l5 5L19 7" /></svg>
                      Payment completed
                    </>
                  )}
                </button>

                {expired && (
                  <div className="status-note status-note--danger">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
                    Window closed — message us on WhatsApp for a new link
                  </div>
                )}
              </>
            )}

            {/* ================= STEP 2c: CRYPTO PAY ================= */}
            {phase === "crypto" && (
              <>
                <button className="back-link" onClick={() => setPhase("method")} type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
                  Change method
                </button>

                <div className={`timer ${expired ? "timer--expired" : urgent ? "timer--urgent" : ""}`}>
                  <div className="timer-top">
                    <span className="timer-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                      {expired ? "Window expired" : "Payment window"}
                    </span>
                    {!expired && <span className="timer-value">{formatMMSS(secondsLeft)}</span>}
                  </div>
                  <div className="timer-track"><div className="timer-fill" style={{ width: `${expired ? 0 : progressPct}%` }} /></div>
                </div>

                <div className="chain-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 012.5-2h.5a2.5 2.5 0 010 5H12a2.5 2.5 0 000 5h.5a2.5 2.5 0 002.5-2M12 6v1.5M12 16.5V18" /></svg>
                  {CRYPTO_CHAIN_LABEL}
                  {displayAmountUSD !== null ? ` · $${displayAmountUSD}` : ""}
                </div>

                <div className="crypto-warning">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
                  Only send <b>USDT on the BEP20 (BNB Smart Chain) network</b> to this address. Funds sent on any other network or token cannot be recovered.
                </div>

                <div className="wallet-box">
                  <div className="wallet-label">Wallet address</div>
                  <div className="wallet-address-row">
                    <span className="wallet-address">{CRYPTO_WALLET_ADDRESS}</span>
                    <button className="wallet-copy-btn" type="button" onClick={() => handleCopy(CRYPTO_WALLET_ADDRESS, setCopiedWallet)}>
                      {copiedWallet ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <button className="btn-secondary" disabled={expired || confirming} onClick={() => notifyOrder("Crypto (USDT BEP20)")} style={{ marginTop: 4 }}>
                  {confirming ? <span className="spinner spinner--dark" /> : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12l5 5L19 7" /></svg>
                      I've paid
                    </>
                  )}
                </button>

                {expired && (
                  <div className="status-note status-note--danger">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
                    Window closed — message us on WhatsApp to confirm your address
                  </div>
                )}
              </>
            )}

            {/* ================= STEP 3: DELIVERY ================= */}
            {phase === "delivery" && (
              <div className="success-wrap">
                <div className="success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L19 7" /></svg>
                </div>
                <div className="success-title">Payment recorded</div>
                <div className="success-sub">
                  Tap below to open WhatsApp and get your access — our team will verify your payment and deliver within <b>15–30 minutes</b>.
                </div>

                {confirmError && (
                  <div className="form-error" style={{ maxWidth: 300, marginBottom: 18, textAlign: "left" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
                    {confirmError}
                  </div>
                )}

                <div className="success-actions">
                  <button
                    className="wa-btn"
                    onClick={() => openWhatsApp(`I've completed my payment via ${selectedMethod === "UPI" ? "UPI" : "USDT BEP20"} — please confirm and deliver access.`)}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" /></svg>
                    Proceed to access
                  </button>
                </div>

                <div className="success-meta">
                  <div className="success-meta-item"><div className="success-meta-key">Order ref</div><div className="success-meta-val">{orderRef}</div></div>
                  <div className="success-meta-item"><div className="success-meta-key">Amount</div><div className="success-meta-val">{summaryAmountText || "—"}</div></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="trust-line">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          Encrypted transfer · Instant delivery
        </div>
        <div className="footer">© {BRAND_NAME}</div>
      </div>
    </div>
  );
}