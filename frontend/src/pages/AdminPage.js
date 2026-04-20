import React, { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./AdminPage.css";

const EMAILJS_SERVICE_ID  = "service_sl4riwk";
const EMAILJS_TEMPLATE_ID = "template_9x590cp";
const EMAILJS_PUBLIC_KEY  = "-hEJpslk_NuP-9qRA";

const DEFAULT_MESSAGE = "Thank you for your purchase! Your plan is now active. Use the link below to access your content.";

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

  const [status,  setStatus]  = useState(null);
  const [sending, setSending] = useState(false);

  const canSend = customerEmail && productName && planDuration && driveLink;

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

    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: "Send failed. Check your config." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ap-wrap">
      <div className="ap-card">

        <div className="ap-header">
          <div className="ap-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="#b89a5a" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div>
            <div className="ap-brand">DEXTER LUXURES</div>
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
              <div className="ap-meta-row"><span>Subj</span><span>{productName ? `Your ${productName} Plan is Ready — Dexter Luxures` : "—"}</span></div>
            </div>
            <div className="ap-preview-body">
              <p style={{margin:"0 0 8px",fontSize:"13px"}}>{message}</p>
              {productName && (
                <p style={{margin:"4px 0",fontSize:"12px",color:"#b89a5a",fontWeight:500}}>
                  {productName} · {planDuration || "—"}
                </p>
              )}
              {driveLink && (
                <p style={{margin:"8px 0 0",fontSize:"12px",color:"#534AB7"}}>
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
  );
}