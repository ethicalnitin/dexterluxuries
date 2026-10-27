import React, { useEffect, useRef, useState } from "react";
import { LuMail, LuSend } from "react-icons/lu";
import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import theme from "../theme/theme";
import { useAuth } from "./AuthContext";
import { maskEmail } from "../utils/email";
import { Alert, Button, Container, Field, Input, Select, Textarea } from "../components/ui";
import AdminOrders from "../components/admin/AdminOrders";
import "./AdminPage.css";

const DEFAULT_MESSAGE = "Thank you for your purchase! Your plan is now active. Use the link below to access your content.";

const FEED_TIMEOUT_MS = 10000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms)),
  ]);
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
  const { authRequest } = useAuth();
  const [customerEmail, setCustomerEmail] = usePersisted("dl_email", "");
  const [productName,   setProductName]   = usePersisted("dl_product", "");
  const [planDuration,  setPlanDuration]  = usePersisted("dl_duration", "");
  const [driveLink,     setDriveLink]     = usePersisted("dl_drive", "");
  const [message,       setMessage]       = usePersisted("dl_message", DEFAULT_MESSAGE);
  const [selectedPlan,  setSelectedPlan]  = useState("");

  const [status,  setStatus]  = useState(null);
  const [sending, setSending] = useState(false);

  const [presets, setPresets] = useState([]);
  const [presetsError, setPresetsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    authRequest("/admin/delivery-presets")
      .then((data) => !cancelled && setPresets(Array.isArray(data.presets) ? data.presets : []))
      .catch((err) => !cancelled && setPresetsError(err.message));
    return () => {
      cancelled = true;
    };
  }, [authRequest]);

  const canSend = customerEmail && productName && planDuration && driveLink;

  const handlePlanSelect = (e) => {
    const value = e.target.value;
    setSelectedPlan(value);
    if (!value) return;
    const plan = presets.find(p => p.label === value);
    if (plan) {
      setPlanDuration(plan.duration);
      setDriveLink(plan.link);
    }
  };

  const deliveryFormRef = useRef(null);
  const fillFromOrder = ({ email, productName: name, planDuration: duration }) => {
    setCustomerEmail(email);
    setProductName(name);
    setPlanDuration(duration);
    setSelectedPlan("");
    setStatus(null);
    deliveryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sendSeq = useRef(0);

  const handleSend = async () => {
    const sendId = ++sendSeq.current;
    setSending(true);
    setStatus(null);
    try {
      await authRequest("/admin/deliveries", {
        method: "POST",
        body: { customerEmail, productName, planDuration, driveLink, message },
        fallbackError: "Send failed. Try again.",
      });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
      setSending(false);
      return;
    }

    const sentTo = customerEmail;
    setStatus({ type: "success", text: `Email sent to ${sentTo}` });
    setCustomerEmail("");
    setDriveLink("");
    setSelectedPlan("");
    setSending(false);

    try {
      await withTimeout(
        addDoc(collection(db, "orders"), {
          maskedEmail:  maskEmail(sentTo),
          productName:  productName,
          planDuration: planDuration,
          createdAt:    serverTimestamp(),
        }),
        FEED_TIMEOUT_MS
      );
    } catch (err) {
      console.error("[Admin] orders feed update failed:", err);
      if (sendSeq.current === sendId) {
        setStatus({ type: "warning", text: `Email sent to ${sentTo}, but the public orders feed couldn't be updated.` });
      }
    }
  };

  return (
    <Container narrow className="admin">
      <AdminOrders onUseForDelivery={fillFromOrder} />

      <div className="admin__card" ref={deliveryFormRef}>
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

          <Field
            label="Quick-fill plan link"
            htmlFor="admin-plan"
            hint={presetsError ? `Couldn't load presets: ${presetsError}` : "Auto-fills plan duration and the Drive link below."}
          >
            <Select id="admin-plan" value={selectedPlan} onChange={handlePlanSelect}>
              <option value="">Choose a plan…</option>
              {presets.map(p => (
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
            <Alert variant={status.type === "error" ? "danger" : status.type}>{status.text}</Alert>
          )}
        </div>
      </div>
    </Container>
  );
}
