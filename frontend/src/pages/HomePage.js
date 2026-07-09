import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');

  :root {
    --bg: #05050A;
    --bg2: #0A0A13;
    --surface: rgba(255,255,255,0.045);
    --surface-hover: rgba(255,255,255,0.07);
    --border: rgba(255,255,255,0.09);
    --violet: #8B5CF6;
    --violet-soft: #C4B5FD;
    --cyan: #22D3EE;
    --text: #F4F2FF;
    --text-dim: rgba(244,242,255,0.62);
    --text-faint: rgba(244,242,255,0.38);
    --grad: linear-gradient(92deg, var(--violet) 0%, var(--cyan) 100%);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  .hp-root {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ---------- Marquee ---------- */
  .hp-announce-bar {
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    padding: 9px 0;
    overflow: hidden;
    white-space: nowrap;
  }
  .hp-marquee-track { display: inline-flex; animation: marquee 30s linear infinite; }
  .hp-marquee-track span {
    padding-right: 64px;
    font-size: 12.5px;
    font-weight: 500;
    letter-spacing: 0.4px;
    color: var(--text-dim);
  }
  .hp-marquee-track span strong {
    background: var(--grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 600;
  }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  /* ---------- Hero ---------- */
  .hp-hero {
    position: relative;
    min-height: 88vh;
    display: flex;
    align-items: center;
    padding: 100px 24px 80px;
    overflow: hidden;
  }

  .hp-aurora { position: absolute; inset: 0; z-index: 0; }
  .hp-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    opacity: 0.55;
  }
  .hp-orb--1 { width: 520px; height: 520px; background: var(--violet); top: -160px; left: -100px; animation: drift1 18s ease-in-out infinite; }
  .hp-orb--2 { width: 420px; height: 420px; background: var(--cyan); bottom: -140px; right: -80px; opacity: 0.3; animation: drift2 22s ease-in-out infinite; }
  .hp-orb--3 { width: 300px; height: 300px; background: #C4B5FD; top: 30%; right: 10%; opacity: 0.22; animation: drift1 26s ease-in-out infinite reverse; }

  @keyframes drift1 {
    0%, 100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(40px,30px) scale(1.08); }
  }
  @keyframes drift2 {
    0%, 100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(-30px,-20px) scale(1.05); }
  }

  .hp-grid-overlay {
    position: absolute; inset: 0; z-index: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 75%);
  }

  .hp-hero-inner {
    position: relative;
    z-index: 1;
    max-width: 1180px;
    margin: 0 auto;
    width: 100%;
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 48px;
    align-items: center;
  }

  .hp-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 7px 16px;
    border-radius: 100px;
    font-size: 12.5px;
    color: var(--text-dim);
    margin-bottom: 26px;
    backdrop-filter: blur(6px);
  }
  .hp-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #34D399; box-shadow: 0 0 8px #34D399; }
  .hp-eyebrow b { color: var(--text); font-weight: 600; }

  .hp-hero-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(2.4rem, 5vw, 4rem);
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -1.5px;
    margin-bottom: 22px;
  }
  .hp-hero-title span {
    background: var(--grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .hp-hero-sub {
    font-size: 16.5px;
    line-height: 1.6;
    color: var(--text-dim);
    font-weight: 300;
    max-width: 460px;
    margin-bottom: 36px;
  }

  .hp-hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 44px; }

  .hp-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--grad);
    color: #0A0A13;
    font-weight: 600;
    font-size: 14.5px;
    padding: 14px 30px;
    border-radius: 10px;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 0 0 rgba(139,92,246,0);
    cursor: pointer;
  }
  .hp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(139,92,246,0.35); }

  .hp-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
    font-weight: 500;
    font-size: 14.5px;
    padding: 14px 26px;
    border-radius: 10px;
    text-decoration: none;
    transition: background 0.2s, border-color 0.2s;
    cursor: pointer;
  }
  .hp-btn-ghost:hover { background: var(--surface); border-color: rgba(255,255,255,0.2); }

  .hp-hero-metarow { display: flex; gap: 28px; flex-wrap: wrap; }
  .hp-hero-meta { display: flex; flex-direction: column; gap: 2px; }
  .hp-hero-meta-num { font-family: 'Space Grotesk', sans-serif; font-size: 1.4rem; font-weight: 700; }
  .hp-hero-meta-label { font-size: 11.5px; color: var(--text-faint); letter-spacing: 0.4px; }

  /* Signature: floating dashboard card */
  .hp-hero-visual { position: relative; display: flex; justify-content: center; }
  .hp-dash-card {
    position: relative;
    width: 100%;
    max-width: 380px;
    background: linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 26px;
    backdrop-filter: blur(14px);
    box-shadow: 0 30px 80px rgba(0,0,0,0.5);
    animation: floatCard 6s ease-in-out infinite;
  }
  @keyframes floatCard { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }

  .hp-dash-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .hp-dash-title { font-size: 13px; color: var(--text-dim); font-weight: 500; }
  .hp-dash-live { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #34D399; font-weight: 600; }
  .hp-dash-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #34D399; animation: pulse 1.6s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

  .hp-dash-num { font-family: 'Space Grotesk', sans-serif; font-size: 2.3rem; font-weight: 700; margin-bottom: 4px; }
  .hp-dash-sub { font-size: 12.5px; color: var(--text-faint); margin-bottom: 20px; }

  .hp-dash-chart { display: flex; align-items: flex-end; gap: 5px; height: 54px; margin-bottom: 22px; }
  .hp-dash-bar { flex: 1; background: linear-gradient(180deg, var(--cyan), var(--violet)); border-radius: 4px 4px 0 0; opacity: 0.85; }

  .hp-dash-toast {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 12px;
  }
  .hp-dash-toast-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--grad); display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #0A0A13; flex-shrink: 0;
  }
  .hp-dash-toast-text { font-size: 12px; line-height: 1.4; }
  .hp-dash-toast-text b { color: var(--text); }
  .hp-dash-toast-text span { color: var(--text-faint); display: block; font-size: 10.5px; margin-top: 1px; }

  /* ---------- Trust ---------- */
  .hp-trust {
    background: var(--bg2);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 44px 24px;
  }
  .hp-trust-grid {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 16px;
    max-width: 960px;
    margin: 0 auto;
  }
  .hp-trust-item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 12px 20px;
    border-radius: 12px;
    transition: transform 0.2s, background 0.2s;
  }
  .hp-trust-item:hover { transform: translateY(-2px); background: var(--surface-hover); }
  .hp-trust-icon { width: 20px; height: 20px; color: var(--violet-soft); flex-shrink: 0; }
  .hp-trust-text { font-size: 13px; color: var(--text-dim); font-weight: 500; white-space: nowrap; }

  /* ---------- Products ---------- */
  .hp-products {
    padding: 90px 24px 100px;
    max-width: 1200px;
    margin: 0 auto;
    scroll-margin-top: 24px;
  }
  .hp-section-header { text-align: center; margin-bottom: 52px; }
  .hp-section-eyebrow {
    display: inline-block; font-size: 12px; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; color: var(--violet-soft); margin-bottom: 14px;
  }
  .hp-section-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(1.8rem, 3.6vw, 2.6rem);
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 12px;
  }
  .hp-section-sub { font-size: 15px; color: var(--text-dim); font-weight: 300; }

  .hp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 18px;
  }

  .hp-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.25s, border-color 0.25s, background 0.25s;
  }
  .hp-card:hover { transform: translateY(-4px); border-color: rgba(139,92,246,0.4); background: var(--surface-hover); }

  .hp-card-img-wrap { position: relative; overflow: hidden; display: block; aspect-ratio: 4/3; }
  .hp-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
  .hp-card:hover .hp-card-img { transform: scale(1.05); }

  .hp-card-badge {
    position: absolute; top: 12px; left: 12px;
    background: rgba(10,10,19,0.75);
    border: 1px solid var(--border);
    backdrop-filter: blur(6px);
    color: var(--violet-soft);
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    padding: 5px 10px; border-radius: 6px;
  }

  .hp-card-body { padding: 20px; display: flex; flex-direction: column; flex: 1; }
  .hp-card-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.05rem; font-weight: 600; margin-bottom: 12px;
    color: var(--text); text-decoration: none; line-height: 1.35;
  }
  .hp-card-name a { color: inherit; text-decoration: none; }

  .hp-card-pricing { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; flex-wrap: wrap; }
  .hp-card-price { font-family: 'Space Grotesk', sans-serif; font-size: 1.2rem; font-weight: 700; color: var(--text); }
  .hp-card-strike { font-size: 13px; color: var(--text-faint); text-decoration: line-through; font-weight: 300; }
  .hp-card-discount {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px; color: #0A0A13;
    background: var(--grad); padding: 3px 8px; border-radius: 5px;
  }

  .hp-card-btn {
    display: inline-flex; align-items: center; gap: 8px; margin-top: auto;
    background: transparent; border: 1px solid var(--border); color: var(--text);
    font-size: 13px; font-weight: 500; letter-spacing: 0.3px;
    padding: 10px 18px; border-radius: 8px; text-decoration: none;
    transition: all 0.2s; width: fit-content;
  }
  .hp-card-btn:hover { background: var(--grad); color: #0A0A13; border-color: transparent; }

  .hp-loading, .hp-empty { text-align: center; padding: 80px 24px; color: var(--text-dim); font-size: 15px; font-weight: 300; }
  .hp-loading-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--violet); margin: 0 3px; animation: loadingBounce 1.2s infinite; }
  .hp-loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .hp-loading-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes loadingBounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-8px); opacity: 1; } }

  /* ---------- Testimonials ---------- */
  .hp-testimonials {
    padding: 20px 24px 100px;
    max-width: 1200px;
    margin: 0 auto;
    scroll-margin-top: 24px;
  }
  .hp-tgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 16px; }
  .hp-tcard {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 22px;
    display: flex;
    flex-direction: column;
  }
  .hp-tstars { color: var(--violet-soft); font-size: 13px; margin-bottom: 12px; letter-spacing: 2px; }
  .hp-tquote { font-size: 13.5px; color: var(--text-dim); line-height: 1.6; margin-bottom: 20px; flex: 1; }
  .hp-tfooter { display: flex; align-items: center; gap: 10px; }
  .hp-tavatar { width: 34px; height: 34px; border-radius: 50%; background: var(--grad); display: flex; align-items: center; justify-content: center; font-size: 12.5px; font-weight: 700; color: #0A0A13; flex-shrink: 0; }
  .hp-tname { font-size: 13px; font-weight: 600; color: var(--text); }
  .hp-trole { font-size: 11.5px; color: var(--text-faint); }
  .hp-tverified { margin-left: auto; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: #34D399; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); padding: 3px 8px; border-radius: 5px; }

  /* ---------- Final CTA ---------- */
  .hp-final {
    margin: 0 24px 90px;
    max-width: 1152px;
    margin-left: auto; margin-right: auto;
    background: linear-gradient(135deg, rgba(139,92,246,0.14), rgba(34,211,238,0.08));
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 64px 40px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .hp-final-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 700; margin-bottom: 14px; letter-spacing: -0.5px; }
  .hp-final-sub { font-size: 15px; color: var(--text-dim); margin-bottom: 30px; }

  @media (max-width: 900px) {
    .hp-hero-inner { grid-template-columns: 1fr; }
    .hp-hero-visual { order: -1; margin-bottom: 8px; }
  }
  @media (max-width: 640px) {
    .hp-grid { grid-template-columns: 1fr 1fr; }
    .hp-hero { padding-top: 70px; }
  }
  @media (max-width: 420px) {
    .hp-grid { grid-template-columns: 1fr; }
  }

  @media (prefers-reduced-motion: reduce) {
    .hp-orb, .hp-dash-card, .hp-dash-live-dot, .hp-marquee-track { animation: none !important; }
    html { scroll-behavior: auto; }
  }
`;

/* ---------------- Dummy / static content ---------------- */

const trustBadges = [
  {
    label: "Secure Payment",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Instant Delivery",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
      </svg>
    ),
  },
  {
    label: "SSL Certified",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </svg>
    ),
  },
  {
    label: "24/7 Support",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13a8 8 0 0116 0" />
        <rect x="2" y="13" width="4" height="6" rx="1.5" />
        <rect x="18" y="13" width="4" height="6" rx="1.5" />
        <path d="M20 19a4 4 0 01-4 4h-2" />
      </svg>
    ),
  },
];

// Rotating "live purchase" toasts inside the hero dashboard card — dummy data.
const liveToasts = [
  { name: "Rohan", initials: "RS", product: "purchased Lifetime Access", time: "1 min ago" },
  { name: "Ananya", initials: "AK", product: "purchased Pro Bundle", time: "6 min ago" },
  { name: "Vikram", initials: "VN", product: "purchased Starter Pack", time: "14 min ago" },
  { name: "Priya", initials: "PM", product: "purchased Lifetime Access", time: "22 min ago" },
];

// Sparkline bar heights for the dashboard card — dummy data.
const chartBars = [30, 45, 38, 60, 50, 72, 64, 85, 70, 92];

const heroMetrics = [
  { num: "50K+", label: "Customers served" },
  { num: "4.9/5", label: "Average rating" },
  { num: "100%", label: "Digital delivery" },
];

// Testimonials — dummy data, styled after the "verified member review" pattern.
const testimonials = [
  {
    name: "Naomi W.",
    role: "Verified buyer · 8mo",
    quote: "I'd given up on two other stores because setup was a mess before my first order. This is the only one I didn't cancel after month one.",
    initials: "NW",
  },
  {
    name: "Tariq P.",
    role: "Verified buyer · 3mo",
    quote: "Support actually replies. Delivery was instant and the product matched exactly what was on the listing page — no surprises.",
    initials: "TP",
  },
  {
    name: "Rina J.",
    role: "Verified buyer · 1yr",
    quote: "What sold me was the transparency on pricing. No hidden fees, no upsell games. I trust the checkout now.",
    initials: "RJ",
  },
  {
    name: "Chris K.",
    role: "Verified buyer · 4mo",
    quote: "Coming from a competitor, this store feels tighter and more organized. Cancelled my old subscription for this one.",
    initials: "CK",
  },
  {
    name: "Priya M.",
    role: "Verified buyer · 6mo",
    quote: "Clean interface, fast checkout, and the discount codes actually apply correctly. Small thing, but it matters.",
    initials: "PM",
  },
  {
    name: "Vince N.",
    role: "Verified buyer · 1yr",
    quote: "Best part is how clear the product pages are before you buy. No second-guessing what you're getting.",
    initials: "VN",
  },
];

const marqueeText = (
  <>
    <strong>80% off</strong>&nbsp;on select digital products&nbsp;·&nbsp;Instant delivery on every order&nbsp;·&nbsp;
    <strong>New drops weekly</strong>&nbsp;·&nbsp;Premium plans at unbeatable prices
  </>
);

/**
 * Formats a numeric price as Indian Rupees with proper digit grouping,
 * e.g. 1499 -> "₹1,499".
 */
const formatINR = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

/**
 * Returns the real display price and (optional) strikethrough price for a
 * product, taken directly from the product's actual stored values —
 * no fake/hardcoded pricing and no currency conversion.
 */
const getDisplayPrice = (price, strikeThroughPrice) => {
  return {
    displayPrice: formatINR(price),
    displayStrike: strikeThroughPrice ? formatINR(strikeThroughPrice) : null,
  };
};

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastIndex, setToastIndex] = useState(0);

  useEffect(() => {
    fetch("https://chartvault.shop/api/products")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setToastIndex((prev) => (prev + 1) % liveToasts.length);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  const activeToast = liveToasts[toastIndex];

  return (
    <>
      <style>{style}</style>
      <div className="hp-root">

        <div className="hp-announce-bar">
          <div className="hp-marquee-track">
            <span>{marqueeText}</span>
            <span>{marqueeText}</span>
          </div>
        </div>

        <section className="hp-hero">
          <div className="hp-aurora">
            <div className="hp-orb hp-orb--1" />
            <div className="hp-orb hp-orb--2" />
            <div className="hp-orb hp-orb--3" />
          </div>
          <div className="hp-grid-overlay" />

          <div className="hp-hero-inner">
            <div>
              <div className="hp-eyebrow">
                <span className="hp-eyebrow-dot" />
                Trusted by <b>50,000+</b> customers · 5+ years online
              </div>

              <h1 className="hp-hero-title">
                Unlock digital <span>excellence</span>, delivered instantly
              </h1>

              <p className="hp-hero-sub">
                Premium digital products, curated and priced right — no waiting,
                no guesswork. Get access the moment you check out.
              </p>

            

              <div className="hp-hero-metarow">
                {heroMetrics.map((m) => (
                  <div className="hp-hero-meta" key={m.label}>
                    <span className="hp-hero-meta-num">{m.num}</span>
                    <span className="hp-hero-meta-label">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hp-hero-visual">
              <div className="hp-dash-card">
                <div className="hp-dash-head">
                  <span className="hp-dash-title">Orders today</span>
                  <span className="hp-dash-live"><span className="hp-dash-live-dot" />Live</span>
                </div>
                <div className="hp-dash-num">30+</div>
                <div className="hp-dash-sub">↑ 18% vs. yesterday</div>

                <div className="hp-dash-chart">
                  {chartBars.map((h, i) => (
                    <div key={i} className="hp-dash-bar" style={{ height: `${h}%` }} />
                  ))}
                </div>

                <div className="hp-dash-toast">
                  <span className="hp-dash-toast-avatar">{activeToast.initials}</span>
                  <span className="hp-dash-toast-text">
                    <b>{activeToast.name}</b> {activeToast.product}
                    <span>{activeToast.time}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hp-trust">
          <div className="hp-trust-grid">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="hp-trust-item">
                <span className="hp-trust-icon">{badge.icon}</span>
                <span className="hp-trust-text">{badge.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PRODUCTS — its own top-level section, target of "Explore Products" */}
        <section className="hp-products" id="products">
          <div className="hp-section-header">
            <span className="hp-section-eyebrow">Featured Products</span>
            <h2 className="hp-section-title">Handpicked digital gems</h2>
            <p className="hp-section-sub">Fast delivery ·  Hottest Products · Updated weekly</p>
          </div>

          {loading ? (
            <div className="hp-loading">
              <span className="hp-loading-dot" />
              <span className="hp-loading-dot" />
              <span className="hp-loading-dot" />
              <p style={{ marginTop: 16 }}>Loading products, please wait...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="hp-empty">
              <p>No products available right now. Please check back soon.</p>
            </div>
          ) : (
            <div className="hp-grid">
              {products.map((product) => {
                const { displayPrice, displayStrike } = getDisplayPrice(
                  product.price,
                  product.strikeThroughPrice
                );
                const discountPct = product.strikeThroughPrice
                  ? Math.round(
                      ((product.strikeThroughPrice - product.price) /
                        product.strikeThroughPrice) *
                        100
                    )
                  : null;

                return (
                  <div key={product.id} className="hp-card">
                    <Link to={`/product/${product.id}`} className="hp-card-img-wrap">
                      <img src={product.image} alt={product.name} className="hp-card-img" />
                      <div className="hp-card-badge">Digital</div>
                    </Link>
                    <div className="hp-card-body">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="hp-card-name">{product.name}</h3>
                      </Link>
                      <div className="hp-card-pricing">
                        <span className="hp-card-price">{displayPrice}</span>
                        {displayStrike && (
                          <>
                            <span className="hp-card-strike">{displayStrike}</span>
                            {discountPct ? (
                              <span className="hp-card-discount">{discountPct}% off</span>
                            ) : null}
                          </>
                        )}
                      </div>
                      <Link to={`/product/${product.id}`} className="hp-card-btn">View Details →</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* TESTIMONIALS — its own top-level section, target of "See Reviews" */}
        <section className="hp-testimonials" id="reviews">
          <div className="hp-section-header">
            <span className="hp-section-eyebrow">From The Community</span>
            <h2 className="hp-section-title">What buyers say</h2>
            <p className="hp-section-sub">Real reviews from verified purchases</p>
          </div>
          <div className="hp-tgrid">
            {testimonials.map((t) => (
              <div className="hp-tcard" key={t.name}>
                <div className="hp-tstars">★★★★★</div>
                <p className="hp-tquote">"{t.quote}"</p>
                <div className="hp-tfooter">
                  <span className="hp-tavatar">{t.initials}</span>
                  <div>
                    <div className="hp-tname">{t.name}</div>
                    <div className="hp-trole">{t.role}</div>
                  </div>
                  <span className="hp-tverified">VERIFIED</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="hp-final">
          <h2 className="hp-final-title">Ready to level up your collection?</h2>
          <p className="hp-final-sub">Join 50,000+ customers already using our products.</p>
          <a href="#products" className="hp-btn-primary">Browse All Products →</a>
        </section>

      </div>
    </>
  );
};

export default HomePage;