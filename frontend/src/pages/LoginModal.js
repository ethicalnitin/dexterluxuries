import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

/* ============================================================
   LOGIN MODAL — email in, OTP in, done.
   Rendered once by <AuthProvider>; you never place this
   component yourself. Trigger it via useAuth().requireAuth(...)
   or useAuth().openLogin() from anywhere in the app.
============================================================ */

const styles = `
.cvauth-overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(4,4,10,.72); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: cvauthFadeIn .2s ease;
}
@keyframes cvauthFadeIn { from { opacity: 0; } to { opacity: 1; } }

.cvauth-modal {
  position: relative; width: 100%; max-width: 400px;
  background: #0B0B18; border: 1px solid rgba(255,255,255,.14);
  border-radius: 22px; padding: 36px 30px 30px;
  box-shadow: 0 40px 90px rgba(0,0,0,.55);
  font-family: "Inter", sans-serif; color: #F6F7FB;
  animation: cvauthPop .25s cubic-bezier(.16,1,.3,1);
  overflow: hidden;
}
@keyframes cvauthPop { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

@media (prefers-reduced-motion: reduce) {
  .cvauth-overlay, .cvauth-modal { animation: none !important; }
}

.cvauth-glow {
  position: absolute; top: -120px; left: 50%; transform: translateX(-50%);
  width: 320px; height: 240px; border-radius: 50%; filter: blur(70px); opacity: .35; pointer-events: none;
  background: radial-gradient(circle, #8B5CF6, transparent 70%);
}

.cvauth-close {
  position: absolute; top: 16px; right: 16px; width: 30px; height: 30px; border-radius: 9px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); color: #A6ACC0;
  display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 15px;
  transition: .2s ease;
}
.cvauth-close:hover { background: rgba(255,255,255,.12); color: #fff; }

.cvauth-eyebrow {
  display: inline-flex; align-items: center; gap: 7px; color: #37E6C9; font-size: 10.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.4px; font-family: "JetBrains Mono", monospace; margin-bottom: 12px;
}
.cvauth-modal h2 {
  font-family: "Bricolage Grotesque", sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -.8px; line-height: 1.2;
}
.cvauth-modal p.cvauth-sub { color: #A6ACC0; font-size: 13.5px; margin-top: 8px; line-height: 1.6; }
.cvauth-modal p.cvauth-sub strong { color: #F6F7FB; font-weight: 600; }

.cvauth-field { margin-top: 24px; }
.cvauth-label { display: block; font-size: 11.5px; font-weight: 600; color: #A6ACC0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .6px; }
.cvauth-input {
  width: 100%; height: 50px; border-radius: 12px; border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.04); color: #F6F7FB; font-size: 15px; padding: 0 16px;
  font-family: "Inter", sans-serif; outline: none; transition: border-color .2s ease, background .2s ease;
}
.cvauth-input:focus { border-color: rgba(139,92,246,.6); background: rgba(255,255,255,.06); }
.cvauth-input::placeholder { color: #686E82; }

.cvauth-otp-row { display: flex; gap: 9px; margin-top: 24px; }
.cvauth-otp-box {
  flex: 1; min-width: 0; height: 54px; border-radius: 12px; border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.04); color: #F6F7FB; text-align: center;
  font-family: "JetBrains Mono", monospace; font-size: 20px; font-weight: 600; outline: none;
  transition: border-color .2s ease, background .2s ease;
}
.cvauth-otp-box:focus { border-color: rgba(139,92,246,.6); background: rgba(255,255,255,.06); }

.cvauth-error {
  margin-top: 14px; padding: 10px 13px; border-radius: 10px;
  background: rgba(255,99,176,.1); border: 1px solid rgba(255,99,176,.28);
  color: #FF9FCB; font-size: 12.5px; line-height: 1.5;
}

.cvauth-btn {
  width: 100%; height: 50px; margin-top: 22px; border-radius: 12px; border: none; cursor: pointer;
  background: linear-gradient(115deg, #8B5CF6 0%, #FF63B0 48%, #37E6C9 100%);
  background-size: 220% auto; background-position: 0% center;
  color: #07070F; font-size: 14.5px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background-position .4s ease, transform .2s ease, opacity .2s ease;
}
.cvauth-btn:hover:not(:disabled) { background-position: 100% center; transform: translateY(-1px); }
.cvauth-btn:disabled { opacity: .55; cursor: not-allowed; }

.cvauth-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 18px; }
.cvauth-link-btn {
  background: none; border: none; cursor: pointer; color: #A6ACC0; font-size: 12.5px; font-weight: 600;
  font-family: "Inter", sans-serif; padding: 0; transition: color .2s ease;
}
.cvauth-link-btn:hover:not(:disabled) { color: #F6F7FB; }
.cvauth-link-btn:disabled { color: #4A4E5C; cursor: not-allowed; }

.cvauth-spinner {
  width: 15px; height: 15px; border-radius: 50%;
  border: 2px solid rgba(7,7,15,.3); border-top-color: #07070F;
  animation: cvauthSpin .7s linear infinite;
}
@keyframes cvauthSpin { to { transform: rotate(360deg); } }
`;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const LoginModal = ({ isOpen, onClose }) => {
  const { sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState("email"); // 'email' | 'otp'
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const otpRefs = useRef([]);
  const emailInputRef = useRef(null);

  // Reset to a clean state every time the modal opens.
  useEffect(() => {
    if (isOpen) {
      setStep("email");
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setLoading(false);
      setTimeout(() => emailInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSendOtp = useCallback(
    async (e) => {
      e.preventDefault();
      if (!isValidEmail(email)) {
        setError("Enter a valid email address.");
        return;
      }
      setError("");
      setLoading(true);
      try {
        await sendOtp(email);
        setStep("otp");
        setCooldown(30);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } catch (err) {
        setError(err.message || "Couldn't send the code. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [email, sendOtp]
  );

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await sendOtp(email);
      setCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || "Couldn't resend the code.");
    } finally {
      setLoading(false);
    }
  }, [cooldown, email, sendOtp]);

  const submitOtp = useCallback(
    async (code) => {
      setError("");
      setLoading(true);
      try {
        await verifyOtp(email, code);
        // AuthProvider closes the modal and fires the pending action on success.
      } catch (err) {
        setError(err.message || "That code didn't work. Check it and try again.");
        setLoading(false);
      }
    },
    [email, verifyOtp]
  );

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      submitOtp(next.join(""));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split("");
    while (next.length < 6) next.push("");
    setOtp(next);
    const lastFilled = Math.min(pasted.length, 6) - 1;
    otpRefs.current[lastFilled]?.focus();
    if (pasted.length === 6) submitOtp(pasted);
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{styles}</style>
      <div
        className="cvauth-overlay"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="cvauth-modal" role="dialog" aria-modal="true" aria-label="Sign in">
          <div className="cvauth-glow" />
          <button type="button" className="cvauth-close" onClick={onClose} aria-label="Close">
            ✕
          </button>

          {step === "email" ? (
            <>
              <div className="cvauth-eyebrow">◆ Sign in to continue</div>
              <h2>Verify your email to purchase</h2>
              <p className="cvauth-sub">We'll send a one-time code to confirm it's you — no password needed.</p>

              <form onSubmit={handleSendOtp}>
                <div className="cvauth-field">
                  <label className="cvauth-label" htmlFor="cvauth-email">
                    Email address
                  </label>
                  <input
                    id="cvauth-email"
                    ref={emailInputRef}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className="cvauth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && <div className="cvauth-error">{error}</div>}

                <button type="submit" className="cvauth-btn" disabled={loading}>
                  {loading ? <span className="cvauth-spinner" /> : null}
                  {loading ? "Sending code…" : "Send code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="cvauth-eyebrow">◆ Check your inbox</div>
              <h2>Enter the 6-digit code</h2>
              <p className="cvauth-sub">
                Sent to <strong>{email}</strong>. Didn't get it? Check spam or resend below.
              </p>

              <div className="cvauth-otp-row" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="cvauth-otp-box"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={loading}
                  />
                ))}
              </div>

              {error && <div className="cvauth-error">{error}</div>}

              <button
                type="button"
                className="cvauth-btn"
                disabled={loading || otp.some((d) => !d)}
                onClick={() => submitOtp(otp.join(""))}
              >
                {loading ? <span className="cvauth-spinner" /> : null}
                {loading ? "Verifying…" : "Verify & continue"}
              </button>

              <div className="cvauth-meta">
                <button type="button" className="cvauth-link-btn" onClick={() => setStep("email")} disabled={loading}>
                  ← Change email
                </button>
                <button type="button" className="cvauth-link-btn" onClick={handleResend} disabled={loading || cooldown > 0}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LoginModal;