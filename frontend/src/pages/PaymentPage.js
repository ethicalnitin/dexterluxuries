import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FiRefreshCw, FiUpload, FiCheckCircle, FiCopy, FiSend, FiAlertCircle } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://dexterluxuries-backend-6ptn.onrender.com/api";

// ── Method metadata ───────────────────────────────────────────────────────────
const METHOD_META = {
  gpay:    { icon: "https://mahesh247.win/images/icon/gpay.png",    color: "#4285F4", label: "GPay" },
  phonepe: { icon: "https://mahesh247.win/images/icon/phonepe.png", color: "#5f259f", label: "PhonePe" },
  paytm:   { icon: "https://mahesh247.win/images/icon/paytm.png",   color: "#00BAF2", label: "Paytm" },
  upi:     { icon: null,                                             color: "#C9A84C", label: "UPI" },
};

// ── Countdown timer hook ──────────────────────────────────────────────────────
function useCountdown(targetMs) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!targetMs) return;
    const tick = () => setRemaining(Math.max(0, targetMs - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return { mins, secs, remaining };
}

// ── QR Refresh Timer ──────────────────────────────────────────────────────────
function QRTimer({ nextRefreshAt }) {
  const totalMs = 20 * 60 * 1000;
  const { mins, secs, remaining } = useCountdown(nextRefreshAt);
  const pct = nextRefreshAt ? Math.max(0, (remaining / totalMs) * 100) : 0;
  const urgent = pct < 15;
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <FiRefreshCw size={10} className={urgent ? "text-orange-400 animate-spin" : "text-amber-400"} />
          QR auto-refreshes in
        </span>
        <span className={`text-xs font-mono font-bold tabular-nums ${urgent ? "text-orange-400" : "text-amber-400"}`}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
      </div>
      <div className="w-full h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-orange-400" : "bg-amber-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} style={{ marginLeft: 6, color: "#C9A84C", background: "none", border: "none", cursor: "pointer" }}
      title={`Copy ${label}`}>
      {copied ? "✓" : <FiCopy size={12} />}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PaymentPage() {

  // ── Read URL params INSIDE the component so React has fully mounted ─────
  // Using a lazy initialiser + useMemo so this only runs once and is stable.
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const rawAmt  = params.get("amount")      || "";
    const rawId   = params.get("productId")   || "";
    const rawName = params.get("productName") || "";
    let productName = "";
    try {
      // Handle both single and double encoding
      productName = decodeURIComponent(rawName.replace(/\+/g, " "));
    } catch {
      productName = rawName;
    }
    return { amount: rawAmt, productId: rawId, productName };
  }, []);

  const [qrData, setQrData]                 = useState(null);
  const [qrLoading, setQrLoading]           = useState(true);
  const [qrError, setQrError]               = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const [utr, setUtr]           = useState("");
  const [email, setEmail]       = useState("");
  // ★ Key fix: lazy initialiser reads directly from URLSearchParams
  //   so the value is NEVER empty even before urlParams memo is used elsewhere
  const [amount, setAmount]     = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("amount") || "";
  });
  const [screenshot, setScreenshot]             = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submitting, setSubmitting]             = useState(false);
  const [submitted, setSubmitted]               = useState(false);

  const fileInputRef = useRef(null);
  const pollRef      = useRef(null);

  // ── Fetch QR ─────────────────────────────────────────────────────────────
  const fetchQR = useCallback(async () => {
    try {
      setQrError(null);
      const res  = await fetch(`${API_BASE}/qr`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.loading) { setTimeout(fetchQR, 5000); return; }
      setQrData(data);
      setQrLoading(false);
      if (data.methods?.length > 0 && !selectedMethod) setSelectedMethod(data.methods[0].method);
    } catch (err) {
      setQrError(err.message);
      setQrLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchQR();
    pollRef.current = setInterval(fetchQR, 30000);
    return () => clearInterval(pollRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeMethod =
    qrData?.methods?.find((m) => m.method === selectedMethod) ??
    qrData?.methods?.[0] ?? null;

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large — max 10MB"); return; }
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (utr.trim().length < 6)       { toast.error("UTR must be at least 6 digits"); return; }
    if (!email.trim().includes("@")) { toast.error("Please enter a valid email"); return; }
    if (!screenshot)                 { toast.error("Please upload your payment screenshot"); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("utr",         utr.trim());
      fd.append("email",       email.trim());
      fd.append("amount",      amount || "");
      fd.append("method",      selectedMethod || "");
      fd.append("productId",   urlParams.productId);
      fd.append("productName", urlParams.productName);
      fd.append("screenshot",  screenshot);
      const res  = await fetch(`${API_BASE}/deposit`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
      toast.success("Submitted! Your order will be delivered shortly.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    const p = new URLSearchParams(window.location.search);
    setUtr(""); setEmail(""); setAmount(p.get("amount") || "");
    setScreenshot(null); setScreenshotPreview(null); setSubmitted(false);
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

    :root {
      --gold: #C9A84C;
      --gold-light: #E8C97A;
      --dark: #0A0A0A;
      --dark2: #111111;
      --dark3: #1A1A1A;
      --ivory: #F5F0E8;
      --ivory-dim: rgba(245,240,232,0.55);
    }
    * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
    .dl-display { font-family: 'Playfair Display', serif !important; }

    @keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes popIn   { from { opacity:0; transform:scale(0.55); }     to { opacity:1; transform:scale(1); } }
    @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
    @keyframes goldPulse { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0);} 50%{box-shadow:0 0 0 6px rgba(201,168,76,0.08);} }
    @keyframes spin    { to { transform:rotate(360deg); } }

    .dl-fade-up  { animation: fadeUp 0.45s ease forwards; }
    .dl-shimmer  { background:linear-gradient(90deg,#1a1a1a 25%,#252525 50%,#1a1a1a 75%); background-size:200% auto; animation:shimmer 1.5s infinite linear; }

    .dl-tab-on  { background:rgba(201,168,76,0.1)!important; border-color:var(--gold)!important; color:var(--gold)!important; }
    .dl-tab-off { background:var(--dark2)!important; border-color:#1e1e1e!important; color:#4a4a4a!important; }
    .dl-tab-off:hover { border-color:rgba(201,168,76,0.3)!important; color:var(--ivory-dim)!important; }

    .dl-input { width:100%; background:var(--dark2); border:1px solid #1e1e1e; border-radius:4px; padding:14px 16px; color:var(--ivory); font-size:14px; transition:border-color .2s,box-shadow .2s; }
    .dl-input::placeholder { color:#333; }
    .dl-input:focus { outline:none; border-color:var(--gold)!important; box-shadow:0 0 0 1px rgba(201,168,76,0.12); }

    .dl-upload { border:1.5px dashed #222; border-radius:4px; cursor:pointer; transition:border-color .2s,background .2s; width:100%; }
    .dl-upload:hover { border-color:rgba(201,168,76,0.4); background:rgba(201,168,76,0.02); }

    .dl-btn { background:var(--gold); color:#000; font-weight:700; border:none; cursor:pointer; letter-spacing:.3px; display:flex; align-items:center; justify-content:center; gap:8px; transition:background .2s,transform .15s,box-shadow .2s; box-shadow:0 4px 32px rgba(201,168,76,0.2); }
    .dl-btn:hover:not(:disabled) { background:var(--gold-light); transform:translateY(-1px); box-shadow:0 8px 40px rgba(201,168,76,0.35); }
    .dl-btn:active:not(:disabled) { transform:translateY(0); }
    .dl-btn:disabled { opacity:.4; cursor:not-allowed; }

    .dl-banner { background:rgba(201,168,76,0.06); border:1px solid rgba(201,168,76,0.18); border-left:3px solid var(--gold); border-radius:4px; padding:12px 16px; margin-bottom:20px; animation:goldPulse 3s ease-in-out infinite; }
    .dl-lbl { font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--ivory-dim); font-weight:500; display:block; margin-bottom:8px; }
  `;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <style>{css}</style>
      <ToastContainer position="top-right" theme="dark" autoClose={3500} />

      <div className="dl-fade-up" style={{ width: "100%", maxWidth: 420 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {/* Diamond logo mark */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div style={{
              width: 42, height: 42, background: "var(--gold)",
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
            }} />
          </div>

          <h1 className="dl-display" style={{
            fontSize: "2.1rem", fontWeight: 900, lineHeight: 1.1,
            color: "var(--ivory)", letterSpacing: "-0.5px", margin: 0,
          }}>
            DEXTER <span style={{ color: "var(--gold)" }}>LUXURIES</span>
          </h1>

          <p style={{
            fontSize: 9, letterSpacing: "3.5px", textTransform: "uppercase",
            color: "var(--ivory-dim)", marginTop: 6, fontWeight: 400,
          }}>Secure Payment Portal</p>

          {/* Ornamental divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, justifyContent: "center" }}>
            <div style={{ width: 60, height: 1, background: "linear-gradient(to right,transparent,rgba(201,168,76,0.4))" }} />
            <div style={{ width: 5, height: 5, background: "var(--gold)", transform: "rotate(45deg)" }} />
            <div style={{ width: 60, height: 1, background: "linear-gradient(to left,transparent,rgba(201,168,76,0.4))" }} />
          </div>
        </div>

        {/* ── Card ── */}
        <div style={{
          background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 8,
          overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(201,168,76,0.04)",
        }}>

          {submitted ? (
            /* ── Success ── */
            <div className="dl-fade-up" style={{ padding: 32, textAlign: "center", display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(201,168,76,0.12)", border: "2px solid var(--gold)",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
                animation: "popIn .45s cubic-bezier(.175,.885,.32,1.275) forwards",
              }}>
                <FiCheckCircle size={28} style={{ color: "var(--gold)" }} />
              </div>

              <div>
                <p className="dl-display" style={{ color: "var(--ivory)", fontSize: "1.4rem", fontWeight: 700 }}>Order Confirmed!</p>
                <p style={{ color: "var(--ivory-dim)", fontSize: 13, marginTop: 8, lineHeight: 1.7, fontWeight: 300 }}>
                  Your payment is under review. We'll deliver your product within 15–30 minutes.
                </p>
              </div>

              <div style={{ background: "var(--dark2)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 4, padding: 20, textAlign: "left" }}>
                <div style={{ height: 1, background: "linear-gradient(to right,var(--gold),transparent)", marginBottom: 16 }} />
                {[
                  urlParams.productName ? ["Product", urlParams.productName] : null,
                  ["Email",  email],
                  ["UTR",    utr, true],
                  ["Amount", amount ? `₹${Number(amount).toLocaleString()}` : "—"],
                  ["Method", (METHOD_META[selectedMethod] || {}).label || selectedMethod || "—"],
                  ["Status", "Pending Review"],
                ].filter(Boolean).map(([k, v, mono]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                    <span style={{ color: "var(--ivory-dim)", fontWeight: 300 }}>{k}</span>
                    <span style={{ color: k === "Status" ? "var(--gold)" : "var(--ivory)", fontFamily: mono ? "monospace" : "inherit", fontWeight: k === "Status" ? 600 : 400, fontSize: 12 }}>{v}</span>
                  </div>
                ))}
              </div>

              <button onClick={reset} className="dl-btn" style={{ width: "100%", padding: "15px 24px", borderRadius: 4, fontSize: 14 }}>
                Make Another Payment
              </button>
            </div>
          ) : (
            <>
              {/* ── QR Section ── */}
              <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid #181818" }}>

                {/* Product banner */}
                {(urlParams.productName || urlParams.amount) && (
                  <div className="dl-banner">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        {urlParams.productName && (
                          <p style={{ fontSize: 13, color: "var(--ivory)", fontWeight: 500, marginBottom: 2 }}>{urlParams.productName}</p>
                        )}
                        <p style={{ fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--ivory-dim)", fontWeight: 300 }}>Digital Product</p>
                      </div>
                      {urlParams.amount && (
                        <span className="dl-display" style={{ color: "var(--gold)", fontSize: "1.5rem", fontWeight: 700 }}>
                          ₹{Number(urlParams.amount).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Method tabs */}
                {qrLoading ? (
                  <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                    {[80, 96, 72].map((w) => <div key={w} className="dl-shimmer" style={{ height: 32, borderRadius: 4, width: w }} />)}
                  </div>
                ) : qrError ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f97316", fontSize: 12, marginBottom: 20, background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 4, padding: "10px 12px" }}>
                    <FiAlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{qrError}</span>
                    <button onClick={fetchQR} style={{ marginLeft: "auto", fontSize: 11, color: "var(--gold)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>Retry</button>
                  </div>
                ) : qrData?.methods?.length > 1 ? (
                  <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
                    {qrData.methods.map((m) => {
                      const meta = METHOD_META[m.method] || { label: m.label };
                      const active = selectedMethod === m.method;
                      return (
                        <button key={m.method} onClick={() => setSelectedMethod(m.method)}
                          className={active ? "dl-tab-on" : "dl-tab-off"}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 4, border: "1px solid", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer", transition: "all .2s", letterSpacing: ".5px", textTransform: "uppercase" }}>
                          {meta.icon && <img src={meta.icon} alt={meta.label} style={{ width: 14, height: 14, objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />}
                          {meta.label || m.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {/* QR image */}
                {qrLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "16px 0" }}>
                    <div className="dl-shimmer" style={{ width: 160, height: 160, borderRadius: 4 }} />
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div className="dl-shimmer" style={{ height: 14, borderRadius: 4, width: "70%" }} />
                      <div className="dl-shimmer" style={{ height: 14, borderRadius: 4, width: "50%" }} />
                    </div>
                  </div>
                ) : activeMethod ? (
                  <div>
                    {activeMethod.qrBase64 ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ background: "#fff", padding: 12, borderRadius: 4, border: "1px solid rgba(201,168,76,0.2)", boxShadow: "0 0 32px rgba(201,168,76,0.06)" }}>
                          <img src={activeMethod.qrBase64} alt="Payment QR" style={{ width: 160, height: 160, objectFit: "contain", display: "block" }} />
                        </div>
                        <p style={{ fontSize: 11, color: "var(--ivory-dim)", marginTop: 8, letterSpacing: ".5px" }}>Scan with any UPI app</p>
                      </div>
                    ) : (
                      <div style={{ padding: "32px 0", textAlign: "center" }}>
                        <p style={{ color: "var(--ivory-dim)", fontSize: 13 }}>QR not available for this method</p>
                        <p style={{ color: "#333", fontSize: 12, marginTop: 4 }}>Try another payment method</p>
                      </div>
                    )}

                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #181818", display: "flex", flexDirection: "column", gap: 10 }}>
                      {activeMethod.name && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "var(--ivory-dim)", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase" }}>Name</span>
                          <span style={{ color: "var(--ivory)", fontSize: 12, fontWeight: 500 }}>{activeMethod.name}</span>
                        </div>
                      )}
                      {activeMethod.upiId && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "var(--ivory-dim)", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase" }}>UPI ID</span>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ color: "var(--ivory)", fontFamily: "monospace", fontSize: 12 }}>{activeMethod.upiId}</span>
                            <CopyBtn text={activeMethod.upiId} label="UPI ID" />
                          </div>
                        </div>
                      )}
                      {(activeMethod.minAmount || activeMethod.maxAmount) && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "var(--ivory-dim)", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase" }}>Limit</span>
                          <span style={{ color: "#555", fontSize: 12 }}>₹{activeMethod.minAmount?.toLocaleString()} – ₹{activeMethod.maxAmount?.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {qrData?.nextRefreshAt && <QRTimer nextRefreshAt={qrData.nextRefreshAt} />}
                  </div>
                ) : (
                  <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ivory-dim)", fontSize: 13 }}>No payment methods available</div>
                )}
              </div>

              {/* ── Form ── */}
              <div style={{ padding: 24 }}>
                <p style={{ color: "var(--ivory-dim)", fontSize: 11, textAlign: "center", marginBottom: 20, letterSpacing: ".3px", fontWeight: 300 }}>
                  After completing the payment above, fill in your details
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Amount — pre-filled & locked from URL */}
                  <div>
                    <label className="dl-lbl">Amount Paid (₹)</label>
                    <div style={{ display: "flex", alignItems: "center", background: "var(--dark2)", border: "1px solid #1e1e1e", borderRadius: 4, overflow: "hidden" }}>
                      <span style={{ padding: "14px", color: "var(--gold)", fontWeight: 700, borderRight: "1px solid #1e1e1e", background: "rgba(201,168,76,0.05)", fontSize: 15, lineHeight: 1, flexShrink: 0 }}>₹</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 1000"
                        value={amount}
                        onChange={(e) => { if (!urlParams.amount) setAmount(e.target.value); }}
                        readOnly={!!urlParams.amount}
                        style={{
                          flex: 1, background: "transparent", border: "none",
                          color: "var(--ivory)", fontSize: 15, padding: "14px",
                          outline: "none", fontWeight: urlParams.amount ? 600 : 400,
                          cursor: urlParams.amount ? "default" : "text",
                        }}
                      />
                      {urlParams.amount && (
                        <span style={{ padding: "0 12px", fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--gold)", opacity: 0.8, flexShrink: 0 }}>FIXED</span>
                      )}
                    </div>
                    {urlParams.amount && (
                      <p style={{ fontSize: 10, color: "#555", marginTop: 5 }}>Amount is fixed based on the product you selected</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="dl-lbl">Your Email <span style={{ color: "#e04" }}>*</span></label>
                    <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="dl-input" />
                  </div>

                  {/* UTR */}
                  <div>
                    <label className="dl-lbl">UTR / Transaction ID <span style={{ color: "#e04" }}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text" inputMode="numeric" placeholder="6–12 digit reference number"
                        value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        required className="dl-input" style={{ fontFamily: "monospace", paddingRight: 44 }}
                      />
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#333", fontFamily: "monospace" }}>{utr.length}/12</span>
                    </div>
                  </div>

                  {/* Screenshot */}
                  <div>
                    <label className="dl-lbl">Payment Screenshot <span style={{ color: "#e04" }}>*</span></label>
                    <div onClick={() => fileInputRef.current?.click()} className="dl-upload"
                      style={{ borderColor: screenshotPreview ? "rgba(201,168,76,0.4)" : "#222", background: screenshotPreview ? "rgba(201,168,76,0.03)" : "var(--dark2)" }}>
                      {screenshotPreview ? (
                        <div style={{ position: "relative" }}>
                          <img src={screenshotPreview} alt="preview" style={{ width: "100%", maxHeight: 144, objectFit: "contain", borderRadius: 4, display: "block" }} />
                          <div style={{ position: "absolute", inset: 0, borderRadius: 4, background: "rgba(0,0,0,0.6)", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity .2s" }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                            <span style={{ color: "#fff", fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>Click to change</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: "28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          <FiUpload size={20} style={{ color: "#444" }} />
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 12, color: "var(--ivory-dim)", fontWeight: 500 }}>Upload payment screenshot</p>
                            <p style={{ fontSize: 10, color: "#444", marginTop: 3 }}>PNG, JPG, WEBP · max 10MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={submitting} className="dl-btn"
                    style={{ width: "100%", padding: "16px 24px", borderRadius: 4, fontSize: 14, marginTop: 4 }}>
                    {submitting ? (
                      <>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", animation: "spin .7s linear infinite" }} />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <FiSend size={14} />
                        Confirm Payment{amount ? ` — ₹${Number(amount).toLocaleString()}` : ""}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 20 }}>
          {["🔒 Encrypted", "⚡ Fast Delivery", "24/7 Support"].map((item, i) => (
            <React.Fragment key={i}>
              <span style={{ fontSize: 10, color: "#333", letterSpacing: ".3px" }}>{item}</span>
              {i < 2 && <span style={{ color: "#222", fontSize: 12 }}>·</span>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <span style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#222" }}>
            © Dexter Luxuries · All rights reserved
          </span>
        </div>
      </div>
    </div>
  );
}