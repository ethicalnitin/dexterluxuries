import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiRefreshCw, FiUpload, FiCheckCircle, FiArrowLeft, FiCopy, FiZap } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://dexterluxuries-backend-6ptn.onrender.com/api";
const QR_TOTAL_MS = 10 * 60 * 1000;

// ── Method icon/label map ─────────────────────────────────────────────────────
const METHOD_META = {
  gpay:    { icon: "https://mahesh247.win/images/icon/gpay.png",    color: "#4285F4", label: "GPay" },
  phonepe: { icon: "https://mahesh247.win/images/icon/phonepe.png", color: "#5f259f", label: "PhonePe" },
  paytm:   { icon: "https://mahesh247.win/images/icon/paytm.png",   color: "#00BAF2", label: "Paytm" },
  upi:     { icon: null,                                             color: "#F7931A", label: "UPI" },
};

// ── Countdown hook ────────────────────────────────────────────────────────────
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

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ["Amount", "Pay & Confirm", "Done"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <React.Fragment key={n}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${done ? "bg-green-500 text-white" : active ? "bg-yellow-400 text-black" : "bg-gray-700 text-gray-400"}`}
              >
                {done ? "✓" : n}
              </div>
              <span className={`text-xs whitespace-nowrap ${active ? "text-yellow-400 font-semibold" : "text-gray-500"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 h-0.5 mb-4 mx-1 transition-all duration-300 ${current > n ? "bg-green-500" : "bg-gray-700"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── QR Timer bar ──────────────────────────────────────────────────────────────
function QRTimer({ nextRefreshAt }) {
  const { mins, secs, remaining } = useCountdown(nextRefreshAt);
  const pct = nextRefreshAt ? Math.max(0, (remaining / QR_TOTAL_MS) * 100) : 0;
  const urgent = pct < 20;

  return (
    <div className="mt-3 w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <FiRefreshCw className={urgent ? "text-red-400 animate-spin" : "text-green-400"} size={11} />
          QR refreshes in
        </span>
        <span className={`text-xs font-mono font-bold ${urgent ? "text-red-400" : "text-green-400"}`}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
      </div>
      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-400" : "bg-green-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Payment Method Tabs ───────────────────────────────────────────────────────
function PaymentMethodTabs({ methods, selected, onSelect }) {
  if (!methods || methods.length <= 1) return null;
  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
      {methods.map((m) => {
        const meta = METHOD_META[m.method] || { color: "#eab308", label: m.label };
        const isActive = selected === m.method;
        return (
          <button
            key={m.method}
            onClick={() => onSelect(m.method)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0
              ${isActive
                ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500 hover:text-gray-300"
              }`}
          >
            {meta.icon && (
              <img
                src={meta.icon}
                alt={meta.label}
                className="w-4 h-4 object-contain"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            )}
            {meta.label || m.label}
          </button>
        );
      })}
    </div>
  );
}

// ── QR Panel for selected method ──────────────────────────────────────────────
function QRPanel({ methodData, amount, nextRefreshAt, onRefresh }) {
  function copyUPI() {
    if (methodData?.upiId) {
      navigator.clipboard.writeText(methodData.upiId);
      toast.success("UPI ID copied!");
    }
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 text-center">
      {!methodData ? (
        <div className="py-8 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-gray-600 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Fetching QR Code...</p>
        </div>
      ) : methodData.qrBase64 ? (
        <>
          <div className="relative inline-block">
            <img
              src={methodData.qrBase64}
              alt="Payment QR Code"
              className="w-44 h-44 mx-auto rounded-xl bg-white p-2 shadow-lg object-contain"
            />
          </div>
          <p className="text-gray-500 text-xs mt-2">Scan with any UPI app</p>

          <div className="mt-4 text-left space-y-2 border-t border-gray-700 pt-4">
            {methodData.name && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="text-white font-medium">{methodData.name}</span>
              </div>
            )}
            {methodData.upiId && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">UPI ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-mono text-xs">{methodData.upiId}</span>
                  <button onClick={copyUPI} className="text-yellow-400 hover:text-yellow-300 transition-colors">
                    <FiCopy size={13} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="text-yellow-400 font-bold">₹{parseInt(amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Limit</span>
              <span className="text-gray-400 text-xs">
                ₹{methodData.minAmount?.toLocaleString()} – ₹{methodData.maxAmount?.toLocaleString()}
              </span>
            </div>
          </div>

          <QRTimer nextRefreshAt={nextRefreshAt} />

          <button
            onClick={onRefresh}
            className="mt-3 flex items-center gap-1.5 text-gray-500 hover:text-yellow-400 text-xs mx-auto transition-colors"
          >
            <FiRefreshCw size={11} /> Refresh QR now
          </button>
        </>
      ) : (
        <div className="py-6">
          <p className="text-gray-400 text-sm mb-1">⚠️ QR not available for this method</p>
          <p className="text-gray-600 text-xs">Try another payment method above</p>
        </div>
      )}
    </div>
  );
}

// ── Animated Step Wrapper ─────────────────────────────────────────────────────
function StepPanel({ children }) {
  return (
    <div style={{ animation: "stepFadeIn 0.3s ease forwards" }}>
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [step, setStep] = useState(1);

  const fileInputRef = useRef(null);
  const pollRef = useRef(null); // holds the setInterval id for QR polling

  // ── Fetch QR with actual user amount ────────────────────────────────────────
  const fetchQR = useCallback(async (fetchAmount) => {
    const amt = parseInt(fetchAmount);
    if (!amt || amt < 300) return;

    try {
      setQrLoading(true);
      setQrError(null);
      const res = await fetch(`${API_BASE}/qr?amount=${amt}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Backend is still fetching — retry after 5s
      if (data.loading) {
        setTimeout(() => fetchQR(amt), 5000);
        return;
      }

      setQrData(data);

      // Auto-select first method if none selected yet
      if (data.methods?.length > 0 && !selectedMethod) {
        setSelectedMethod(data.methods[0].method);
      }
    } catch (err) {
      setQrError(err.message);
    } finally {
      setQrLoading(false);
    }
  }, [selectedMethod]);

  // ── Only fetch QR when user reaches Step 2 (real amount known) ──────────────
  useEffect(() => {
    if (step === 2 && amount) {
      // Immediate fetch
      fetchQR(amount);

      // Poll every 30s to keep QR fresh
      pollRef.current = setInterval(() => fetchQR(amount), 30000);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [step, amount]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: fetchQR intentionally excluded — adding it causes re-fetch loops
  // because fetchQR's reference changes when selectedMethod changes.

  // ── Derived: currently selected method data ──────────────────────────────
  const activeMethod =
    qrData?.methods?.find((m) => m.method === selectedMethod) ??
    qrData?.methods?.[0] ??
    null;

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleAmountSubmit(e) {
    e.preventDefault();
    const amt = parseInt(amount);
    if (isNaN(amt) || amt < 300) {
      toast.error("Minimum deposit is ₹300");
      return;
    }
    if (activeMethod?.maxAmount && amt > activeMethod.maxAmount) {
      toast.error(`Maximum deposit is ₹${activeMethod.maxAmount}`);
      return;
    }
    // Reset any stale QR data from a previous session
    setQrData(null);
    setQrError(null);
    setSelectedMethod(null);
    setStep(2);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  async function triggerManualRefresh() {
    try {
      await fetch(`${API_BASE}/qr/refresh?amount=${parseInt(amount)}`, { method: "POST" });
      toast.info("QR refresh triggered...");
      setTimeout(() => fetchQR(amount), 3000);
    } catch {
      toast.error("Refresh failed");
    }
  }

  async function handleDeposit(e) {
    e.preventDefault();
    if (utr.trim().length < 6) {
      toast.error("UTR must be at least 6 digits");
      return;
    }
    if (!screenshot) {
      toast.error("Please upload your payment screenshot");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("utr", utr.trim());
      formData.append("amount", amount);
      formData.append("method", selectedMethod || "gpay");
      formData.append("screenshot", screenshot);

      const res = await fetch(`${API_BASE}/deposit`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmitResult({ success: true, message: data.message });
      setStep(3);
      toast.success("Deposit submitted!");
    } catch (err) {
      toast.error(err.message);
      setSubmitResult({ success: false, message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setAmount("");
    setUtr("");
    setScreenshot(null);
    setScreenshotPreview(null);
    setSubmitResult(null);
    setQrData(null);
    setQrError(null);
    setSelectedMethod(null);
    if (pollRef.current) clearInterval(pollRef.current);
    setStep(1);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">

      <style>{`
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <ToastContainer position="top-right" theme="dark" autoClose={3000} />

      <div className="w-full max-w-md" style={{ animation: "cardSlideUp 0.4s ease forwards" }}>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="bg-gradient-to-r from-green-900 via-green-800 to-green-900 px-8 py-6 text-center border-b border-green-700/30">
            <h1 className="text-2xl font-black tracking-tight">
              <span className="text-white">LOTUS</span>
              <span className="text-yellow-400">365</span>
            </h1>
            <p className="text-green-300/60 text-xs tracking-widest uppercase mt-1">
              Secure Deposit Portal
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <Steps current={step} />

            {/* ── Step 1: Amount ── */}
            {step === 1 && (
              <StepPanel key="step1">
                <form onSubmit={handleAmountSubmit} className="space-y-4">
                  <h2 className="text-white font-bold text-lg">Enter Deposit Amount</h2>

                  <div className="flex items-center bg-gray-800 border border-gray-700 rounded-xl overflow-hidden focus-within:border-yellow-400 transition-colors">
                    <span className="px-4 text-yellow-400 text-xl font-bold bg-yellow-400/10 self-stretch flex items-center border-r border-gray-700">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="300"
                      max="100000"
                      placeholder="Min ₹300"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="flex-1 bg-transparent text-white text-xl font-semibold px-4 py-4 outline-none placeholder-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[500, 1000, 2000, 5000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAmount(String(v))}
                        className={`py-2 rounded-lg text-sm font-semibold border transition-all
                          ${String(amount) === String(v)
                            ? "bg-yellow-400/15 border-yellow-400 text-yellow-400"
                            : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                          }`}
                      >
                        ₹{v >= 1000 ? `${v / 1000}K` : v}
                      </button>
                    ))}
                  </div>

                  {/* Info banner instead of method preview (QR not fetched yet on step 1) */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <FiZap size={10} className="text-yellow-400" />
                      GPay, PhonePe, Paytm & UPI QR codes will be fetched for your exact amount on the next step.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-yellow-400/20 active:translate-y-0"
                  >
                    Continue →
                  </button>
                </form>
              </StepPanel>
            )}

            {/* ── Step 2: Payment Method + QR + Form ── */}
            {step === 2 && (
              <StepPanel key="step2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-bold text-lg">
                      Pay <span className="text-yellow-400">₹{parseInt(amount).toLocaleString()}</span>
                    </h2>
                    <button
                      onClick={() => {
                        if (pollRef.current) clearInterval(pollRef.current);
                        setStep(1);
                      }}
                      className="flex items-center gap-1 text-gray-400 hover:text-white text-sm border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <FiArrowLeft size={13} /> Back
                    </button>
                  </div>

                  {/* Payment method tabs */}
                  {qrLoading && !qrData ? (
                    <div className="flex gap-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-8 w-20 bg-gray-800 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : qrError ? (
                    <div className="bg-red-900/20 border border-red-800 rounded-xl p-3 flex items-center justify-between">
                      <p className="text-red-400 text-sm">⚠️ {qrError}</p>
                      <button onClick={() => fetchQR(amount)} className="text-yellow-400 text-xs underline ml-2">Retry</button>
                    </div>
                  ) : (
                    <PaymentMethodTabs
                      methods={qrData?.methods || []}
                      selected={selectedMethod}
                      onSelect={setSelectedMethod}
                    />
                  )}

                  {/* QR Panel */}
                  <QRPanel
                    methodData={activeMethod}
                    amount={amount}
                    nextRefreshAt={qrData?.nextRefreshAt}
                    onRefresh={triggerManualRefresh}
                  />

                  {/* Divider */}
                  <div className="flex items-center gap-3 text-gray-600 text-xs">
                    <div className="flex-1 h-px bg-gray-800" />
                    After payment, fill details below
                    <div className="flex-1 h-px bg-gray-800" />
                  </div>

                  {/* UTR + Screenshot form */}
                  <form onSubmit={handleDeposit} className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm font-semibold mb-1.5 block">
                        UTR / Transaction Reference <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter 6–12 digit UTR number"
                          value={utr}
                          onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                          required
                          className="w-full bg-gray-800 border border-gray-700 focus:border-yellow-400 rounded-xl px-4 py-3.5 text-white font-mono outline-none transition-colors placeholder-gray-600 text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600">
                          {utr.length}/12
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-400 text-sm font-semibold mb-1.5 block">
                        Payment Screenshot <span className="text-red-400">*</span>
                      </label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full border-2 border-dashed rounded-xl cursor-pointer transition-all
                          ${screenshotPreview
                            ? "border-green-500/50 bg-green-500/5"
                            : "border-gray-700 hover:border-yellow-400/50 bg-gray-800"
                          }`}
                      >
                        {screenshotPreview ? (
                          <div className="relative">
                            <img
                              src={screenshotPreview}
                              alt="Preview"
                              className="w-full max-h-40 object-contain rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                              <span className="text-white text-sm font-semibold">Click to change</span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 flex flex-col items-center gap-2 text-gray-500">
                            <FiUpload size={24} />
                            <div className="text-sm text-center">
                              <p className="font-semibold text-gray-400">Upload payment screenshot</p>
                              <p className="text-xs mt-0.5">PNG, JPG, WEBP — max 10MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-yellow-400/20 active:translate-y-0 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : "Submit Deposit →"}
                    </button>
                  </form>
                </div>
              </StepPanel>
            )}

            {/* ── Step 3: Success ── */}
            {step === 3 && (
              <StepPanel key="step3">
                <div className="text-center py-4 space-y-5">
                  <div
                    className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto"
                    style={{ animation: "popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}
                  >
                    <FiCheckCircle className="text-white" size={40} />
                  </div>

                  <div>
                    <h2 className="text-white font-bold text-xl">Deposit Submitted!</h2>
                    <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                      {submitResult?.message || "Your deposit has been submitted and will be credited shortly."}
                    </p>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-left space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount</span>
                      <span className="text-yellow-400 font-bold">₹{parseInt(amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Method</span>
                      <span className="text-white text-xs font-semibold uppercase">
                        {(METHOD_META[selectedMethod] || {}).label || selectedMethod}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">UTR</span>
                      <span className="text-white font-mono text-xs">{utr}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className="text-yellow-400 text-xs font-bold bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-full">
                        Pending Approval
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={reset}
                    className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all"
                  >
                    Make Another Deposit
                  </button>
                </div>
              </StepPanel>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-3 px-8 py-4 border-t border-gray-800 bg-gray-900/50">
            {["🔒 Secured", "24/7 Support", "Instant Credits"].map((item, i) => (
              <React.Fragment key={i}>
                <span className="text-gray-600 text-xs">{item}</span>
                {i < 2 && <span className="text-gray-700">•</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}