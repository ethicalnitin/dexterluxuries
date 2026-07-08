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
    --grad: linear-gradient(92deg, var(--violet) 0%, var(--cyan) 100%);
  }

  .contact-root {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
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
    background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.16) 0%, transparent 65%);
    pointer-events: none;
  }

  .contact-eyebrow {
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
    margin-bottom: 22px;
    animation: fadeUp 0.6s ease both;
    position: relative;
    z-index: 1;
  }

  .contact-hero-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(2.8rem, 6vw, 5rem);
    font-weight: 700;
    letter-spacing: -1.5px;
    line-height: 1.1;
    margin-bottom: 20px;
    animation: fadeUp 0.7s 0.1s ease both;
    position: relative;
    z-index: 1;
  }

  .contact-hero-title em {
    font-style: normal;
    background: var(--grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .contact-hero-sub {
    font-size: clamp(1rem, 2vw, 1.15rem);
    color: var(--text-dim);
    font-weight: 300;
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.7;
    animation: fadeUp 0.7s 0.2s ease both;
    position: relative;
    z-index: 1;
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
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--violet-soft);
    margin-bottom: 14px;
  }

  .contact-section-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 32px;
    line-height: 1.25;
  }

  .contact-channels {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .contact-card {
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 22px 24px;
    display: flex;
    align-items: center;
    gap: 18px;
    text-decoration: none;
    transition: transform 0.2s, border-color 0.2s, background 0.2s;
    border-radius: 14px;
  }

  .contact-card:hover {
    background: var(--surface-hover);
    border-color: rgba(139,92,246,0.4);
    transform: translateX(4px);
  }

  .contact-card-icon {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--grad);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    flex-shrink: 0;
  }

  .contact-card-label {
    font-size: 10.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--violet-soft);
    font-weight: 600;
    margin-bottom: 5px;
  }

  .contact-card-value {
    font-size: 15px;
    color: var(--text);
    font-weight: 500;
  }

  .contact-card-desc {
    font-size: 12px;
    color: var(--text-dim);
    font-weight: 300;
    margin-top: 3px;
  }

  .contact-card-arrow {
    margin-left: auto;
    color: var(--text-dim);
    font-size: 18px;
    flex-shrink: 0;
    transition: color 0.2s, transform 0.2s;
  }

  .contact-card:hover .contact-card-arrow {
    color: var(--violet-soft);
    transform: translateX(3px);
  }

  .contact-info-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 40px 36px;
  }

  .contact-info-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    margin-bottom: 24px;
    color: var(--text);
  }

  .contact-info-body {
    font-size: 14.5px;
    color: var(--text-dim);
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
    border-bottom: 1px solid var(--border);
    font-size: 13.5px;
  }

  .contact-response-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .contact-response-channel {
    color: var(--text-dim);
    font-weight: 300;
  }

  .contact-response-time {
    color: var(--violet-soft);
    font-weight: 600;
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
          <span className="contact-eyebrow">✦ Get in Touch ✦</span>
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
                For the fastest response, message us on <strong style={{color:'#C4B5FD'}}>WhatsApp or Telegram</strong>. Include your order details or the product you're interested in so we can help you immediately.
                <br /><br />
                Our support team operates daily and we are committed to resolving every query the same day.
              </p>
              <p style={{fontSize:'11px',letterSpacing:'2px',textTransform:'uppercase',color:'#C4B5FD',fontWeight:600,marginBottom:16}}>Response Times</p>
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