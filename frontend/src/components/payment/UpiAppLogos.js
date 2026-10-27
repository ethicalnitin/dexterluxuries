import React from "react";

export function UpiMark() {
  return <span className="pay-upi-mark">UPI</span>;
}

export function GPayLogo() {
  return (
    <span className="pay-logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      <span style={{ color: "#5F6368", fontWeight: 600 }}>Pay</span>
    </span>
  );
}

export function PhonePeLogo() {
  return (
    <span className="pay-logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22">
        <circle cx="12" cy="12" r="12" fill="#5F259F" />
        <text x="12" y="16.4" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#fff" fontFamily="'Noto Sans Devanagari','Nirmala UI',sans-serif">
          पे
        </text>
      </svg>
      <span style={{ color: "#5F259F", fontWeight: 700 }}>PhonePe</span>
    </span>
  );
}

export function PaytmLogo() {
  return (
    <span className="pay-logo" aria-hidden="true" style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.6px" }}>
      <span style={{ color: "#002E6E" }}>pay</span>
      <span style={{ color: "#00BAF2" }}>tm</span>
    </span>
  );
}
