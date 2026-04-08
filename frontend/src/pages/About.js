import React, { useEffect, useRef } from "react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --gold: #C9A84C;
    --gold-light: #E8C97A;
    --dark: #0A0A0A;
    --dark2: #111111;
    --dark3: #1A1A1A;
    --white: #F5F0E8;
    --white-dim: rgba(245,240,232,0.6);
    --white-faint: rgba(245,240,232,0.08);
  }

  .about-root {
    background: var(--dark);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
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
      radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.14) 0%, transparent 65%);
    pointer-events: none;
  }

  .about-eyebrow {
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
    margin-bottom: 20px;
    animation: fadeUp 0.6s ease both;
  }

  .about-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.8rem, 6vw, 5rem);
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 24px;
    animation: fadeUp 0.7s 0.1s ease both;
  }

  .about-hero-title em {
    font-style: italic;
    color: var(--gold);
  }

  .about-hero-sub {
    font-size: clamp(1rem, 2vw, 1.15rem);
    color: var(--white-dim);
    font-weight: 300;
    max-width: 540px;
    margin: 0 auto;
    line-height: 1.7;
    animation: fadeUp 0.7s 0.2s ease both;
  }

  .about-stats {
    display: flex;
    justify-content: center;
    border-top: 1px solid rgba(201,168,76,0.15);
    border-bottom: 1px solid rgba(201,168,76,0.15);
    background: var(--dark2);
  }

  .about-stat {
    flex: 1;
    max-width: 220px;
    text-align: center;
    padding: 40px 16px;
    border-right: 1px solid rgba(201,168,76,0.1);
  }

  .about-stat:last-child { border-right: none; }

  .about-stat-num {
    font-family: 'Playfair Display', serif;
    font-size: 2.6rem;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 8px;
  }

  .about-stat-label {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--white-dim);
    font-weight: 400;
  }

  .about-story {
    max-width: 880px;
    margin: 0 auto;
    padding: 90px 32px;
  }

  .about-section-eyebrow {
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
    margin-bottom: 16px;
  }

  .about-section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 3.5vw, 2.8rem);
    font-weight: 700;
    margin-bottom: 40px;
    line-height: 1.2;
  }

  .about-body {
    font-size: 15.5px;
    color: var(--white-dim);
    line-height: 1.85;
    font-weight: 300;
  }

  .about-body p { margin-bottom: 24px; }
  .about-body p:last-child { margin-bottom: 0; }

  .about-body strong {
    color: var(--white);
    font-weight: 500;
  }

  .about-divider {
    width: 48px;
    height: 2px;
    background: linear-gradient(to right, var(--gold), transparent);
    margin: 48px 0;
  }

  .about-values {
    background: var(--dark2);
    border-top: 1px solid rgba(201,168,76,0.12);
    border-bottom: 1px solid rgba(201,168,76,0.12);
    padding: 80px 24px;
  }

  .about-values-inner {
    max-width: 1100px;
    margin: 0 auto;
  }

  .about-values-header {
    text-align: center;
    margin-bottom: 56px;
  }

  .about-values-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 2px;
    background: rgba(201,168,76,0.08);
    border: 1px solid rgba(201,168,76,0.12);
  }

  .about-value-card {
    background: var(--dark2);
    padding: 36px 28px;
    transition: background 0.3s;
    position: relative;
    overflow: hidden;
  }

  .about-value-card::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(to right, transparent, var(--gold), transparent);
    transform: scaleX(0);
    transition: transform 0.3s;
  }

  .about-value-card:hover { background: var(--dark3); }
  .about-value-card:hover::after { transform: scaleX(1); }

  .about-value-icon {
    font-size: 28px;
    margin-bottom: 16px;
    display: block;
  }

  .about-value-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 10px;
    color: var(--white);
  }

  .about-value-desc {
    font-size: 13.5px;
    color: var(--white-dim);
    line-height: 1.65;
    font-weight: 300;
  }

  .about-cta {
    text-align: center;
    padding: 90px 24px 100px;
    position: relative;
    overflow: hidden;
  }

  .about-cta::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 50% 60% at 50% 100%, rgba(201,168,76,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .about-cta-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 700;
    margin-bottom: 16px;
  }

  .about-cta-sub {
    font-size: 15px;
    color: var(--white-dim);
    margin-bottom: 40px;
    font-weight: 300;
  }

  .about-cta-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .about-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--gold);
    color: #000;
    font-weight: 600;
    font-size: 14px;
    padding: 15px 36px;
    border-radius: 3px;
    text-decoration: none;
    transition: all 0.2s;
    box-shadow: 0 0 32px rgba(201,168,76,0.2);
  }

  .about-btn-primary:hover {
    background: var(--gold-light);
    transform: translateY(-2px);
    box-shadow: 0 8px 40px rgba(201,168,76,0.35);
  }

  .about-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 1px solid rgba(245,240,232,0.2);
    color: var(--white);
    font-size: 14px;
    padding: 15px 36px;
    border-radius: 3px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .about-btn-secondary:hover {
    border-color: var(--gold);
    color: var(--gold);
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
    .about-stats { flex-wrap: wrap; }
    .about-stat { min-width: 50%; border-bottom: 1px solid rgba(201,168,76,0.08); }
    .about-story { padding: 60px 24px; }
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
          <p className="about-eyebrow">✦ Our Story ✦</p>
          <h1 className="about-hero-title">
            Premium Products.<br /><em>Honest Prices.</em>
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

        <section className="about-cta">
          <div className="reveal" ref={addRef}>
            <h2 className="about-cta-title">Ready to Get Started?</h2>
            <p className="about-cta-sub">Join 50,000+ satisfied customers and experience Dexter Luxuries today.</p>
            <div className="about-cta-buttons">
              <a href="/products" className="about-btn-primary">Browse Products →</a>
              <a href="/contact" className="about-btn-secondary">Get in Touch</a>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default About;