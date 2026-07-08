import React, { useEffect, useRef } from "react";

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

  *, *::before, *::after { box-sizing: border-box; }

  .about-root {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .about-hero {
    position: relative;
    padding: 140px 24px 90px;
    text-align: center;
    overflow: hidden;
  }

  .about-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.18) 0%, transparent 65%),
      radial-gradient(ellipse 40% 40% at 80% 10%, rgba(34,211,238,0.1) 0%, transparent 70%);
    pointer-events: none;
  }

  .about-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 7px 16px;
    border-radius: 100px;
    font-size: 12px;
    letter-spacing: 0.4px;
    color: var(--text-dim);
    font-weight: 500;
    margin-bottom: 24px;
    animation: fadeUp 0.6s ease both;
    position: relative;
    z-index: 1;
  }

  .about-hero-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(2.4rem, 5.5vw, 4.4rem);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -1.5px;
    margin-bottom: 22px;
    animation: fadeUp 0.7s 0.1s ease both;
    position: relative;
    z-index: 1;
  }

  .about-hero-title span {
    background: var(--grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .about-hero-sub {
    font-size: clamp(1rem, 2vw, 1.1rem);
    color: var(--text-dim);
    font-weight: 300;
    max-width: 540px;
    margin: 0 auto;
    line-height: 1.7;
    animation: fadeUp 0.7s 0.2s ease both;
    position: relative;
    z-index: 1;
  }

  .about-stats {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
  }

  .about-stat {
    flex: 1;
    min-width: 160px;
    max-width: 220px;
    text-align: center;
    padding: 40px 16px;
    border-right: 1px solid var(--border);
  }

  .about-stat:last-child { border-right: none; }

  .about-stat-num {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.4rem;
    font-weight: 700;
    background: var(--grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    line-height: 1;
    margin-bottom: 8px;
  }

  .about-stat-label {
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-faint);
    font-weight: 500;
  }

  .about-story {
    max-width: 880px;
    margin: 0 auto;
    padding: 90px 32px;
  }

  .about-section-eyebrow {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--violet-soft);
    margin-bottom: 14px;
  }

  .about-section-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(1.8rem, 3.6vw, 2.6rem);
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 40px;
    line-height: 1.2;
  }

  .about-body {
    font-size: 15.5px;
    color: var(--text-dim);
    line-height: 1.85;
    font-weight: 300;
  }

  .about-body p { margin-bottom: 24px; }
  .about-body p:last-child { margin-bottom: 0; }

  .about-body strong {
    color: var(--text);
    font-weight: 600;
  }

  .about-divider {
    width: 48px;
    height: 2px;
    background: var(--grad);
    margin: 48px 0;
    border-radius: 2px;
  }

  .about-values {
    background: var(--bg2);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 90px 24px;
  }

  .about-values-inner {
    max-width: 1100px;
    margin: 0 auto;
  }

  .about-values-header {
    text-align: center;
    margin-bottom: 52px;
  }

  .about-values-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 18px;
  }

  .about-value-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px 26px;
    transition: transform 0.25s, border-color 0.25s, background 0.25s;
    position: relative;
    overflow: hidden;
  }

  .about-value-card:hover {
    transform: translateY(-4px);
    border-color: rgba(139,92,246,0.4);
    background: var(--surface-hover);
  }

  .about-value-icon {
    font-size: 26px;
    margin-bottom: 16px;
    display: block;
  }

  .about-value-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--text);
  }

  .about-value-desc {
    font-size: 13.5px;
    color: var(--text-dim);
    line-height: 1.65;
    font-weight: 300;
  }

  .about-cta {
    margin: 0 24px 90px;
    max-width: 1152px;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
    padding: 70px 40px;
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(139,92,246,0.14), rgba(34,211,238,0.08));
    border: 1px solid var(--border);
    border-radius: 24px;
  }

  .about-cta-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(1.7rem, 3.6vw, 2.4rem);
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 14px;
  }

  .about-cta-sub {
    font-size: 15px;
    color: var(--text-dim);
    margin-bottom: 34px;
    font-weight: 300;
  }

  .about-cta-buttons {
    display: flex;
    gap: 14px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .about-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--grad);
    color: #0A0A13;
    font-weight: 600;
    font-size: 14.5px;
    padding: 14px 32px;
    border-radius: 10px;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .about-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 32px rgba(139,92,246,0.35);
  }

  .about-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
    font-weight: 500;
    font-size: 14.5px;
    padding: 14px 30px;
    border-radius: 10px;
    text-decoration: none;
    transition: background 0.2s, border-color 0.2s;
  }

  .about-btn-secondary:hover {
    background: var(--surface);
    border-color: rgba(255,255,255,0.2);
  }

  .reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }

  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 640px) {
    .about-stat { min-width: 50%; border-bottom: 1px solid var(--border); }
    .about-story { padding: 60px 24px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .about-hero-title, .about-eyebrow, .about-hero-sub { animation: none !important; }
    .reveal { opacity: 1; transform: none; transition: none; }
  }
`;

const stats = [
  { num: "2021", label: "Founded" },
  { num: "50K+", label: "Traders Served" },
  { num: "100%", label: "Success Rate" },
  { num: "24/7", label: "Support" },
];

const values = [
  { icon: "🏆", title: "Quality First", desc: "Every product is tested and verified before delivery. We never compromise on what we offer to our community." },
  { icon: "⚡", title: "Instant Delivery", desc: "Your subscription activates within minutes. No waiting, no delays — we respect your time." },
  { icon: "🤝", title: "Built on Trust", desc: "50,000+ traders have placed their confidence in us. That trust is our most valuable asset." },
  { icon: "🔄", title: "Always Supported", desc: "If anything stops working, we replace it immediately. Our commitment doesn't end at purchase." },
];

const About = () => {
  const revealRefs = useRef([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    revealRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRef = (el) => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  return (
    <>
      <style>{style}</style>
      <div className="about-root">

        <section className="about-hero">
          <span className="about-eyebrow">✦ Our Story ✦</span>
          <h1 className="about-hero-title">
            Premium Products.<br /><span>Honest Prices.</span>
          </h1>
          <p className="about-hero-sub">
            Since 2021, Dexter Luxuries has been India's most trusted destination for premium digital subscriptions and tools.
          </p>
        </section>

        <div className="about-stats" ref={addRef}>
          {stats.map(s => (
            <div className="about-stat" key={s.label}>
              <div className="about-stat-num">{s.num}</div>
              <div className="about-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="about-story">
          <div className="reveal" ref={addRef}>
            <p className="about-section-eyebrow">Who We Are</p>
            <h2 className="about-section-title">Dexter Luxuries</h2>
            <div className="about-body">
              <p>
                Welcome to <strong>Dexter Luxuries</strong> — a leading digital product store established in 2021. Over the years, we have built a loyal community of over <strong>50,000 traders and digital enthusiasts</strong> who trust us for high-quality products that enhance their lifestyle and trading edge.
              </p>
              <p>
                Our mission is simple: deliver <strong>premium digital tools at prices that are accessible to everyone</strong>. Whether you're a seasoned trader seeking TradingView Premium or a tech enthusiast looking for the best digital subscriptions, we have you covered — instantly.
              </p>
              <div className="about-divider" />
              <p>
                At Dexter Luxuries, we understand that in the fast-moving world of digital products, <strong>quality and reliability are non-negotiable</strong>. That's why we carefully vet every product we offer and stand behind every single order with our replacement guarantee.
              </p>
              <p>
                Our community is the heart of our success. We're proud to have helped thousands of individuals elevate their digital experience — and we're just getting started. As we grow, our commitment to <strong>personalized service, swift support, and honest pricing</strong> will never waver.
              </p>
            </div>
          </div>
        </div>

        <section className="about-values">
          <div className="about-values-inner">
            <div className="about-values-header reveal" ref={addRef}>
              <p className="about-section-eyebrow">What We Stand For</p>
              <h2 className="about-section-title">Our Core Values</h2>
            </div>
            <div className="about-values-grid reveal" ref={addRef}>
              {values.map(v => (
                <div className="about-value-card" key={v.title}>
                  <span className="about-value-icon">{v.icon}</span>
                  <div className="about-value-title">{v.title}</div>
                  <p className="about-value-desc">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="about-cta reveal" ref={addRef}>
          <h2 className="about-cta-title">Ready to Get Started?</h2>
          <p className="about-cta-sub">Join 50,000+ satisfied customers and experience Dexter Luxuries today.</p>
          <div className="about-cta-buttons">
            <a href="/products" className="about-btn-primary">Browse Products →</a>
            <a href="/contact" className="about-btn-secondary">Get in Touch</a>
          </div>
        </section>

      </div>
    </>
  );
};

export default About;