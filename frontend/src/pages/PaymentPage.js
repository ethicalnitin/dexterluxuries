import React, { useState, useMemo, useEffect } from "react";

const WHATSAPP_NUMBER = "919289847981";

function getHashParams() {
  const hash = window.location.hash;
  const queryStart = hash.indexOf("?");
  if (queryStart === -1) return new URLSearchParams("");
  return new URLSearchParams(hash.slice(queryStart + 1));
}

// The amount arrives in the URL as the real INR price (see ProductPage's
// handleBuyNowClick, which passes product.price straight through — no
// conversion). We just format it, we don't convert it to anything.
function formatINR(amount) {
  const num = Number(amount);
  if (isNaN(num)) return null;
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function PaymentPage() {
  const [clicked, setClicked] = useState(false);

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

    // Real INR amount, taken as-is from the URL — no conversion.
    const inrAmount = rawAmt ? formatINR(rawAmt) : null;

    return { amount: inrAmount, productName };
  }, []);

  // Auto-open WhatsApp after short delay
  useEffect(() => {
    const timer = setTimeout(() => openWhatsApp(), 1800);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line

  function openWhatsApp() {
    const lines = [
      `👋 Hi, I'd like to place an order on Dexter Luxuries.`,
      ``,
      urlParams.productName
        ? `🛍️ *Product:* ${urlParams.productName}`
        : null,
      urlParams.amount !== null
        ? `💰 *Amount:* ₹${urlParams.amount}`
        : null,
      ``,
      `Please assist me with payment. Thank you!`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`,
      "_blank"
    );

    setClicked(true);
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --gold: #C9A84C;
      --gold-dim: rgba(201,168,76,.18);
      --ink: #0C0C0C;
      --ink2: #111111;
      --ink3: #1A1A1A;
      --ivory: #F4EFE6;
      --ivory-dim: rgba(244,239,230,.5);
      --wa: #25D366;
      --wa-dim: rgba(37,211,102,.12);
    }

    body {
      background: var(--ink);
    }

    .page {
      min-height: 100vh;
      background: var(--ink);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
      position: relative;
      overflow: hidden;
    }

    .page::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 50% at 50% -5%, rgba(201,168,76,.08) 0%, transparent 65%),
        radial-gradient(ellipse 50% 40% at 90% 100%, rgba(37,211,102,.04) 0%, transparent 60%);
      pointer-events: none;
    }

    .card {
      width: 100%;
      max-width: 380px;
      position: relative;
      z-index: 1;
      text-align: center;
      animation: rise .7s cubic-bezier(.22,1,.36,1) both;
    }

    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(28px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .diamond {
      width: 32px;
      height: 32px;
      background: var(--gold);
      clip-path: polygon(50% 0%,100% 50%,50% 100%,0% 50%);
      margin: 0 auto 14px;
    }

    .brand {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem;
      font-weight: 700;
      color: var(--ivory);
      letter-spacing: 3px;
      text-transform: uppercase;
    }

    .brand span {
      color: var(--gold);
    }

    .brand-sub {
      margin-top: 6px;
      font-family: 'DM Sans', sans-serif;
      font-size: 9px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: rgba(244,239,230,.2);
    }

    .rule {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 16px 0 32px;
    }

    .rule-line {
      width: 56px;
      height: 1px;
      background: linear-gradient(to right, transparent, var(--gold-dim));
    }

    .rule-line.r {
      background: linear-gradient(to left, transparent, var(--gold-dim));
    }

    .rule-dot {
      width: 4px;
      height: 4px;
      background: var(--gold);
      transform: rotate(45deg);
    }

    .panel {
      background: var(--ink2);
      border: 1px solid var(--ink3);
      border-radius: 2px;
      padding: 40px 28px 36px;
      box-shadow: 0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(201,168,76,.04);
    }

    .order-label {
      font-family: 'DM Sans', sans-serif;
      font-size: 9px;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: rgba(244,239,230,.2);
      margin-bottom: 8px;
    }

    .order-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--ivory);
      margin-bottom: 6px;
    }

    .order-price {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.6rem;
      font-weight: 700;
      color: var(--gold);
      line-height: 1.1;
    }

    .sep {
      width: 40px;
      height: 1px;
      background: var(--gold-dim);
      margin: 28px auto;
    }

    .wa-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 18px 24px;
      background: var(--wa-dim);
      border: 1px solid rgba(37,211,102,.28);
      border-radius: 2px;
      color: var(--wa);
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: .8px;
      text-transform: uppercase;
      cursor: pointer;
      transition: background .2s, border-color .2s, transform .15s, box-shadow .2s;
      animation: waPulse 3s ease-in-out infinite;
    }

    .wa-btn:hover {
      background: rgba(37,211,102,.2);
      border-color: rgba(37,211,102,.55);
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(37,211,102,.14);
      animation: none;
    }

    .wa-btn:active {
      transform: translateY(0);
    }

    @keyframes waPulse {
      0%,100% {
        box-shadow: 0 0 0 0 rgba(37,211,102,0);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(37,211,102,.06);
      }
    }

    .wa-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .redirect-note {
      margin-top: 16px;
      font-family: 'DM Sans', sans-serif;
      font-size: 10px;
      color: rgba(244,239,230,.18);
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .dot-pulse {
      display: inline-flex;
      gap: 3px;
    }

    .dot-pulse span {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: rgba(37,211,102,.4);
      animation: dotBounce 1.2s ease-in-out infinite;
    }

    .dot-pulse span:nth-child(2) {
      animation-delay: .2s;
    }

    .dot-pulse span:nth-child(3) {
      animation-delay: .4s;
    }

    @keyframes dotBounce {
      0%,80%,100% {
        opacity: .3;
        transform: scale(.8);
      }
      40% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .confirmed {
      margin-top: 16px;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
      color: var(--wa);
      opacity: .7;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .footer {
      margin-top: 24px;
      font-family: 'DM Sans', sans-serif;
      font-size: 9px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #1e1e1e;
    }
  `;

  return (
    <div className="page">
      <style>{css}</style>

      <div className="card">
        <div className="diamond" />

        <div className="brand">
          Dexter <span>Luxuries</span>
        </div>

        <div className="brand-sub">Secure Checkout</div>

        <div className="rule">
          <div className="rule-line" />
          <div className="rule-dot" />
          <div className="rule-line r" />
        </div>

        <div className="panel">
          {(urlParams.productName || urlParams.amount !== null) && (
            <>
              <div className="order-label">Your Order</div>

              {urlParams.productName && (
                <div className="order-name">
                  {urlParams.productName}
                </div>
              )}

              {urlParams.amount !== null && (
                <div className="order-price">
                  ₹{urlParams.amount}
                </div>
              )}

              <div className="sep" />
            </>
          )}

          <button className="wa-btn" onClick={openWhatsApp}>
            <svg className="wa-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
            </svg>

            Proceed to WhatsApp
          </button>

          {!clicked ? (
            <div className="redirect-note">
              Opening automatically
              <div className="dot-pulse">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : (
            <div className="confirmed">
              ✓ WhatsApp opened — send the message to confirm
            </div>
          )}
        </div>

        <div className="footer">
          © Dexter Luxuries · All rights reserved
        </div>
      </div>
    </div>
  );
}