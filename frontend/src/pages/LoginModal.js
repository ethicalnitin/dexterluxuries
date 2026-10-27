import React, { useState, useRef, useEffect, useCallback } from "react";
import { LuEye, LuEyeOff, LuArrowLeft } from "react-icons/lu";
import { useAuth } from "./AuthContext";
import { Modal, Field, Input, Button, Alert } from "../components/ui";
import { isValidEmail } from "../utils/email";
import "./LoginModal.css";

const PASSWORD_MIN = 8;
const RESEND_COOLDOWN = 30;
const EMPTY_OTP = ["", "", "", "", "", ""];

const PasswordInput = ({ id, value, onChange, autoComplete, placeholder, inputRef }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-password">
      <Input
        id={id}
        ref={inputRef}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="auth-password__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <LuEyeOff /> : <LuEye />}
      </button>
    </div>
  );
};

const LoginModal = ({ isOpen, initialView, onClose }) => {
  const { login, signup, requestPasswordReset, resetPassword } = useAuth();

  const [view, setView] = useState(initialView);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const firstFieldRef = useRef(null);
  const newPasswordRef = useRef(null);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setPassword("");
      setOtp(EMPTY_OTP);
      setError("");
      setLoading(false);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      if (view === "reset") otpRefs.current[0]?.focus();
      else firstFieldRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [isOpen, view]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const switchView = (next) => {
    setView(next);
    setPassword("");
    setOtp(EMPTY_OTP);
    setError("");
  };

  const run = async (task) => {
    setError("");
    setLoading(true);
    try {
      await task();
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    run(() => login(email.trim(), password));
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Enter your name.");
    if (!isValidEmail(email)) return setError("Enter a valid email address.");
    if (password.length < PASSWORD_MIN) return setError(`Password must be at least ${PASSWORD_MIN} characters.`);
    run(() => signup(name.trim(), email.trim(), password));
  };

  const sendResetCode = useCallback(async () => {
    await requestPasswordReset(email.trim());
    setCooldown(RESEND_COOLDOWN);
    setOtp(EMPTY_OTP);
  }, [email, requestPasswordReset]);

  const handleForgot = (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError("Enter a valid email address.");
    run(async () => {
      await sendResetCode();
      setView("reset");
    });
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    run(async () => {
      await sendResetCode();
      otpRefs.current[0]?.focus();
    });
  };

  const handleReset = (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return setError("Enter the 6-digit code from your email.");
    if (password.length < PASSWORD_MIN) return setError(`Password must be at least ${PASSWORD_MIN} characters.`);
    run(() => resetPassword(email.trim(), code, password));
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (digit && index === 5) newPasswordRef.current?.focus();
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
    if (pasted.length === 6) newPasswordRef.current?.focus();
    else otpRefs.current[pasted.length]?.focus();
  };

  const titles = {
    login: "Log in",
    signup: "Create account",
    forgot: "Reset password",
    reset: "Reset password",
  };

  const emailField = (
    <Field label="Email address" htmlFor="auth-email">
      <Input
        id="auth-email"
        ref={view === "signup" ? undefined : firstFieldRef}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </Field>
  );

  const errorBox = error ? <Alert variant="danger">{error}</Alert> : null;

  const submitButton = (idle, busy) => (
    <Button type="submit" variant="primary" size="lg" block loading={loading}>
      {loading ? busy : idle}
    </Button>
  );

  return (
    <Modal open={isOpen} onClose={onClose} ariaLabel={titles[view]} className="auth-modal">
      {(view === "login" || view === "signup") && (
        <div className="auth-tabs" role="tablist" aria-label="Account">
          <button
            type="button"
            role="tab"
            aria-selected={view === "login"}
            className="auth-tabs__tab"
            onClick={() => switchView("login")}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "signup"}
            className="auth-tabs__tab"
            onClick={() => switchView("signup")}
          >
            Sign up
          </button>
        </div>
      )}

      {view === "login" && (
        <>
          <div className="auth-head">
            <h2>Welcome back</h2>
            <p>Log in with the email and password for your account.</p>
          </div>

          <form onSubmit={handleLogin} noValidate className="auth-form">
            {emailField}
            <Field
              label="Password"
              htmlFor="auth-password"
              labelAside={
                <button type="button" className="auth-link" onClick={() => switchView("forgot")}>
                  Forgot password?
                </button>
              }
            >
              <PasswordInput
                id="auth-password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                placeholder="Your password"
              />
            </Field>

            {errorBox}
            {submitButton("Log in", "Logging in…")}
          </form>

          <p className="auth-switch">
            New here?{" "}
            <button type="button" className="auth-link auth-link--accent" onClick={() => switchView("signup")}>
              Create an account
            </button>
          </p>
        </>
      )}

      {view === "signup" && (
        <>
          <div className="auth-head">
            <h2>Create your account</h2>
            <p>It takes a few seconds — just your name, email and a password.</p>
          </div>

          <form onSubmit={handleSignup} noValidate className="auth-form">
            <Field label="Full name" htmlFor="auth-name">
              <Input
                id="auth-name"
                ref={firstFieldRef}
                type="text"
                autoComplete="name"
                placeholder="Your name"
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            {emailField}
            <Field label="Password" htmlFor="auth-new-password" hint={`At least ${PASSWORD_MIN} characters.`}>
              <PasswordInput
                id="auth-new-password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="Create a password"
              />
            </Field>

            {errorBox}
            {submitButton("Create account", "Creating account…")}
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" className="auth-link auth-link--accent" onClick={() => switchView("login")}>
              Log in
            </button>
          </p>
        </>
      )}

      {view === "forgot" && (
        <>
          <div className="auth-head">
            <span className="ui-eyebrow">Forgot password</span>
            <h2>Reset your password</h2>
            <p>Enter your account email and we'll send you a 6-digit code to set a new password.</p>
          </div>

          <form onSubmit={handleForgot} noValidate className="auth-form">
            {emailField}
            {errorBox}
            {submitButton("Send reset code", "Sending code…")}
          </form>

          <div className="auth-meta">
            <button type="button" className="auth-link" onClick={() => switchView("login")} disabled={loading}>
              <LuArrowLeft aria-hidden="true" /> Back to log in
            </button>
          </div>
        </>
      )}

      {view === "reset" && (
        <>
          <div className="auth-head">
            <span className="ui-eyebrow">Check your inbox</span>
            <h2>Enter code &amp; new password</h2>
            <p>
              If an account exists for <strong>{email.trim()}</strong>, we've sent it a 6-digit code. Didn't get it?
              Check spam or resend below.
            </p>
          </div>

          <form onSubmit={handleReset} noValidate className="auth-form">
            <div className="auth-otp" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  className="ui-input auth-otp__box"
                  aria-label={`Digit ${i + 1}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={loading}
                />
              ))}
            </div>

            <Field label="New password" htmlFor="auth-reset-password" hint={`At least ${PASSWORD_MIN} characters.`}>
              <PasswordInput
                id="auth-reset-password"
                inputRef={newPasswordRef}
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="Create a new password"
              />
            </Field>

            {errorBox}
            {submitButton("Reset password & log in", "Saving…")}
          </form>

          <div className="auth-meta">
            <button type="button" className="auth-link" onClick={() => switchView("forgot")} disabled={loading}>
              <LuArrowLeft aria-hidden="true" /> Change email
            </button>
            <button type="button" className="auth-link" onClick={handleResend} disabled={loading || cooldown > 0}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default LoginModal;
