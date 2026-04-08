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

  .contact-root {
    background: var(--dark);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  .contact-hero {
    position: relative;
    padding: 140px 24px 80px;
    text-align: center;
    overflow: hidden;
  }

  .contact-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.14) 0%, transparent 65%);
    pointer-events: none;
  }

  .contact-eyebrow {
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
    margin-bottom: 20px;
    animation: fadeUp 0.6s ease both;
  }

  .contact-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.8rem, 6vw, 5rem);
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 20px;
    animation: fadeUp 0.7s 0.1s ease both;
  }

  .contact-hero-title em {
    font-style: italic;
    color: var(--gold);
  }

  .contact-hero-sub {
    font-size: clamp(1rem, 2vw, 1.15rem);
    color: var(--white-dim);
    font-weight: 300;
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.7;
    animation: fadeUp 0.7s 0.2s ease both;
  }

  .contact-body {
    max-width: 1000px;
    margin: 0 auto;
    padding: 80px 24px 100px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: start;
  }

  .contact-section-eyebrow {
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
    margin-bottom: 16px;
  }

  .contact-section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    font-weight: 700;
    margin-bottom: 32px;
    line-height: 1.25;
  }

  .contact-channels {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .contact-card {
    background: var(--dark2);
    border: 1px solid rgba(201,168,76,0.12);
    padding: 24px 26px;
    display: flex;
    align-items: center;
    gap: 20px;
    text-decoration: none;
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
  }

  .contact-card::after {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--gold);
    transform: scaleY(0);
    transition: transform 0.25s;
  }

  .contact-card:hover {
    background: var(--dark3);
    border-color: rgba(201,168,76,0.3);
    transform: translateX(4px);
  }

  .contact-card:hover::after { transform: scaleY(1); }

  .contact-card-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
    transition: background 0.2s;
  }

  .contact-card:hover .contact-card-icon {
    background: rgba(201,168,76,0.18);
  }

  .contact-card-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
    margin-bottom: 5px;
  }

  .contact-card-value {
    font-size: 15px;
    color: var(--white);
    font-weight: 400;
  }

  .contact-card-desc {
    font-size: 12px;
    color: var(--white-dim);
    font-weight: 300;
    margin-top: 3px;
  }

  .contact-card-arrow {
    margin-left: auto;
    color: rgba(201,168,76,0.4);
    font-size: 18px;
    flex-shrink: 0;
    transition: color 0.2s, transform 0.2s;
  }

  .contact-card:hover .contact-card-arrow {
    color: var(--gold);
    transform: translateX(3px);
  }

  .contact-info-panel {
    background: var(--dark2);
    border: 1px solid rgba(201,168,76,0.12);
    padding: 40px 36px;
  }

  .contact-info-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 24px;
    color: var(--white);
  }

  .contact-info-body {
    font-size: 14.5px;
    color: var(--white-dim);
    line-height: 1.8;
    font-weight: 300;
    margin-bottom: 32px;
  }

  .contact-response-times {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .contact-response-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(201,168,76,0.08);
    font-size: 13.5px;
  }

  .contact-response-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .contact-response-channel {
    color: var(--white-dim);
    font-weight: 300;
  }

  .contact-response-time {
    color: var(--gold);
    font-weight: 500;
    font-size: 12px;
    letter-spacing: 0.5px;
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

  @media (max-width: 768px) {
    .contact-body {
      grid-template-columns: 1fr;
      gap: 40px;
      padding: 60px 24px 80px;
    }
  }
`;

const channels = [
  {
    icon: "📧",
    label: "Email",
    value: "leader@cybermafia.shop",
    desc: "For orders, billing & general inquiries",
    href: "mailto:leader@cybermafia.shop",
  },
  {
    icon: "💬",
    label: "WhatsApp",
    value: "+91 XXXXX XXXXX",
    desc: "Fastest response — order support & queries",
    href: "https://wa.me/9259317696",
  },
  {
    icon: "✈️",
    label: "Telegram",
    value: "@cybermafia.shop",
    desc: "Join our channel for deals & updates",
    href: "https://t.me/dexterluxuries",
  },
  {
    icon: "📸",
    label: "Instagram",
    value: "@cybermafia.shop",
    desc: "Follow us for proofs & announcements",
    href: "https://www.instagram.com/cybermafia.shop",
  },
];

const responseTimes = [
  { channel: "WhatsApp", time: "< 10 minutes" },
  { channel: "Telegram", time: "< 30 minutes" },
  { channel: "Email", time: "2–4 hours" },
  { channel: "Instagram DM", time: "2–6 hours" },
];

const Contact = () => {
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
      <div className="contact-root">

        <section className="contact-hero">
          <p className="contact-eyebrow">✦ Get in Touch ✦</p>
          <h1 className="contact-hero-title">
            We're Here to <em>Help.</em>
          </h1>
          <p className="contact-hero-sub">
            Reach out through any channel below. We respond fast — usually within minutes on WhatsApp and Telegram.
          </p>
        </section>

        <div className="contact-body">
          <div className="reveal" ref={addRef}>
            <p className="contact-section-eyebrow">Contact Channels</p>
            <h2 className="contact-section-title">Reach Us Anywhere</h2>
            <div className="contact-channels">
              {channels.map(ch => (
                <a key={ch.label} href={ch.href} target={ch.href.startsWith("mailto") ? "_self" : "_blank"} rel="noopener noreferrer" className="contact-card">
                  <div className="contact-card-icon">{ch.icon}</div>
                  <div>
                    <div className="contact-card-label">{ch.label}</div>
                    <div className="contact-card-value">{ch.value}</div>
                    <div className="contact-card-desc">{ch.desc}</div>
                  </div>
                  <span className="contact-card-arrow">→</span>
                </a>
              ))}
            </div>
          </div>

          <div className="reveal" ref={addRef}>
            <div className="contact-info-panel">
              <div className="contact-info-title">Before You Reach Out</div>
              <p className="contact-info-body">
                For the fastest response, message us on <strong style={{color:'#C9A84C'}}>WhatsApp or Telegram</strong>. Include your order details or the product you're interested in so we can help you immediately.
                <br /><br />
                Our support team operates daily and we are committed to resolving every query the same day.
              </p>
              <p style={{fontSize:'11px',letterSpacing:'2px',textTransform:'uppercase',color:'#C9A84C',fontWeight:500,marginBottom:16}}>Response Times</p>
              <div className="contact-response-times">
                {responseTimes.map(r => (
                  <div className="contact-response-item" key={r.channel}>
                    <span className="contact-response-channel">{r.channel}</span>
                    <span className="contact-response-time">{r.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Contact;