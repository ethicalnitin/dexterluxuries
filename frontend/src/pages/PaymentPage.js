import React, { useState, useMemo, useEffect, useLayoutEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LuLock,
  LuClock,
  LuEye,
  LuCopy,
  LuCheck,
  LuZap,
  LuShieldCheck,
  LuLandmark,
  LuWallet,
  LuMessageCircle,
} from "react-icons/lu";
import { FaWhatsapp, FaCcVisa, FaCcMastercard, FaCcAmex } from "react-icons/fa6";
import { SiPaypal, SiCashapp, SiApplepay, SiBitcoin, SiTether } from "react-icons/si";
import theme from "../theme/theme";
import { Alert, Button } from "../components/ui";
import { formatINR, formatUSD } from "../utils/pricing";
import "./PaymentPage.css";

const WHATSAPP_NUMBER = "+12403013547";
const BRAND_NAME = theme.brand.name;

// ── UPI config ───────────────────────────────────────────────────────────
const UPI_ID = "9251033152@mairtel";
const PAYEE_NAME = "MKR Tools & Softwares"; // payee name sent in the UPI request
const QR_IMAGE_URL = "https://i.ibb.co/W4chwP53/image.png";

// Flip to false if the bank's UPI servers go down again.
const UPI_AVAILABLE = true;

const PAYMENT_WINDOW_SECONDS = 10 * 60; // starts the moment the page loads
const UTR_LENGTH = 12;

// Backend base URL. Leave empty when Express serves the React build itself.
const API_BASE = "https://dexterluxuries-production.up.railway.app";

// ── Payment methods shown at checkout ────────────────────────────────────
// Only UPI has a working flow. The others are listed but shown blurred and
// marked "Unavailable" — set `available: true` only once a real payment
// flow exists for that method.
function UpiMark() {
  return <span className="pay-upi-mark">UPI</span>;
}

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", desc: "GPay, PhonePe, Paytm", icons: [UpiMark], available: UPI_AVAILABLE },
  { id: "card", label: "Cards", desc: "Visa, Mastercard, Amex", icons: [FaCcVisa, FaCcMastercard, FaCcAmex] },
  { id: "netbanking", label: "Netbanking", desc: "All major banks", icons: [LuLandmark] },
  { id: "wallet", label: "Wallets", desc: "Paytm, Amazon Pay", icons: [LuWallet] },
  { id: "paypal", label: "PayPal", desc: "PayPal balance or card", icons: [SiPaypal] },
  { id: "cashapp", label: "Cash App", desc: "Pay with $Cashtag", icons: [SiCashapp] },
  { id: "applepay", label: "Apple Pay", desc: "iPhone, Mac, Watch", icons: [SiApplepay] },
  { id: "crypto", label: "Crypto", desc: "BTC, USDT", icons: [SiBitcoin, SiTether] },
];

// ── Helpers ──────────────────────────────────────────────────────────────
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

// ── Payment app marks (inline SVG, no external requests) ─────────────────
// Simplified marks. To use the official artwork, download it from each
// brand's asset page and swap the contents of these components for an <img>.
function GPayLogo() {
  return (
    <span className="pay-logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      <span style={{ color: "#5F6368", fontWeight: 600 }}>Pay</span>
    </span>
  );
}

function PhonePeLogo() {
  return (
    <span className="pay-logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22">
        <circle cx="12" cy="12" r="12" fill="#5F259F" />
        <text x="12" y="16.4" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#fff" fontFamily="'Noto Sans Devanagari','Nirmala UI',sans-serif">
          पे
        </text>
      </svg>
      <span style={{ color: "#5F259F", fontWeight: 700 }}>PhonePe</span>
    </span>
  );
}

function PaytmLogo() {
  return (
    <span className="pay-logo" aria-hidden="true" style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.6px" }}>
      <span style={{ color: "#002E6E" }}>pay</span>
      <span style={{ color: "#00BAF2" }}>tm</span>
    </span>
  );
}

const STEPS = ["Pay", "Confirm", "Get access"];

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
  const listedUSD = orderData?.amountUSD != null ? formatUSD(orderData.amountUSD) : null;
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

  if (!orderData) return null;

  const amountLabel = displayAmount !== null ? `₹${displayAmount}` : "—";
  const payLabel = displayAmount !== null ? `Pay ₹${displayAmount} with UPI` : "Pay with UPI";
  const currentStep = phase === "delivery" ? 2 : utrValid ? 1 : 0;

  // ---------- UPI building blocks ----------
  const qrPanel = (
    <div className="pay-qr">
      <div className={`pay-qr__frame${qrRevealed ? " is-revealed" : ""}${expired ? " is-expired" : ""}`}>
        <img src={QR_IMAGE_URL} alt="UPI QR code" />
        {!qrRevealed && (
          <button className="pay-qr__veil" type="button" onClick={() => setQrRevealed(true)} disabled={expired} aria-label="Show QR code">
            <span className="pay-qr__veil-icon">
              <LuEye aria-hidden="true" />
            </span>
            <span className="pay-qr__veil-text">Show QR code</span>
            <span className="pay-qr__veil-sub">{expired ? "Window closed" : "Scan from another phone"}</span>
          </button>
        )}
      </div>
      <p className="pay-qr__caption">{qrRevealed ? "Scan with any UPI app, then come back here." : "Hidden until you need it."}</p>
    </div>
  );

  const upiIdChip = (
    <div className="pay-upi-id">
      <span className="pay-upi-id__label">UPI ID</span>
      <button type="button" className="pay-upi-chip" onClick={() => handleCopy(UPI_ID, setCopiedUpi)} aria-label="Copy UPI ID">
        <span className="ui-mono">{UPI_ID}</span>
        {copiedUpi ? <LuCheck aria-hidden="true" className="pay-upi-chip__ok" /> : <LuCopy aria-hidden="true" />}
      </button>
      {copiedUpi && (
        <span className="pay-copied" role="status">
          Copied
        </span>
      )}
    </div>
  );

  const payButtons = (
    <div className="pay-buttons">
      <Button variant="primary" size="lg" block disabled={expired} onClick={() => (window.location.href = genericUpiLink)} icon={<LuZap />}>
        {payLabel}
      </Button>
      <div className="pay-apps">
        <button className="pay-app" type="button" disabled={expired} onClick={() => (window.location.href = gpayLink)} aria-label="Pay with Google Pay" title="Google Pay">
          <GPayLogo />
        </button>
        <button className="pay-app" type="button" disabled={expired} onClick={() => (window.location.href = phonepeLink)} aria-label="Pay with PhonePe" title="PhonePe">
          <PhonePeLogo />
        </button>
        <button className="pay-app" type="button" disabled={expired} onClick={() => (window.location.href = paytmLink)} aria-label="Pay with Paytm" title="Paytm">
          <PaytmLogo />
        </button>
      </div>
    </div>
  );

  const scanSteps = (
    <ol className="pay-scan-steps">
      <li>
        <span>Open any UPI app on your phone</span>
      </li>
      <li>
        <span>Scan the QR code or pay to the UPI ID</span>
      </li>
      <li>
        <span>
          Pay exactly <strong className="ui-mono">{amountLabel}</strong>, then enter the UTR below
        </span>
      </li>
    </ol>
  );

  return (
    <div className="pay-page">
      {/* ---------- Title + progress ---------- */}
      <div className="pay-head">
        <div className="pay-head__title">
          <h1>Checkout</h1>
          <span className="pay-head__secure">
            <LuLock aria-hidden="true" />
            Secure checkout
          </span>
        </div>
        <ol className="pay-progress" aria-label="Checkout progress">
          {STEPS.map((label, i) => {
            const state = i < currentStep ? "done" : i === currentStep ? "current" : "todo";
            return (
              <li key={label} className={`pay-progress__step is-${state}`} aria-current={state === "current" ? "step" : undefined}>
                <span className="pay-progress__dot">{state === "done" ? <LuCheck aria-hidden="true" /> : i + 1}</span>
                <span className="pay-progress__label">{label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="pay-shell">
        {/* ---------- Order summary (left on laptops, top on phones) ---------- */}
        <aside className="pay-side" aria-label="Order summary">
          <div className="pay-side__merchant">
            <img src={theme.brand.logo} alt="" width="40" height="40" />
            <div>
              <strong>{BRAND_NAME}</strong>
              <span>Order {orderRef}</span>
            </div>
          </div>

          <div className="pay-side__amount">
            <span className="pay-side__muted">Amount to pay</span>
            <strong className="ui-mono">{amountLabel}</strong>
            {listedUSD && <span className="pay-side__muted">Listed at {listedUSD} · charged in INR</span>}
          </div>

          <dl className="pay-side__details">
            <div>
              <dt>Product</dt>
              <dd>{productName}</dd>
            </div>
            {planName && (
              <div>
                <dt>Plan</dt>
                <dd>{planName}</dd>
              </div>
            )}
            {buyerEmail && (
              <div>
                <dt>Delivering to</dt>
                <dd>{buyerEmail}</dd>
              </div>
            )}
          </dl>

          {phase === "pay" && UPI_AVAILABLE && (
            <div className={`pay-timer${expired ? " pay-timer--expired" : urgent ? " pay-timer--urgent" : ""}`}>
              <div className="pay-timer__top">
                <span className="pay-timer__label">
                  <LuClock aria-hidden="true" />
                  {expired ? "Payment window closed" : "Price held for"}
                </span>
                {!expired && <span className="pay-timer__value ui-mono">{formatMMSS(secondsLeft)}</span>}
              </div>
              <div
                className="pay-timer__track"
                role="progressbar"
                aria-label="Time left to pay"
                aria-valuemin={0}
                aria-valuemax={PAYMENT_WINDOW_SECONDS}
                aria-valuenow={expired ? 0 : secondsLeft}
              >
                <div className="pay-timer__fill" style={{ width: `${expired ? 0 : progressPct}%` }} />
              </div>
            </div>
          )}

          <ul className="pay-side__assurances">
            <li>
              <LuShieldCheck aria-hidden="true" />
              UTR matched against our bank statement
            </li>
            <li>
              <FaWhatsapp aria-hidden="true" />
              Access delivered on WhatsApp in 15–30 minutes
            </li>
          </ul>

          <button type="button" className="pay-side__help" onClick={() => openWhatsApp("I need help completing my payment.")}>
            <LuMessageCircle aria-hidden="true" />
            Need help? Chat with us
          </button>
        </aside>

        {/* ---------- Payment area ---------- */}
        <section className="pay-main">
          {phase === "pay" && (
            <>
              <div className="pay-block">
                <h2 className="pay-block__title">Payment method</h2>
                <div className="pay-methods" role="radiogroup" aria-label="Payment method">
                  {PAYMENT_METHODS.map(({ id, label, desc, icons, available }) => (
                    <div
                      key={id}
                      role="radio"
                      aria-checked={available && id === "upi"}
                      aria-disabled={!available}
                      aria-label={available ? `${label} — ${desc}` : `${label} — unavailable`}
                      tabIndex={available ? 0 : -1}
                      className={`pay-method${available ? " is-selected" : " is-unavailable"}`}
                    >
                      <span className="pay-method__body" aria-hidden="true">
                        <span className="pay-method__icons">
                          {icons.map((Icon, i) => (
                            <Icon key={i} />
                          ))}
                        </span>
                        <span className="pay-method__label">{label}</span>
                        <span className="pay-method__desc">{desc}</span>
                      </span>
                      {available ? (
                        <span className="pay-method__check" aria-hidden="true">
                          <LuCheck />
                        </span>
                      ) : (
                        <span className="pay-method__flag" aria-hidden="true">
                          Unavailable
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {!UPI_AVAILABLE ? (
                <div className="pay-block">
                  <Alert variant="danger">
                    <strong>UPI is down right now.</strong> Our bank's servers aren't accepting payments. Message us and we'll send you a working payment link in a minute.
                  </Alert>
                  <Button variant="whatsapp" size="lg" block icon={<FaWhatsapp />} onClick={() => openWhatsApp("UPI is showing as unavailable — please send me a payment link.")}>
                    Get a payment link
                  </Button>
                </div>
              ) : (
                <>
                  {/* Step 1 — pay */}
                  <div className="pay-block">
                    <div className="pay-step">
                      <span className="pay-step__num">1</span>
                      <div>
                        <h2 className="pay-step__title">Pay {amountLabel} with UPI</h2>
                        <p className="pay-step__sub">Use any UPI app — Google Pay, PhonePe, Paytm, BHIM and more</p>
                      </div>
                    </div>

                    {isMobile ? (
                      <div className="pay-upi pay-upi--mobile">
                        {payButtons}
                        <div className="pay-divider">
                          <span>or scan the QR code</span>
                        </div>
                        {qrPanel}
                        {upiIdChip}
                      </div>
                    ) : (
                      <div className="pay-upi">
                        {qrPanel}
                        <div className="pay-upi__info">
                          {scanSteps}
                          {upiIdChip}
                          <div className="pay-divider">
                            <span>or open an app on this device</span>
                          </div>
                          {payButtons}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2 — confirm with UTR */}
                  <div className="pay-block">
                    <div className="pay-step">
                      <span className={`pay-step__num${utrValid ? " pay-step__num--done" : ""}`}>
                        {utrValid ? <LuCheck aria-label="Done" /> : "2"}
                      </span>
                      <div>
                        <h2 className="pay-step__title">Confirm your payment</h2>
                        <p className="pay-step__sub">Enter the UTR from your payment receipt</p>
                      </div>
                    </div>

                    <div className="pay-confirm">
                      <div className="ui-field">
                        <div className="ui-label-row">
                          <label className="ui-label" htmlFor="utr-input">
                            UTR number
                          </label>
                          <span className={`pay-utr__count ui-mono${utrValid ? " is-ok" : ""}`}>
                            {utr.length}/{UTR_LENGTH}
                          </span>
                        </div>
                        <div className="pay-utr">
                          <input
                            id="utr-input"
                            className={`ui-input pay-utr__input${utrValid ? " ui-input--valid" : ""}`}
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
                          {utrValid && <LuCheck className="pay-utr__check" aria-hidden="true" />}
                        </div>
                        <p className="ui-help" id="utr-help">
                          Find the 12-digit UTR (also called UPI Ref No.) in your app under the payment's transaction details.
                        </p>
                      </div>

                      {confirmError && <Alert variant="danger">{confirmError}</Alert>}

                      <Button
                        variant="success"
                        size="lg"
                        block
                        disabled={!canConfirm}
                        loading={confirming}
                        onClick={confirmPayment}
                        icon={<LuCheck />}
                      >
                        I've paid — get my access
                      </Button>
                      <p className="pay-hint">
                        We match the UTR against our bank statement before delivering. Access arrives on WhatsApp within 15–30 minutes.
                      </p>

                      {expired && <Alert variant="danger">This window closed. Message us on WhatsApp and we'll reopen it.</Alert>}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ================= DELIVERY ================= */}
          {phase === "delivery" && (
            <div className="pay-block pay-success">
              <span className="pay-success__icon">
                <LuCheck aria-hidden="true" />
              </span>
              <h2 className="pay-success__title">Payment submitted</h2>
              <p className="pay-success__text">
                Open WhatsApp to collect your access. We verify the transfer and deliver within <strong>15–30 minutes</strong>.
              </p>

              {confirmError && <Alert variant="danger">{confirmError}</Alert>}

              <Button
                variant="whatsapp"
                size="lg"
                block
                icon={<FaWhatsapp />}
                onClick={() => openWhatsApp("I've completed my UPI payment — please confirm and deliver access.")}
              >
                Collect my access
              </Button>

              <dl className="pay-success__meta">
                <div>
                  <dt>Order reference</dt>
                  <dd className="ui-mono">{orderRef}</dd>
                </div>
                <div>
                  <dt>UTR</dt>
                  <dd className="ui-mono">{utr}</dd>
                </div>
                <div>
                  <dt>Amount</dt>
                  <dd className="ui-mono">{amountLabel}</dd>
                </div>
              </dl>
            </div>
          )}
        </section>
      </div>

      <p className="pay-trust">
        <LuShieldCheck aria-hidden="true" />
        Encrypted transfer · Manual verification
      </p>
    </div>
  );
}
