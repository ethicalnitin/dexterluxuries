import React, { useEffect, useRef } from "react";

const style = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@300;400;500;600&display=swap');

:root {
  --bg: #05050A;
  --bg2: #0A0A13;
  --surface: rgba(255,255,255,0.045);
  --border: rgba(255,255,255,0.09);
  --violet: #8B5CF6;
  --violet-soft: #C4B5FD;
  --cyan: #22D3EE;
  --text: #F4F2FF;
  --text-dim: rgba(244,242,255,0.62);
  --grad: linear-gradient(92deg, var(--violet) 0%, var(--cyan) 100%);
}

.refund-root {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
}

.refund-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 120px 24px 80px;
}

.refund-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 700;
  letter-spacing: -1px;
  margin-bottom: 20px;
}

.refund-title span {
  background: var(--grad);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.refund-sub {
  color: var(--text-dim);
  font-size: 15px;
  line-height: 1.8;
  margin-bottom: 40px;
  font-weight: 300;
}

.refund-section {
  margin-top: 50px;
}

.refund-section h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.refund-section p {
  color: var(--text-dim);
  line-height: 1.8;
  font-size: 14.5px;
  font-weight: 300;
}

.refund-list {
  margin-top: 16px;
  padding-left: 18px;
}

.refund-list li {
  margin-bottom: 10px;
  color: var(--text-dim);
  font-weight: 300;
}

.refund-divider {
  width: 50px;
  height: 2px;
  background: var(--grad);
  border-radius: 2px;
  margin: 30px 0;
}

.highlight {
  color: var(--violet-soft);
  font-weight: 500;
}

.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.7s ease;
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
`;

const RefundPolicy = () => {
  const refs = useRef([]);

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

    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRef = (el) => {
    if (el && !refs.current.includes(el)) refs.current.push(el);
  };

  return (
    <>
      <style>{style}</style>
      <div className="refund-root">
        <div className="refund-container">

          <div className="reveal" ref={addRef}>
            <h1 className="refund-title">
              Refund <span>Policy</span>
            </h1>
            <p className="refund-sub">
              At <span className="highlight">ChartVault</span>, we take pride in delivering premium digital products.
              Due to the nature of digital goods, all purchases are considered final.
            </p>
          </div>

          <div className="refund-divider" />

          <div className="refund-section reveal" ref={addRef}>
            <p>
              However, in rare cases where the product does not function as intended or fails to meet the described standards,
              we may offer a refund or replacement under strict conditions.
            </p>
          </div>

          <div className="refund-section reveal" ref={addRef}>
            <h3>Refund Eligibility</h3>
            <p>To qualify for a refund, the following conditions must be met:</p>

            <ul className="refund-list">
              <li>Request must be made within <span className="highlight">7 days</span> of purchase.</li>
              <li>Product must be <span className="highlight">defective or not as described</span>.</li>
              <li>Product must <span className="highlight">not be used or fully consumed</span>.</li>
            </ul>
          </div>

          <div className="refund-section reveal" ref={addRef}>
            <h3>How to Request</h3>
            <p>
              To request a refund, contact us at{" "}
              <span className="highlight">leader@cybermafia.shop</span> with:
            </p>

            <ul className="refund-list">
              <li>Order details</li>
              <li>Reason for request</li>
              <li>Supporting proof (if applicable)</li>
            </ul>

            <p style={{ marginTop: "12px" }}>
              Our team will review your request within <span className="highlight">3–5 business days</span>.
            </p>
          </div>

          <div className="refund-section reveal" ref={addRef}>
            <h3>Non-Refundable Cases</h3>

            <ul className="refund-list">
              <li>Change of mind after purchase</li>
              <li>Failure to meet system requirements</li>
              <li>Misunderstanding of product features</li>
            </ul>

            <p style={{ marginTop: "12px" }}>
              We reserve the right to decline any request that does not meet our policy standards.
            </p>
          </div>

          <div className="refund-section reveal" ref={addRef}>
            <h3>Contact</h3>
            <p>
              For any concerns, reach out at{" "}
              <span className="highlight">leader@cybermafia.shop</span>.
            </p>

            <p style={{ marginTop: "20px" }}>
              Thank you for trusting <span className="highlight">ChartVault</span>.
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default RefundPolicy;