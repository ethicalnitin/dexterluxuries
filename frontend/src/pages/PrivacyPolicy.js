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

  .pp-pol-root {
    background: var(--dark);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  .pp-pol-hero {
    position: relative;
    padding: 140px 24px 72px;
    text-align: center;
    overflow: hidden;
  }

  .pp-pol-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.13) 0%, transparent 65%);
    pointer-events: none;
  }

  .pp-pol-eyebrow {
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
    margin-bottom: 20px;
    animation: fadeUp 0.6s ease both;
  }

  .pp-pol-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.4rem, 5vw, 4rem);
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 20px;
    animation: fadeUp 0.7s 0.1s ease both;
  }

  .pp-pol-title em {
    font-style: italic;
    color: var(--gold);
  }

  .pp-pol-updated {
    font-size: 12px;
    letter-spacing: 1.5px;
    color: rgba(245,240,232,0.35);
    font-weight: 300;
    animation: fadeUp 0.7s 0.2s ease both;
    text-transform: uppercase;
  }

  .pp-pol-body {
    max-width: 820px;
    margin: 0 auto;
    padding: 72px 32px 100px;
  }

  .pp-pol-intro {
    font-size: 16px;
    color: var(--white-dim);
    line-height: 1.85;
    font-weight: 300;
    padding: 32px 36px;
    border-left: 2px solid var(--gold);
    background: var(--dark2);
    margin-bottom: 64px;
  }

  .pp-pol-section {
    margin-bottom: 56px;
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  .pp-pol-section.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .pp-pol-section-num {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
    margin-bottom: 10px;
    display: block;
  }

  .pp-pol-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 20px;
    color: var(--white);
    line-height: 1.25;
  }

  .pp-pol-text {
    font-size: 15px;
    color: var(--white-dim);
    line-height: 1.85;
    font-weight: 300;
    margin-bottom: 16px;
  }

  .pp-pol-text:last-child { margin-bottom: 0; }

  .pp-pol-list {
    list-style: none;
    padding: 0;
    margin: 16px 0 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .pp-pol-list li {
    display: flex;
    gap: 14px;
    font-size: 15px;
    color: var(--white-dim);
    line-height: 1.75;
    font-weight: 300;
  }

  .pp-pol-list li::before {
    content: '✦';
    color: var(--gold);
    font-size: 10px;
    flex-shrink: 0;
    margin-top: 5px;
  }

  .pp-pol-list strong {
    color: var(--white);
    font-weight: 500;
  }

  .pp-pol-divider {
    width: 48px;
    height: 1px;
    background: linear-gradient(to right, var(--gold), transparent);
    margin: 48px 0;
  }

  .pp-pol-contact-box {
    background: var(--dark2);
    border: 1px solid rgba(201,168,76,0.2);
    padding: 36px;
    position: relative;
    overflow: hidden;
  }

  .pp-pol-contact-box::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(to right, var(--gold), transparent);
  }

  .pp-pol-contact-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 12px;
    color: var(--white);
  }

  .pp-pol-contact-text {
    font-size: 15px;
    color: var(--white-dim);
    font-weight: 300;
    line-height: 1.7;
    margin-bottom: 20px;
  }

  .pp-pol-contact-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--gold);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    border: 1px solid rgba(201,168,76,0.3);
    padding: 10px 22px;
    border-radius: 2px;
    transition: all 0.2s;
  }

  .pp-pol-contact-link:hover {
    background: var(--gold);
    color: #000;
    border-color: var(--gold);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 640px) {
    .pp-pol-body { padding: 48px 20px 72px; }
    .pp-pol-intro { padding: 24px 20px; }
    .pp-pol-contact-box { padding: 28px 20px; }
  }
`;

const sections = [
  {
    num: "01",
    title: "Information We Collect",
    body: null,
    list: [
      { label: "Personal Information", desc: "When you create an account, make a purchase, or contact us, we may collect personal details such as your name, email address, and billing information." },
      { label: "Payment Information", desc: "We collect payment details for processing transactions. This data is securely handled by our payment providers and is not stored directly on our servers." },
      { label: "Usage Data", desc: "We may collect non-personal information such as your IP address, browser type, device information, and usage patterns to improve user experience and analyze website traffic." },
    ],
  },
  {
    num: "02",
    title: "How We Use Your Information",
    body: null,
    list: [
      { label: "Order Processing", desc: "To process your orders, provide digital products, and deliver customer support." },
      { label: "Communication", desc: "To communicate with you regarding your orders, updates, or promotional offers (with your consent)." },
      { label: "Personalization", desc: "To improve your experience by personalizing content and product recommendations based on your preferences." },
      { label: "Analytics", desc: "To analyze website traffic, monitor performance, and improve our website's functionality." },
    ],
  },
  {
    num: "03",
    title: "How We Protect Your Information",
    body: [
      "We take appropriate security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. We use secure encryption protocols (SSL) to ensure that your payment details are transmitted safely.",
      "While we take all necessary precautions to protect your data, please understand that no method of transmission over the internet or electronic storage is completely secure. Therefore, we cannot guarantee absolute security.",
    ],
    list: null,
  },
  {
    num: "04",
    title: "Sharing Your Information",
    body: null,
    list: [
      { label: "Service Providers", desc: "We may share your data with third-party service providers (e.g., payment gateways, hosting services) who assist in operating our website and processing transactions. These providers are contractually obligated to maintain confidentiality." },
      { label: "Legal Requirements", desc: "We may disclose your information if required by law or to comply with legal processes, such as a subpoena or court order." },
      { label: "Business Transfers", desc: "In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner. You will be notified in advance of any change in ownership." },
    ],
  },
  {
    num: "05",
    title: "Your Rights",
    body: [
      "You have the right to access, update, or delete your personal information at any time. If you would like to exercise any of these rights or have any concerns about the information we hold about you, please contact us at leader@cybermafia.shop.",
    ],
    list: null,
  },
  {
    num: "06",
    title: "Cookies",
    body: [
      "Our website uses cookies to enhance your browsing experience. Cookies are small files stored on your device that allow us to remember your preferences and improve site functionality. You can control the use of cookies through your browser settings, but disabling cookies may affect certain features of our website.",
    ],
    list: null,
  },
  {
    num: "07",
    title: "Third-Party Links",
    body: [
      "Our website may contain links to third-party websites. These sites have their own privacy policies, and we are not responsible for their practices. We encourage you to review the privacy policies of any external sites before providing any personal information.",
    ],
    list: null,
  },
  {
    num: "08",
    title: "Changes to This Policy",
    body: [
      "We reserve the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page with an updated date. We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.",
    ],
    list: null,
  },
];

const PrivacyPolicy = () => {
  const sectionRefs = useRef([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    sectionRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRef = (el) => { if (el && !sectionRefs.current.includes(el)) sectionRefs.current.push(el); };

  return (
    <>
      <style>{style}</style>
      <div className="pp-pol-root">

        <section className="pp-pol-hero">
          <p className="pp-pol-eyebrow">✦ Legal ✦</p>
          <h1 className="pp-pol-title">Privacy <em>Policy</em></h1>
          <p className="pp-pol-updated">Last Updated — January 2025</p>
        </section>

        <div className="pp-pol-body">
          <div className="pp-pol-intro">
            At Dexter Luxuries, we value your privacy and are committed to protecting the personal information you share with us. This Privacy Policy outlines how we collect, use, store, and safeguard your data when you visit our website or make a purchase from our digital product store.
          </div>

          {sections.map((sec, i) => (
            <div key={sec.num} className="pp-pol-section" ref={addRef}>
              <span className="pp-pol-section-num">Section {sec.num}</span>
              <h2 className="pp-pol-section-title">{sec.title}</h2>
              {sec.body && sec.body.map((p, j) => (
                <p key={j} className="pp-pol-text">{p}</p>
              ))}
              {sec.list && (
                <ul className="pp-pol-list">
                  {sec.list.map(item => (
                    <li key={item.label}>
                      <span><strong>{item.label}:</strong> {item.desc}</span>
                    </li>
                  ))}
                </ul>
              )}
              {i < sections.length - 1 && <div className="pp-pol-divider" />}
            </div>
          ))}

          <div className="pp-pol-contact-box" ref={addRef}>
            <div className="pp-pol-contact-title">Have Questions?</div>
            <p className="pp-pol-contact-text">
              If you have any questions or concerns about our Privacy Policy, or if you would like to exercise your rights regarding your personal information, we're here to help.
            </p>
            <a href="mailto:leader@cybermafia.shop" className="pp-pol-contact-link">
              📧 leader@cybermafia.shop
            </a>
          </div>
        </div>

      </div>
    </>
  );
};

export default PrivacyPolicy;