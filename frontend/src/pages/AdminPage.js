import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const EMAILJS_SERVICE_ID  = "service_sl4riwk";
const EMAILJS_TEMPLATE_ID = "template_9x590cp";
const EMAILJS_PUBLIC_KEY  = "-hEJpslk_NuP-9qRA";

const DEFAULT_MESSAGE = "Thank you for your purchase! Your plan is now active. Use the link below to access your content.";

// Preset plan links — selecting one in the dropdown auto-fills both
// the plan duration and the Google Drive link fields below.
const PLAN_LINKS = [
  { label: "3 Months", duration: "3 Months", link: "https://drive.google.com/file/d/1wOtQ2swpw5oyYAJS6GT6ZWxFO0b7AilW/view?usp=drive_link" },
  { label: "6 Months", duration: "6 Months", link: "https://drive.google.com/file/d/1gr5GEANvYMfphthC2jnXrS05pzf88A9b/view?usp=drive_link" },
  { label: "12 Months", duration: "12 Months", link: "https://drive.google.com/file/d/1iQSM-tB-PRXLO__gFshkwTBYDe6dm2TQ/view?usp=drive_link" },
];

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
    --text-dim: rgba(244,242,255,0.6);
    --text-faint: rgba(244,242,255,0.38);
    --grad: linear-gradient(92deg, var(--violet) 0%, var(--cyan) 100%);
    --success: #34D399;
    --error: #F87171;
  }

  *, *::before, *::after { box-sizing: border-box; }

  .ap-wrap {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'Inter', sans-serif;
    color: var(--text);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 60px 20px;
    position: relative;
    overflow: hidden;
  }

  .ap-wrap::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 45% at 15% 0%, rgba(139,92,246,0.14) 0%, transparent 65%),
      radial-gradient(ellipse 40% 35% at 90% 100%, rgba(34,211,238,0.08) 0%, transparent 60%);
    pointer-events: none;
  }

  .ap-card {
    width: 100%;
    max-width: 560px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    backdrop-filter: blur(14px);
    position: relative;
    z-index: 1;
    overflow: hidden;
  }

  .ap-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 28px 30px;
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
  }

  .ap-logo {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: var(--grad);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ap-brand {
    font-size: 10.5px;
    letter-spacing: 2px;
    color: var(--violet-soft);
    font-weight: 600;
    margin-bottom: 2px;
  }

  .ap-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.3px;
    margin-bottom: 2px;
  }

  .ap-sub {
    font-size: 12.5px;
    color: var(--text-dim);
    font-weight: 300;
  }

  .ap-body {
    padding: 28px 30px 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .ap-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .ap-field label {
    font-size: 11.5px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--text-faint);
    font-weight: 600;
  }

  .ap-field input,
  .ap-field select,
  .ap-field textarea {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    width: 100%;
  }

  .ap-field input::placeholder,
  .ap-field textarea::placeholder {
    color: var(--text-faint);
  }

  .ap-field input:focus,
  .ap-field select:focus,
  .ap-field textarea:focus {
    border-color: var(--violet);
    background: var(--surface-hover);
  }

  .ap-field textarea {
    resize: vertical;
    line-height: 1.6;
  }

  .ap-row {
    display: flex;
    gap: 16px;
  }

  .ap-row .ap-field { flex: 1; min-width: 0; }

  /* Quick-fill plan dropdown */
  .ap-plan-select {
    position: relative;
  }

  .ap-plan-select select {
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    padding-right: 36px;
  }

  .ap-plan-select::after {
    content: '';
    position: absolute;
    right: 14px;
    top: 50%;
    width: 8px;
    height: 8px;
    border-right: 1.5px solid var(--text-dim);
    border-bottom: 1.5px solid var(--text-dim);
    transform: translateY(-65%) rotate(45deg);
    pointer-events: none;
  }

  .ap-plan-hint {
    font-size: 11.5px;
    color: var(--text-faint);
    font-weight: 300;
    margin-top: -2px;
  }

  .ap-divider {
    height: 1px;
    background: var(--border);
    margin: 4px 0;
  }

  .ap-preview-label {
    font-size: 11.5px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--text-faint);
    font-weight: 600;
    margin-bottom: -8px;
  }

  .ap-preview {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  .ap-preview-head {
    padding: 14px 18px;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ap-meta-row {
    display: flex;
    gap: 10px;
    font-size: 12px;
  }

  .ap-meta-row span:first-child {
    color: var(--text-faint);
    font-weight: 600;
    width: 32px;
    flex-shrink: 0;
  }

  .ap-meta-row span:last-child {
    color: var(--text-dim);
    word-break: break-word;
  }

  .ap-preview-body {
    padding: 16px 18px;
  }

  .ap-preview-body p {
    color: var(--text-dim);
    line-height: 1.6;
  }

  .ap-send-btn {
    width: 100%;
    background: var(--grad);
    color: #0A0A13;
    border: none;
    border-radius: 10px;
    padding: 15px 20px;
    font-family: 'Inter', sans-serif;
    font-size: 14.5px;
    font-weight: 600;
    letter-spacing: 0.2px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  }

  .ap-send-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 32px rgba(139,92,246,0.35);
  }

  .ap-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ap-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
  }

  .ap-status--success {
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.3);
    color: var(--success);
  }

  .ap-status--error {
    background: rgba(248,113,113,0.1);
    border: 1px solid rgba(248,113,113,0.3);
    color: var(--error);
  }

  @media (max-width: 560px) {
    .ap-row { flex-direction: column; gap: 20px; }
    .ap-header, .ap-body { padding-left: 22px; padding-right: 22px; }
  }
`;

function maskEmail(email) {
  const [user, domain] = email.split("@");
  const masked = user[0] + "***" + (user.length > 3 ? user[user.length - 1] : "");
  return masked + "@" + domain;
}

function usePersisted(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? stored : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setAndPersist = (val) => {
    setValue(val);
    try { localStorage.setItem(key, val); } catch {}
  };

  return [value, setAndPersist];
}

export default function AdminPage() {
  const [customerEmail, setCustomerEmail] = usePersisted("dl_email", "");
  const [productName,   setProductName]   = usePersisted("dl_product", "");
  const [planDuration,  setPlanDuration]  = usePersisted("dl_duration", "");
  const [driveLink,     setDriveLink]     = usePersisted("dl_drive", "");
  const [message,       setMessage]       = usePersisted("dl_message", DEFAULT_MESSAGE);
  const [selectedPlan,  setSelectedPlan]  = useState("");

  const [status,  setStatus]  = useState(null);
  const [sending, setSending] = useState(false);

  const canSend = customerEmail && productName && planDuration && driveLink;

  const handlePlanSelect = (e) => {
    const value = e.target.value;
    setSelectedPlan(value);
    if (!value) return;
    const plan = PLAN_LINKS.find(p => p.label === value);
    if (plan) {
      setPlanDuration(plan.duration);
      setDriveLink(plan.link);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setStatus(null);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email:      customerEmail,
          product_name:  productName,
          plan_duration: planDuration,
          drive_link:    driveLink,
          message:       message,
        },
        EMAILJS_PUBLIC_KEY
      );

      await addDoc(collection(db, "orders"), {
        maskedEmail:  maskEmail(customerEmail),
        productName:  productName,
        planDuration: planDuration,
        createdAt:    serverTimestamp(),
      });

      setStatus({ type: "success", text: `Email sent to ${customerEmail}` });

      // clear only email and drive link after send — keep product/duration/message
      setCustomerEmail("");
      setDriveLink("");
      setSelectedPlan("");

    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: "Send failed. Check your config." });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <style>{style}</style>
      <div className="ap-wrap">
        <div className="ap-card">

          <div className="ap-header">
            <div className="ap-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="#0A0A13" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <div className="ap-brand">DEXTER LUXURIES</div>
              <h1 className="ap-title">Order Fulfillment</h1>
              <p className="ap-sub">Send plan access to customer</p>
            </div>
          </div>

          <div className="ap-body">

            <div className="ap-field">
              <label>Customer email</label>
              <input type="email" placeholder="customer@example.com"
                value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
            </div>

            <div className="ap-row">
              <div className="ap-field">
                <label>Product name</label>
                <input type="text" placeholder="e.g. Premium Trading Course"
                  value={productName} onChange={e => setProductName(e.target.value)} />
              </div>
              <div className="ap-field">
                <label>Plan duration</label>
                <input type="text" placeholder="e.g. 3 Months / Lifetime"
                  value={planDuration} onChange={e => setPlanDuration(e.target.value)} />
              </div>
            </div>

            <div className="ap-field ap-plan-select">
              <label>Quick-fill plan link</label>
              <select value={selectedPlan} onChange={handlePlanSelect}>
                <option value="">Choose a plan…</option>
                {PLAN_LINKS.map(p => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
              <span className="ap-plan-hint">Auto-fills plan duration and the Drive link below.</span>
            </div>

            <div className="ap-field">
              <label>Google Drive link</label>
              <input type="url" placeholder="https://drive.google.com/..."
                value={driveLink} onChange={e => setDriveLink(e.target.value)} />
            </div>

            <div className="ap-field">
              <label>Message to customer</label>
              <textarea rows={3} value={message}
                onChange={e => setMessage(e.target.value)} />
            </div>

            <div className="ap-divider" />
            <p className="ap-preview-label">Email preview</p>
            <div className="ap-preview">
              <div className="ap-preview-head">
                <div className="ap-meta-row"><span>To</span><span>{customerEmail || "—"}</span></div>
                <div className="ap-meta-row"><span>Subj</span><span>{productName ? `Your ${productName} Plan is Ready — Dexter Luxuries` : "—"}</span></div>
              </div>
              <div className="ap-preview-body">
                <p style={{margin:"0 0 8px",fontSize:"13px"}}>{message}</p>
                {productName && (
                  <p style={{margin:"4px 0",fontSize:"12px",color:"#C4B5FD",fontWeight:500}}>
                    {productName} · {planDuration || "—"}
                  </p>
                )}
                {driveLink && (
                  <p style={{margin:"8px 0 0",fontSize:"12px",color:"#22D3EE"}}>
                    Drive link included
                  </p>
                )}
              </div>
            </div>

            <button className="ap-send-btn" onClick={handleSend}
              disabled={!canSend || sending}>
              {sending ? "Sending…" : "Send to customer"}
            </button>

            {status && (
              <div className={`ap-status ap-status--${status.type}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                  {status.type === "success"
                    ? <path d="M20 6L9 17l-5-5"/>
                    : <path d="M18 6L6 18M6 6l12 12"/>}
                </svg>
                {status.text}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}