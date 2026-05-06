import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FiRefreshCw, FiUpload, FiCheckCircle, FiCopy, FiSend, FiAlertCircle, FiMessageCircle } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:3046/api";

// ── ★ YOUR DIRECT PAY QR — replace this URL with your own QR image link ──────
const DIRECT_PAY_QR = "https://YOUR_QR_IMAGE_URL_HERE.png";

// ── WhatsApp support number ───────────────────────────────────────────────────
const WHATSAPP_NUMBER = "916205147078";

// ── Static "Pay to Seller" tab that is always present ────────────────────────
const DIRECT_TAB = {
  _isDirectTab: true,        // flag so we can identify it anywhere
  method:       "direct",
  label:        "Pay to Seller",
  name:         null,        // no name row shown
  upiId:        null,        // no UPI ID row shown
  minAmount:    null,
  maxAmount:    null,
  qrBase64:     DIRECT_PAY_QR,
};

// ── Method metadata (icons/colors by method type) ─────────────────────────────
const METHOD_META = {
  gpay:    { icon: "https://mahesh247.win/images/icon/gpay.png",    color: "#4285F4", label: "GPay" },
  phonepe: { icon: "https://mahesh247.win/images/icon/phonepe.png", color: "#5f259f", label: "PhonePe" },
  paytm:   { icon: "https://mahesh247.win/images/icon/paytm.png",   color: "#00BAF2", label: "Paytm" },
  upi:     { icon: null,                                             color: "#C9A84C", label: "UPI" },
  direct:  { icon: null,                                             color: "#C9A84C", label: "Pay to Seller" },
};

// ── Build unique tab labels ───────────────────────────────────────────────────
function buildTabLabels(methods) {
  const typeCounts = {};
  methods.forEach((m) => { typeCounts[m.method] = (typeCounts[m.method] || 0) + 1; });

  const typeSeenSoFar = {};
  return methods.map((m) => {
    // Direct tab always uses its fixed label
    if (m._isDirectTab) return "Pay to Seller (Direct)";

    const baseMeta  = METHOD_META[m.method];
    const baseLabel = baseMeta?.label || m.label || m.method?.toUpperCase() || "PAY";

    if (typeCounts[m.method] > 1) {
      typeSeenSoFar[m.method] = (typeSeenSoFar[m.method] || 0) + 1;
      if (m.label && m.label.toLowerCase() !== m.method.toLowerCase()) return m.label;
      if (m.upiId) return `${baseLabel} ·${m.upiId.slice(-4)}`;
      return `${baseLabel} ${typeSeenSoFar[m.method]}`;
    }
    return baseLabel;
  });
}

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
  const pct    = nextRefreshAt ? Math.max(0, (remaining / totalMs) * 100) : 0;
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
        <div className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-orange-400" : "bg-amber-400"}`}
          style={{ width: `${pct}%` }} />
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
    <button onClick={copy}
      style={{ marginLeft: 6, color: "#C9A84C", background: "none", border: "none", cursor: "pointer" }}
      title={`Copy ${label}`}>
      {copied ? "✓" : <FiCopy size={12} />}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PaymentPage() {

  const urlParams = useMemo(() => {
    const params  = new URLSearchParams(window.location.search);
    const rawAmt  = params.get("amount")      || "";
    const rawId   = params.get("productId")   || "";
    const rawName = params.get("productName") || "";
    let productName = "";
    try { productName = decodeURIComponent(rawName.replace(/\+/g, " ")); } catch { productName = rawName; }
    return { amount: rawAmt, productId: rawId, productName };
  }, []);

  const [qrData,    setQrData]    = useState(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError,   setQrError]   = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const [utr,    setUtr]    = useState("");
  const [email,  setEmail]  = useState("");
  const [amount, setAmount] = useState(() => new URLSearchParams(window.location.search).get("amount") || "");

  const [screenshot,        setScreenshot]        = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const fileInputRef = useRef(null);
  const pollRef      = useRef(null);

  // ── Fetch QR — append DIRECT_TAB at end of every methods array ───────────
  const fetchQR = useCallback(async () => {
    try {
      setQrError(null);
      const res  = await fetch(`${API_BASE}/qr`);
      const data = await res.json();
      if (data.error)   throw new Error(data.error);
      if (data.loading) { setTimeout(fetchQR, 5000); return; }

      // ★ Always inject the Direct tab as the last tab
      const enriched = {
        ...data,
        methods: [...(data.methods || []), DIRECT_TAB],
      };
      setQrData(enriched);
      setQrLoading(false);
      setSelectedIdx(0);
    } catch (err) {
      // Even on error, still show Direct tab so user is never stuck
      setQrData({ methods: [DIRECT_TAB] });
      setQrError(err.message);
      setQrLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchQR();
    pollRef.current = setInterval(fetchQR, 30000);
    return () => clearInterval(pollRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const methods      = qrData?.methods || [DIRECT_TAB];
  const activeMethod = methods[selectedIdx] ?? null;
  const tabLabels    = useMemo(() => buildTabLabels(methods), [methods]); // eslint-disable-line react-hooks/exhaustive-deps

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
      fd.append("method",      activeMethod?.method || "");
      fd.append("methodLabel", tabLabels[selectedIdx] || "");
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
    setUtr(""); setEmail(""); setAmount(new URLSearchParams(window.location.search).get("amount") || "");
    setScreenshot(null); setScreenshotPreview(null); setSubmitted(false);
  }

  function openWhatsApp() {
    const msg = encodeURIComponent(
      `Hi, I'm facing a payment issue on Dexter Luxuries.\n\nProduct: ${urlParams.productName || "—"}\nAmount: ${amount ? "₹" + Number(amount).toLocaleString() : "—"}\n\nPlease help.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  }

  // ── CSS ───────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

    :root {
      --gold: #C9A84C; --gold-light: #E8C97A;
      --dark: #0A0A0A; --dark2: #111111; --dark3: #1A1A1A;
      --ivory: #F5F0E8; --ivory-dim: rgba(245,240,232,0.55);
      --wa-green: #25D366;
    }
    * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
    .dl-display { font-family: 'Playfair Display', serif !important; }

    @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes popIn     { from{opacity:0;transform:scale(.55)}       to{opacity:1;transform:scale(1)} }
    @keyframes shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes goldPulse { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)} 50%{box-shadow:0 0 0 6px rgba(201,168,76,.08)} }
    @keyframes waPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(37,211,102,0)} 50%{box-shadow:0 0 0 8px rgba(37,211,102,.12)} }
    @keyframes spin      { to{transform:rotate(360deg)} }

    .dl-fade-up { animation:fadeUp .45s ease forwards; }
    .dl-shimmer { background:linear-gradient(90deg,#1a1a1a 25%,#252525 50%,#1a1a1a 75%); background-size:200% auto; animation:shimmer 1.5s infinite linear; }

    /* Regular payment method tabs */
    .dl-tab-on  { background:rgba(201,168,76,.1)!important; border-color:var(--gold)!important;  color:var(--gold)!important; }
    .dl-tab-off { background:var(--dark2)!important;        border-color:#1e1e1e!important;       color:#4a4a4a!important; }
    .dl-tab-off:hover { border-color:rgba(201,168,76,.3)!important; color:var(--ivory-dim)!important; }

    /* ★ Direct / Pay-to-Seller tab has a distinct gold style */
    .dl-tab-direct-on  { background:rgba(201,168,76,.15)!important; border-color:var(--gold)!important; color:var(--gold)!important; }
    .dl-tab-direct-off { background:rgba(201,168,76,.04)!important; border-color:rgba(201,168,76,.25)!important; color:rgba(201,168,76,.55)!important; }
    .dl-tab-direct-off:hover { border-color:var(--gold)!important; color:var(--gold)!important; background:rgba(201,168,76,.1)!important; }

    .dl-input { width:100%; background:var(--dark2); border:1px solid #1e1e1e; border-radius:4px; padding:14px 16px; color:var(--ivory); font-size:14px; transition:border-color .2s,box-shadow .2s; }
    .dl-input::placeholder { color:#333; }
    .dl-input:focus { outline:none; border-color:var(--gold)!important; box-shadow:0 0 0 1px rgba(201,168,76,.12); }

    .dl-upload { border:1.5px dashed #222; border-radius:4px; cursor:pointer; transition:border-color .2s,background .2s; width:100%; }
    .dl-upload:hover { border-color:rgba(201,168,76,.4); background:rgba(201,168,76,.02); }

    .dl-btn { background:var(--gold); color:#000; font-weight:700; border:none; cursor:pointer; letter-spacing:.3px; display:flex; align-items:center; justify-content:center; gap:8px; transition:background .2s,transform .15s,box-shadow .2s; box-shadow:0 4px 32px rgba(201,168,76,.2); }
    .dl-btn:hover:not(:disabled) { background:var(--gold-light); transform:translateY(-1px); box-shadow:0 8px 40px rgba(201,168,76,.35); }
    .dl-btn:active:not(:disabled) { transform:translateY(0); }
    .dl-btn:disabled { opacity:.4; cursor:not-allowed; }

    /* ★ WhatsApp error button */
    .dl-wa-btn {
      width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
      background:rgba(37,211,102,.08); border:1px solid rgba(37,211,102,.3);
      color:#25D366; border-radius:4px; padding:12px 24px;
      font-size:13px; font-weight:600; cursor:pointer; letter-spacing:.3px;
      transition:background .2s,border-color .2s,transform .15s,box-shadow .2s;
      animation:waPulse 3s ease-in-out infinite;
    }
    .dl-wa-btn:hover {
      background:rgba(37,211,102,.14); border-color:rgba(37,211,102,.6);
      transform:translateY(-1px); box-shadow:0 6px 24px rgba(37,211,102,.15);
      animation:none;
    }
    .dl-wa-btn:active { transform:translateY(0); }

    .dl-banner { background:rgba(201,168,76,.06); border:1px solid rgba(201,168,76,.18); border-left:3px solid var(--gold); border-radius:4px; padding:12px 16px; margin-bottom:20px; animation:goldPulse 3s ease-in-out infinite; }
    .dl-lbl { font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--ivory-dim); font-weight:500; display:block; margin-bottom:8px; }

    /* Direct tab QR note badge */
    .dl-direct-badge {
      display:inline-flex; align-items:center; gap:5px;
      background:rgba(201,168,76,.1); border:1px solid rgba(201,168,76,.25);
      border-radius:3px; padding:4px 10px; font-size:10px;
      color:var(--gold); letter-spacing:1px; text-transform:uppercase;
      margin-top:8px; font-weight:600;
    }
  `;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 16px" }}>
      <style>{css}</style>
      <ToastContainer position="top-right" theme="dark" autoClose={3500} />

      <div className="dl-fade-up" style={{ width:"100%", maxWidth:420 }}>

        {/* ── Header ── */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
            <div style={{ width:42, height:42, background:"var(--gold)", clipPath:"polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }} />
          </div>
          <h1 className="dl-display" style={{ fontSize:"2.1rem", fontWeight:900, lineHeight:1.1, color:"var(--ivory)", letterSpacing:"-0.5px", margin:0 }}>
            DEXTER <span style={{ color:"var(--gold)" }}>LUXURIES</span>
          </h1>
          <p style={{ fontSize:9, letterSpacing:"3.5px", textTransform:"uppercase", color:"var(--ivory-dim)", marginTop:6, fontWeight:400 }}>
            Secure Payment Portal
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:14, justifyContent:"center" }}>
            <div style={{ width:60, height:1, background:"linear-gradient(to right,transparent,rgba(201,168,76,.4))" }} />
            <div style={{ width:5, height:5, background:"var(--gold)", transform:"rotate(45deg)" }} />
            <div style={{ width:60, height:1, background:"linear-gradient(to left,transparent,rgba(201,168,76,.4))" }} />
          </div>
        </div>

        {/* ── Card ── */}
        <div style={{ background:"#0f0f0f", border:"1px solid #1a1a1a", borderRadius:8, overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,.7),0 0 0 1px rgba(201,168,76,.04)" }}>

          {submitted ? (
            /* ── Success ── */
            <div className="dl-fade-up" style={{ padding:32, textAlign:"center", display:"flex", flexDirection:"column", gap:24 }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(201,168,76,.12)", border:"2px solid var(--gold)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto", animation:"popIn .45s cubic-bezier(.175,.885,.32,1.275) forwards" }}>
                <FiCheckCircle size={28} style={{ color:"var(--gold)" }} />
              </div>
              <div>
                <p className="dl-display" style={{ color:"var(--ivory)", fontSize:"1.4rem", fontWeight:700 }}>Order Confirmed!</p>
                <p style={{ color:"var(--ivory-dim)", fontSize:13, marginTop:8, lineHeight:1.7, fontWeight:300 }}>
                  Your payment is under review. We'll deliver your product within 15–30 minutes.
                </p>
              </div>
              <div style={{ background:"var(--dark2)", border:"1px solid rgba(201,168,76,.15)", borderRadius:4, padding:20, textAlign:"left" }}>
                <div style={{ height:1, background:"linear-gradient(to right,var(--gold),transparent)", marginBottom:16 }} />
                {[
                  urlParams.productName ? ["Product", urlParams.productName] : null,
                  ["Email",  email],
                  ["UTR",    utr, true],
                  ["Amount", amount ? `₹${Number(amount).toLocaleString()}` : "—"],
                  ["Method", tabLabels[selectedIdx] || activeMethod?.method || "—"],
                  ["Status", "Pending Review"],
                ].filter(Boolean).map(([k, v, mono]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:13 }}>
                    <span style={{ color:"var(--ivory-dim)", fontWeight:300 }}>{k}</span>
                    <span style={{ color:k==="Status"?"var(--gold)":"var(--ivory)", fontFamily:mono?"monospace":"inherit", fontWeight:k==="Status"?600:400, fontSize:12 }}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={reset} className="dl-btn" style={{ width:"100%", padding:"15px 24px", borderRadius:4, fontSize:14 }}>
                Make Another Payment
              </button>
            </div>
          ) : (
            <>
              {/* ── QR Section ── */}
              <div style={{ padding:"24px 24px 20px", borderBottom:"1px solid #181818" }}>

                {/* Product banner */}
                {(urlParams.productName || urlParams.amount) && (
                  <div className="dl-banner">
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        {urlParams.productName && (
                          <p style={{ fontSize:13, color:"var(--ivory)", fontWeight:500, marginBottom:2 }}>{urlParams.productName}</p>
                        )}
                        <p style={{ fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--ivory-dim)", fontWeight:300 }}>Digital Product</p>
                      </div>
                      {urlParams.amount && (
                        <span className="dl-display" style={{ color:"var(--gold)", fontSize:"1.5rem", fontWeight:700 }}>
                          ₹{Number(urlParams.amount).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Method tabs — always at least [Direct] ── */}
                {qrLoading ? (
                  <div style={{ display:"flex", gap:8, marginBottom:20 }}>
                    {[80, 96, 72].map((w) => <div key={w} className="dl-shimmer" style={{ height:32, borderRadius:4, width:w }} />)}
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto", paddingBottom:2 }}>
                    {methods.map((m, idx) => {
                      const isDirect = !!m._isDirectTab;
                      const icon     = !isDirect ? (METHOD_META[m.method]?.icon || null) : null;
                      const active   = selectedIdx === idx;

                      // Direct tab gets its own CSS classes, others use standard ones
                      const tabClass = isDirect
                        ? (active ? "dl-tab-direct-on" : "dl-tab-direct-off")
                        : (active ? "dl-tab-on" : "dl-tab-off");

                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedIdx(idx)}
                          className={tabClass}
                          style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:4, border:"1px solid", fontSize:11, fontWeight:600, whiteSpace:"nowrap", flexShrink:0, cursor:"pointer", transition:"all .2s", letterSpacing:".5px", textTransform:"uppercase" }}
                        >
                          {/* Direct tab gets a small store icon */}
                          {isDirect && (
                            <span style={{ fontSize:13, lineHeight:1 }}>🏪</span>
                          )}
                          {!isDirect && icon && (
                            <img src={icon} alt={tabLabels[idx]} style={{ width:14, height:14, objectFit:"contain" }}
                              onError={(e) => { e.target.style.display = "none"; }} />
                          )}
                          {tabLabels[idx]}
                          {/* Small "direct" pill on the tab */}
                          {isDirect && (
                            <span style={{ fontSize:8, background:"rgba(201,168,76,.2)", borderRadius:2, padding:"1px 4px", marginLeft:2, letterSpacing:"0.5px", color:"var(--gold)" }}>
                              DIRECT
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── QR display ── */}
                {qrLoading ? (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, padding:"16px 0" }}>
                    <div className="dl-shimmer" style={{ width:160, height:160, borderRadius:4 }} />
                    <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
                      <div className="dl-shimmer" style={{ height:14, borderRadius:4, width:"70%" }} />
                      <div className="dl-shimmer" style={{ height:14, borderRadius:4, width:"50%" }} />
                    </div>
                  </div>
                ) : activeMethod ? (
                  <div>
                    {/* QR image */}
                    {activeMethod.qrBase64 ? (
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                        <div style={{ background:"#fff", padding:12, borderRadius:4, border:"1px solid rgba(201,168,76,.2)", boxShadow:"0 0 32px rgba(201,168,76,.06)" }}>
                          <img
                            src={activeMethod.qrBase64}
                            alt="Payment QR"
                            style={{ width:160, height:160, objectFit:"contain", display:"block" }}
                          />
                        </div>
                        {/* Direct tab — show a note instead of "Scan with any UPI app" */}
                        {activeMethod._isDirectTab ? (
                          <span className="dl-direct-badge">
                            🏪 Pay directly to seller
                          </span>
                        ) : (
                          <p style={{ fontSize:11, color:"var(--ivory-dim)", marginTop:8, letterSpacing:".5px" }}>
                            Scan with any UPI app
                          </p>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding:"32px 0", textAlign:"center" }}>
                        <p style={{ color:"var(--ivory-dim)", fontSize:13 }}>QR not available for this method</p>
                        <p style={{ color:"#333", fontSize:12, marginTop:4 }}>Try another payment method</p>
                      </div>
                    )}

                    {/* Details row — only shown for non-direct tabs */}
                    {!activeMethod._isDirectTab && (
                      <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #181818", display:"flex", flexDirection:"column", gap:10 }}>
                        {activeMethod.name && (
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ color:"var(--ivory-dim)", fontSize:11, letterSpacing:"1px", textTransform:"uppercase" }}>Name</span>
                            <span style={{ color:"var(--ivory)", fontSize:12, fontWeight:500 }}>{activeMethod.name}</span>
                          </div>
                        )}
                        {activeMethod.upiId && (
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ color:"var(--ivory-dim)", fontSize:11, letterSpacing:"1px", textTransform:"uppercase" }}>UPI ID</span>
                            <div style={{ display:"flex", alignItems:"center" }}>
                              <span style={{ color:"var(--ivory)", fontFamily:"monospace", fontSize:12 }}>{activeMethod.upiId}</span>
                              <CopyBtn text={activeMethod.upiId} label="UPI ID" />
                            </div>
                          </div>
                        )}
                        {(activeMethod.minAmount || activeMethod.maxAmount) && (
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ color:"var(--ivory-dim)", fontSize:11, letterSpacing:"1px", textTransform:"uppercase" }}>Limit</span>
                            <span style={{ color:"#555", fontSize:12 }}>₹{activeMethod.minAmount?.toLocaleString()} – ₹{activeMethod.maxAmount?.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timer — only for dynamic tabs */}
                    {!activeMethod._isDirectTab && qrData?.nextRefreshAt && (
                      <QRTimer nextRefreshAt={qrData.nextRefreshAt} />
                    )}

                    {/* ★ QR error banner only on dynamic tabs */}
                    {!activeMethod._isDirectTab && qrError && (
                      <div style={{ display:"flex", alignItems:"center", gap:8, color:"#f97316", fontSize:12, marginTop:12, background:"rgba(249,115,22,.05)", border:"1px solid rgba(249,115,22,.2)", borderRadius:4, padding:"10px 12px" }}>
                        <FiAlertCircle size={14} style={{ flexShrink:0 }} />
                        <span>{qrError}</span>
                        <button onClick={fetchQR} style={{ marginLeft:"auto", fontSize:11, color:"var(--gold)", textDecoration:"underline", background:"none", border:"none", cursor:"pointer" }}>Retry</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding:"40px 0", textAlign:"center", color:"var(--ivory-dim)", fontSize:13 }}>No payment methods available</div>
                )}
              </div>

              {/* ── Form ── */}
              <div style={{ padding:24 }}>
                <p style={{ color:"var(--ivory-dim)", fontSize:11, textAlign:"center", marginBottom:20, letterSpacing:".3px", fontWeight:300 }}>
                  After completing the payment above, fill in your details
                </p>

                <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

                  {/* Amount */}
                  <div>
                    <label className="dl-lbl">Amount Paid (₹)</label>
                    <div style={{ display:"flex", alignItems:"center", background:"var(--dark2)", border:"1px solid #1e1e1e", borderRadius:4, overflow:"hidden" }}>
                      <span style={{ padding:"14px", color:"var(--gold)", fontWeight:700, borderRight:"1px solid #1e1e1e", background:"rgba(201,168,76,.05)", fontSize:15, lineHeight:1, flexShrink:0 }}>₹</span>
                      <input
                        type="number" min="1" placeholder="e.g. 1000"
                        value={amount}
                        onChange={(e) => { if (!urlParams.amount) setAmount(e.target.value); }}
                        readOnly={!!urlParams.amount}
                        style={{ flex:1, background:"transparent", border:"none", color:"var(--ivory)", fontSize:15, padding:"14px", outline:"none", fontWeight:urlParams.amount?600:400, cursor:urlParams.amount?"default":"text" }}
                      />
                      {urlParams.amount && (
                        <span style={{ padding:"0 12px", fontSize:9, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--gold)", opacity:.8, flexShrink:0 }}>FIXED</span>
                      )}
                    </div>
                    {urlParams.amount && (
                      <p style={{ fontSize:10, color:"#555", marginTop:5 }}>Amount is fixed based on the product you selected</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="dl-lbl">Your Email <span style={{ color:"#e04" }}>*</span></label>
                    <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="dl-input" />
                  </div>

                  {/* UTR */}
                  <div>
                    <label className="dl-lbl">UTR / Transaction ID <span style={{ color:"#e04" }}>*</span></label>
                    <div style={{ position:"relative" }}>
                      <input type="text" inputMode="numeric" placeholder="6–12 digit reference number"
                        value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g,"").slice(0,12))}
                        required className="dl-input" style={{ fontFamily:"monospace", paddingRight:44 }} />
                      <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:10, color:"#333", fontFamily:"monospace" }}>{utr.length}/12</span>
                    </div>
                  </div>

                  {/* Screenshot */}
                  <div>
                    <label className="dl-lbl">Payment Screenshot <span style={{ color:"#e04" }}>*</span></label>
                    <div onClick={() => fileInputRef.current?.click()} className="dl-upload"
                      style={{ borderColor:screenshotPreview?"rgba(201,168,76,.4)":"#222", background:screenshotPreview?"rgba(201,168,76,.03)":"var(--dark2)" }}>
                      {screenshotPreview ? (
                        <div style={{ position:"relative" }}>
                          <img src={screenshotPreview} alt="preview" style={{ width:"100%", maxHeight:144, objectFit:"contain", borderRadius:4, display:"block" }} />
                          <div style={{ position:"absolute", inset:0, borderRadius:4, background:"rgba(0,0,0,.6)", opacity:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"opacity .2s" }}
                            onMouseEnter={e => e.currentTarget.style.opacity=1}
                            onMouseLeave={e => e.currentTarget.style.opacity=0}>
                            <span style={{ color:"#fff", fontSize:11, fontWeight:600, letterSpacing:"1px", textTransform:"uppercase" }}>Click to change</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding:"28px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                          <FiUpload size={20} style={{ color:"#444" }} />
                          <div style={{ textAlign:"center" }}>
                            <p style={{ fontSize:12, color:"var(--ivory-dim)", fontWeight:500 }}>Upload payment screenshot</p>
                            <p style={{ fontSize:10, color:"#444", marginTop:3 }}>PNG, JPG, WEBP · max 10MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display:"none" }} />
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={submitting} className="dl-btn"
                    style={{ width:"100%", padding:"16px 24px", borderRadius:4, fontSize:14, marginTop:4 }}>
                    {submitting ? (
                      <>
                        <div style={{ width:16, height:16, borderRadius:"50%", border:"2px solid rgba(0,0,0,.2)", borderTopColor:"#000", animation:"spin .7s linear infinite" }} />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <FiSend size={14} />
                        Confirm Payment{amount ? ` — ₹${Number(amount).toLocaleString()}` : ""}
                      </>
                    )}
                  </button>

                  {/* ★ Payment Error / WhatsApp button */}
                  <div style={{ marginTop:4 }}>
                    {/* Divider */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                      <div style={{ flex:1, height:1, background:"#1a1a1a" }} />
                      <span style={{ fontSize:10, color:"#333", letterSpacing:"1px", textTransform:"uppercase" }}>Having trouble?</span>
                      <div style={{ flex:1, height:1, background:"#1a1a1a" }} />
                    </div>

                    <button type="button" onClick={openWhatsApp} className="dl-wa-btn">
                      {/* WhatsApp SVG icon */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Payment Error? Chat with Support
                    </button>

                    <p style={{ fontSize:10, color:"#333", textAlign:"center", marginTop:8, letterSpacing:".3px" }}>
                      We'll resolve your issue within minutes
                    </p>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginTop:20 }}>
          {["🔒 Encrypted","⚡ Fast Delivery","24/7 Support"].map((item,i) => (
            <React.Fragment key={i}>
              <span style={{ fontSize:10, color:"#333", letterSpacing:".3px" }}>{item}</span>
              {i < 2 && <span style={{ color:"#222", fontSize:12 }}>·</span>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ textAlign:"center", marginTop:10 }}>
          <span style={{ fontSize:9, letterSpacing:"2px", textTransform:"uppercase", color:"#222" }}>
            © Dexter Luxuries · All rights reserved
          </span>
        </div>
      </div>
    </div>
  );
}