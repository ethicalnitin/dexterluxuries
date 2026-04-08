import React, { useState, useEffect, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --gold: #C9A84C;
    --gold-light: #E8C97A;
    --gold-dim: #8B6914;
    --dark: #0A0A0A;
    --dark2: #111111;
    --dark3: #1A1A1A;
    --dark4: #242424;
    --white: #F5F0E8;
    --white-dim: rgba(245,240,232,0.6);
    --white-faint: rgba(245,240,232,0.08);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .proofs-root {
    background: var(--dark);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── HERO ── */
  .proofs-hero {
    position: relative;
    min-height: 92vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 24px 60px;
    overflow: hidden;
  }

  .proofs-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.18) 0%, transparent 70%),
      radial-gradient(ellipse 40% 40% at 20% 80%, rgba(201,168,76,0.07) 0%, transparent 60%);
    pointer-events: none;
  }

  .proofs-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(201,168,76,0.4);
    background: rgba(201,168,76,0.08);
    color: var(--gold-light);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 3px;
    text-transform: uppercase;
    padding: 8px 20px;
    border-radius: 100px;
    margin-bottom: 36px;
    animation: fadeUp 0.6s ease both;
  }

  .proofs-hero-badge span { font-size: 14px; }

  .proofs-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.8rem, 7vw, 5.5rem);
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: -1px;
    margin-bottom: 24px;
    animation: fadeUp 0.7s 0.1s ease both;
  }

  .proofs-hero-title em {
    font-style: italic;
    color: var(--gold);
    display: block;
  }

  .proofs-hero-sub {
    font-size: clamp(1rem, 2vw, 1.2rem);
    color: var(--white-dim);
    max-width: 520px;
    line-height: 1.7;
    font-weight: 300;
    margin-bottom: 48px;
    animation: fadeUp 0.7s 0.2s ease both;
  }

  .proofs-hero-cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--gold);
    color: #000;
    font-weight: 600;
    font-size: 15px;
    letter-spacing: 0.5px;
    padding: 16px 36px;
    border-radius: 4px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    animation: fadeUp 0.7s 0.3s ease both;
    box-shadow: 0 0 40px rgba(201,168,76,0.25);
  }

  .proofs-hero-cta:hover {
    background: var(--gold-light);
    transform: translateY(-2px);
    box-shadow: 0 8px 48px rgba(201,168,76,0.4);
  }

  .proofs-hero-cta svg { width: 16px; height: 16px; }

  .proofs-scroll-line {
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    animation: fadeUp 1s 0.8s ease both;
  }

  .proofs-scroll-line span {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--white-dim);
  }

  .proofs-scroll-bar {
    width: 1px;
    height: 48px;
    background: linear-gradient(to bottom, var(--gold), transparent);
    animation: scrollPulse 2s infinite;
  }

  /* ── STATS ── */
  .proofs-stats {
    display: flex;
    justify-content: center;
    gap: 0;
    border-top: 1px solid rgba(201,168,76,0.15);
    border-bottom: 1px solid rgba(201,168,76,0.15);
    background: var(--dark2);
  }

  .proofs-stat {
    flex: 1;
    max-width: 240px;
    text-align: center;
    padding: 40px 20px;
    border-right: 1px solid rgba(201,168,76,0.1);
    transition: background 0.3s;
  }

  .proofs-stat:last-child { border-right: none; }
  .proofs-stat:hover { background: var(--white-faint); }

  .proofs-stat-num {
    font-family: 'Playfair Display', serif;
    font-size: 2.8rem;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 8px;
  }

  .proofs-stat-label {
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--white-dim);
    font-weight: 400;
  }

  /* ── TRUST BADGES ── */
  .proofs-trust {
    padding: 80px 24px;
    max-width: 1100px;
    margin: 0 auto;
  }

  .proofs-section-eyebrow {
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 16px;
    font-weight: 500;
  }

  .proofs-section-heading {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 700;
    margin-bottom: 56px;
    line-height: 1.2;
  }

  .proofs-trust-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 2px;
    background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.15);
  }

  .proofs-trust-card {
    background: var(--dark2);
    padding: 36px 28px;
    transition: background 0.3s;
    position: relative;
    overflow: hidden;
  }

  .proofs-trust-card::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(to right, transparent, var(--gold), transparent);
    transform: scaleX(0);
    transition: transform 0.3s;
  }

  .proofs-trust-card:hover { background: var(--dark3); }
  .proofs-trust-card:hover::after { transform: scaleX(1); }

  .trust-icon {
    font-size: 28px;
    margin-bottom: 16px;
    display: block;
  }

  .trust-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 10px;
    color: var(--white);
  }

  .trust-desc {
    font-size: 13.5px;
    color: var(--white-dim);
    line-height: 1.65;
    font-weight: 300;
  }

  /* ── PROOF DRIVE SECTION ── */
  .proofs-drive-section {
    background: var(--dark2);
    padding: 80px 24px;
    text-align: center;
    border-top: 1px solid rgba(201,168,76,0.12);
    border-bottom: 1px solid rgba(201,168,76,0.12);
    position: relative;
    overflow: hidden;
  }

  .proofs-drive-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .proofs-drive-inner {
    max-width: 640px;
    margin: 0 auto;
    position: relative;
  }

  .proofs-drive-icon {
    font-size: 56px;
    margin-bottom: 24px;
    display: block;
  }

  .proofs-drive-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.6rem, 3.5vw, 2.4rem);
    font-weight: 700;
    margin-bottom: 16px;
  }

  .proofs-drive-desc {
    font-size: 15px;
    color: var(--white-dim);
    line-height: 1.7;
    margin-bottom: 36px;
    font-weight: 300;
  }

  .proofs-drive-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    border: 1px solid var(--gold);
    color: var(--gold);
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 1px;
    padding: 14px 32px;
    border-radius: 3px;
    text-decoration: none;
    transition: all 0.25s;
  }

  .proofs-drive-btn:hover {
    background: var(--gold);
    color: #000;
    box-shadow: 0 4px 32px rgba(201,168,76,0.3);
  }

  /* ── REVIEWS ── */
  .proofs-reviews {
    padding: 80px 24px;
    max-width: 900px;
    margin: 0 auto;
  }

  .proofs-review-card {
    background: var(--dark2);
    border: 1px solid rgba(201,168,76,0.15);
    padding: 48px 48px 40px;
    position: relative;
    margin: 0 12px;
  }

  .proofs-review-card::before {
    content: '"';
    font-family: 'Playfair Display', serif;
    font-size: 120px;
    color: rgba(201,168,76,0.12);
    position: absolute;
    top: -10px;
    left: 24px;
    line-height: 1;
    pointer-events: none;
  }

  .proofs-review-stars {
    color: var(--gold);
    font-size: 18px;
    letter-spacing: 2px;
    margin-bottom: 20px;
  }

  .proofs-review-text {
    font-size: clamp(1rem, 2vw, 1.2rem);
    line-height: 1.75;
    color: var(--white);
    font-weight: 300;
    margin-bottom: 28px;
    font-style: italic;
  }

  .proofs-review-divider {
    width: 40px;
    height: 1px;
    background: var(--gold);
    margin-bottom: 16px;
  }

  .proofs-review-name {
    font-size: 13px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
  }

  /* Slick overrides */
  .proofs-reviews .slick-dots li button:before {
    color: var(--gold) !important;
    opacity: 0.3;
    font-size: 8px;
  }
  .proofs-reviews .slick-dots li.slick-active button:before {
    opacity: 1;
    color: var(--gold) !important;
  }

  /* ── GUARANTEE ── */
  .proofs-guarantee {
    background: linear-gradient(135deg, var(--dark3) 0%, var(--dark2) 100%);
    border: 1px solid rgba(201,168,76,0.2);
    margin: 0 24px 80px;
    max-width: 1100px;
    margin-left: auto;
    margin-right: auto;
    padding: 56px 48px;
    display: flex;
    align-items: center;
    gap: 48px;
    flex-wrap: wrap;
  }

  .guarantee-icon { font-size: 64px; flex-shrink: 0; }

  .guarantee-text { flex: 1; min-width: 240px; }

  .guarantee-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 12px;
    color: var(--gold);
  }

  .guarantee-desc {
    font-size: 15px;
    color: var(--white-dim);
    line-height: 1.7;
    font-weight: 300;
  }

  /* ── CTA ── */
  .proofs-final-cta {
    text-align: center;
    padding: 80px 24px 100px;
    position: relative;
    overflow: hidden;
  }

  .proofs-final-cta::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 50% 60% at 50% 100%, rgba(201,168,76,0.1) 0%, transparent 70%);
    pointer-events: none;
  }

  .proofs-cta-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 900;
    margin-bottom: 16px;
    line-height: 1.15;
  }

  .proofs-cta-sub {
    font-size: 16px;
    color: var(--white-dim);
    margin-bottom: 40px;
    font-weight: 300;
  }

  .proofs-cta-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--gold);
    color: #000;
    font-weight: 600;
    font-size: 15px;
    padding: 16px 36px;
    border-radius: 4px;
    text-decoration: none;
    transition: all 0.2s;
    box-shadow: 0 0 40px rgba(201,168,76,0.2);
  }

  .btn-primary:hover {
    background: var(--gold-light);
    transform: translateY(-2px);
    box-shadow: 0 8px 48px rgba(201,168,76,0.4);
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 1px solid rgba(245,240,232,0.25);
    color: var(--white);
    font-size: 15px;
    padding: 16px 36px;
    border-radius: 4px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes scrollPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .reveal {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }

  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .proofs-stats { flex-wrap: wrap; }
    .proofs-stat { min-width: 50%; border-bottom: 1px solid rgba(201,168,76,0.1); }
    .proofs-review-card { padding: 36px 24px 32px; }
    .proofs-guarantee { padding: 40px 28px; gap: 24px; }
    .guarantee-icon { font-size: 48px; }
  }
`;

const trustCards = [
  {
    icon: "⚡",
    title: "Instant Delivery",
    desc: "Your subscription is activated within minutes of payment. No waiting, no delays — just instant access.",
  },
  {
    icon: "🔐",
    title: "100% Secure",
    desc: "Every transaction is encrypted and protected. Your data and payment are always safe with us.",
  },
  {
    icon: "✅",
    title: "Verified & Working",
    desc: "All plans are tested before delivery. We guarantee full Premium access or we make it right.",
  },
  {
    icon: "🤝",
    title: "50,000+ Traders Served",
    desc: "Our community trusts us. We've been delivering premium tools to serious traders across India.",
  },
  {
    icon: "💬",
    title: "24/7 Support",
    desc: "Got an issue? Our support team responds fast on WhatsApp. You're never left on your own.",
  },
  {
    icon: "🔄",
    title: "Replacement Guarantee",
    desc: "If your plan ever stops working, we replace it immediately at no extra cost. Zero risk.",
  },
];

const reviews = [
  {
    id: 1,
    name: "Arjun S.",
    location: "Mumbai",
    review: "Dexter Luxuries delivers! TradingView Premium at this price is unbelievable. Activated in 5 minutes, works perfectly. Been using for 3 months straight.",
  },
  {
    id: 2,
    name: "Bhavna P.",
    location: "Pune",
    review: "I was skeptical at first but the proofs folder convinced me. Placed the order, got access instantly. Charts are smooth and all indicators work. Highly recommend!",
  },
  {
    id: 3,
    name: "Chris D.",
    location: "Bangalore",
    review: "Seamless from purchase to activation. Dexter Luxuries is my go-to for TradingView Premium. Way better than paying full price on the official site.",
  },
  {
    id: 4,
    name: "Divya R.",
    location: "Delhi",
    review: "Exceptional support team. Had a small issue and they fixed it within 20 minutes. The 12-month plan is incredible value. Won't go anywhere else.",
  },
  {
    id: 5,
    name: "Eshan M.",
    location: "Hyderabad",
    review: "The value is insane. Full TradingView Premium with all features for a fraction of the cost. Already recommended this to my entire trading group.",
  },
];

const stats = [
  { num: "50K+", label: "Traders Served" },
  { num: "₹495", label: "Starting Price" },
  { num: "5 Min", label: "Avg. Delivery" },
  { num: "100%", label: "Success Rate" },
];

const proofsDriveUrl =
  "https://drive.google.com/drive/folders/1EtOpaPTbV4qopeA3LNUciVcGcwdkS8Po?usp=sharing";

const Proofs = () => {
  const revealRefs = useRef([]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRef = (el) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
  };

  return (
    <>
      <style>{style}</style>
      <div className="proofs-root">

        {/* ── HERO ── */}
        <section className="proofs-hero">
          <div className="proofs-hero-badge">
            <span>✦</span> Verified by 50,000+ traders <span>✦</span>
          </div>
          <h1 className="proofs-hero-title">
            Don't Take Our Word.
            <em>See the Proof.</em>
          </h1>
          <p className="proofs-hero-sub">
            Real screenshots. Real traders. Real results. Every claim we make is backed by verifiable evidence — openly shared for you to inspect.
          </p>
          <a href={proofsDriveUrl} target="_blank" rel="noopener noreferrer" className="proofs-hero-cta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/></svg>
            View All Proofs on Drive
          </a>
          <div className="proofs-scroll-line">
            <span>Scroll</span>
            <div className="proofs-scroll-bar" />
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="proofs-stats" ref={addRef}>
          {stats.map((s) => (
            <div className="proofs-stat" key={s.label}>
              <div className="proofs-stat-num">{s.num}</div>
              <div className="proofs-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TRUST CARDS ── */}
        <section className="proofs-trust">
          <div ref={addRef} className="reveal">
            <p className="proofs-section-eyebrow">Why Traders Choose Us</p>
            <h2 className="proofs-section-heading">Built on Trust.<br />Backed by Results.</h2>
          </div>
          <div className="proofs-trust-grid reveal" ref={addRef}>
            {trustCards.map((card) => (
              <div className="proofs-trust-card" key={card.title}>
                <span className="trust-icon">{card.icon}</span>
                <div className="trust-title">{card.title}</div>
                <div className="trust-desc">{card.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DRIVE PROOF SECTION ── */}
        <section className="proofs-drive-section">
          <div className="proofs-drive-inner reveal" ref={addRef}>
            <span className="proofs-drive-icon">📂</span>
            <h2 className="proofs-drive-title">
              Our Proof Folder is Public & Open
            </h2>
            <p className="proofs-drive-desc">
              We have nothing to hide. Browse real screenshots of successful deliveries, activated accounts, and happy customer confirmations — all stored in our public Google Drive. Updated regularly.
            </p>
            <a href={proofsDriveUrl} target="_blank" rel="noopener noreferrer" className="proofs-drive-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/></svg>
              Open Proof Folder
            </a>
          </div>
        </section>

        {/* ── REVIEWS ── */}
        <section className="proofs-reviews">
          <div ref={addRef} className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <p className="proofs-section-eyebrow">Client Testimonials</p>
            <h2 className="proofs-section-heading">What Our Traders Say</h2>
          </div>
          <div className="reveal" ref={addRef}>
            <Slider {...sliderSettings}>
              {reviews.map((r) => (
                <div key={r.id}>
                  <div className="proofs-review-card">
                    <div className="proofs-review-stars">★★★★★</div>
                    <p className="proofs-review-text">{r.review}</p>
                    <div className="proofs-review-divider" />
                    <p className="proofs-review-name">{r.name} — {r.location}</p>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </section>

        {/* ── GUARANTEE ── */}
        <div className="proofs-guarantee reveal" ref={addRef}>
          <div className="guarantee-icon">🛡️</div>
          <div className="guarantee-text">
            <div className="guarantee-title">Our Zero-Risk Guarantee</div>
            <p className="guarantee-desc">
              If your TradingView Premium plan ever stops working during your subscription period, we will replace it immediately at no cost. No questions asked. We stand behind every order we fulfil — your investment is 100% protected.
            </p>
          </div>
        </div>

        {/* ── FINAL CTA ── */}
        <section className="proofs-final-cta">
          <div ref={addRef} className="reveal">
            <h2 className="proofs-cta-title">
              Ready to Trade Like a Pro?
            </h2>
            <p className="proofs-cta-sub">
              Join 50,000+ traders already using TradingView Premium through Dexter Luxuries.
            </p>
            <div className="proofs-cta-buttons">
              <a href="/products" className="btn-primary">
                View Plans from ₹495
              </a>
              <a href={proofsDriveUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                Browse Proofs First
              </a>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default Proofs;