import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import { LuMail, LuSend } from "react-icons/lu";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import theme from "../theme/theme";
import { Alert, Button, Container, Field, Input, Select, Textarea } from "../components/ui";
import "./AdminPage.css";

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
    <Container narrow className="admin">
      <div className="admin__card">
        <header className="admin__header">
          <span className="ui-icon-tile">
            <LuMail aria-hidden="true" />
          </span>
          <div>
            <span className="ui-eyebrow">{theme.brand.name}</span>
            <h1 className="admin__title">Order fulfillment</h1>
            <p className="ui-muted ui-small">Send plan access to customer</p>
          </div>
        </header>

        <div className="admin__body">
          <Field label="Customer email" htmlFor="admin-email">
            <Input id="admin-email" type="email" placeholder="customer@example.com"
              value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
          </Field>

          <div className="admin__row">
            <Field label="Product name" htmlFor="admin-product">
              <Input id="admin-product" type="text" placeholder="e.g. Premium Trading Course"
                value={productName} onChange={e => setProductName(e.target.value)} />
            </Field>
            <Field label="Plan duration" htmlFor="admin-duration">
              <Input id="admin-duration" type="text" placeholder="e.g. 3 Months / Lifetime"
                value={planDuration} onChange={e => setPlanDuration(e.target.value)} />
            </Field>
          </div>

          <Field label="Quick-fill plan link" htmlFor="admin-plan" hint="Auto-fills plan duration and the Drive link below.">
            <Select id="admin-plan" value={selectedPlan} onChange={handlePlanSelect}>
              <option value="">Choose a plan…</option>
              {PLAN_LINKS.map(p => (
                <option key={p.label} value={p.label}>{p.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Google Drive link" htmlFor="admin-drive">
            <Input id="admin-drive" type="url" placeholder="https://drive.google.com/..."
              value={driveLink} onChange={e => setDriveLink(e.target.value)} />
          </Field>

          <Field label="Message to customer" htmlFor="admin-message">
            <Textarea id="admin-message" rows={3} value={message}
              onChange={e => setMessage(e.target.value)} />
          </Field>

          <div className="admin__preview">
            <p className="admin__preview-label">Email preview</p>
            <dl className="admin__preview-head">
              <div><dt>To</dt><dd>{customerEmail || "—"}</dd></div>
              <div><dt>Subject</dt><dd>{productName ? `Your ${productName} Plan is Ready — ${theme.brand.name}` : "—"}</dd></div>
            </dl>
            <div className="admin__preview-body">
              <p>{message}</p>
              {productName && (
                <p className="admin__preview-product">{productName} · {planDuration || "—"}</p>
              )}
              {driveLink && <p className="admin__preview-link">Drive link included</p>}
            </div>
          </div>

          <Button variant="primary" size="lg" block onClick={handleSend}
            disabled={!canSend} loading={sending} icon={<LuSend />}>
            {sending ? "Sending…" : "Send to customer"}
          </Button>

          {status && (
            <Alert variant={status.type === "success" ? "success" : "danger"}>{status.text}</Alert>
          )}
        </div>
      </div>
    </Container>
  );
}
