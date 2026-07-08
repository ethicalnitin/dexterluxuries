import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";

function timeAgo(timestamp) {
  if (!timestamp) return "Just now";
  const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
  if (seconds < 60)   return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Mask email: j***@gmail.com
function maskEmail(email) {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user[0]}***@${domain}`;
}

// Deterministic avatar gradient angle per row, purely cosmetic —
// keeps each avatar visually distinct without any extra data.
function avatarHue(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

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
    --text-faint: rgba(244,242,255,0.36);
    --grad: linear-gradient(92deg, var(--violet) 0%, var(--cyan) 100%);
    --success: #34D399;
  }

  *, *::before, *::after { box-sizing: border-box; }

  .op-wrap {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    padding: 70px 24px 100px;
    position: relative;
    overflow: hidden;
  }

  .op-wrap::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 55% 40% at 20% 0%, rgba(139,92,246,0.14) 0%, transparent 65%),
      radial-gradient(ellipse 40% 35% at 90% 15%, rgba(34,211,238,0.08) 0%, transparent 60%);
    pointer-events: none;
  }

  .op-inner {
    max-width: 880px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  /* ── Header ── */
  .op-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 36px;
    flex-wrap: wrap;
  }

  .op-brand {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 14px;
  }

  .op-brand-dexter {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--text);
  }

  .op-brand-lux {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    background: var(--grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .op-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(1.7rem, 3.4vw, 2.3rem);
    font-weight: 700;
    letter-spacing: -0.6px;
    margin-bottom: 8px;
  }

  .op-sub {
    font-size: 14px;
    color: var(--text-dim);
    font-weight: 300;
    line-height: 1.5;
  }

  .op-live-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.3);
    color: var(--success);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.4px;
    padding: 8px 16px;
    border-radius: 100px;
    flex-shrink: 0;
  }

  .op-pulse-wrap {
    position: relative;
    width: 8px;
    height: 8px;
    display: inline-flex;
  }

  .op-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success);
    position: relative;
    z-index: 1;
  }

  .op-pulse-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: rgba(52,211,153,0.4);
    animation: pulseRing 1.8s ease-out infinite;
  }

  @keyframes pulseRing {
    0%   { transform: scale(0.6); opacity: 0.8; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  /* ── Stats ── */
  .op-stats {
    display: flex;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 28px;
  }

  .op-stat {
    flex: 1;
    text-align: center;
    padding: 22px 12px;
  }

  .op-stat-div {
    width: 1px;
    background: var(--border);
  }

  .op-stat-number {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.7rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1;
    margin-bottom: 6px;
  }

  .op-stat-hot {
    background: var(--grad);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .op-stat-label {
    font-size: 10.5px;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--text-faint);
    font-weight: 600;
  }

  /* ── Feed ── */
  .op-feed {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .op-row {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 16px 18px;
    animation: rowIn 0.5s ease both;
    transition: background 0.2s, border-color 0.2s;
  }

  .op-row:hover {
    background: var(--surface-hover);
    border-color: rgba(139,92,246,0.28);
  }

  .op-row-new {
    border-color: rgba(139,92,246,0.4);
    box-shadow: 0 0 0 1px rgba(139,92,246,0.12), 0 8px 28px rgba(139,92,246,0.1);
  }

  @keyframes rowIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .op-avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #0A0A13;
    flex-shrink: 0;
  }

  .op-identity {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .op-email {
    font-size: 13.5px;
    color: var(--text);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .op-product-line {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-dim);
    font-weight: 300;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .op-plan-badge {
    display: inline-flex;
    align-items: center;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.3px;
    color: var(--violet-soft);
    background: rgba(139,92,246,0.12);
    border: 1px solid rgba(139,92,246,0.25);
    padding: 2px 9px;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .op-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--success);
    white-space: nowrap;
  }

  .op-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--success);
    flex-shrink: 0;
  }

  .op-time {
    font-size: 11.5px;
    color: var(--text-faint);
    font-weight: 400;
    white-space: nowrap;
    text-align: right;
  }

  /* ── Empty / loading ── */
  .op-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 80px 24px;
    color: var(--text-dim);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    font-size: 14px;
    font-weight: 300;
  }

  .op-empty-icon { font-size: 32px; opacity: 0.7; }

  .op-spinner {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid var(--border);
    border-top-color: var(--violet);
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Footer ── */
  .op-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 32px;
    font-size: 12px;
    color: var(--text-faint);
    font-weight: 300;
  }

  .op-footer svg { color: var(--violet-soft); flex-shrink: 0; }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .op-row {
      grid-template-columns: auto 1fr;
      grid-template-areas:
        "avatar identity"
        "status time";
      row-gap: 10px;
    }
    .op-avatar { grid-area: avatar; }
    .op-identity { grid-area: identity; }
    .op-status-badge { grid-area: status; }
    .op-time { grid-area: time; text-align: left; }
  }
`;

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Re-render every 30s so timeAgo() stays fresh
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // ── Derived stats — intentionally only a recency signal, nothing else ──
  const now      = Date.now();
  const lastHour = orders.filter(o => o.createdAt && now - o.createdAt.toMillis() < 3_600_000);

  return (
    <>
      <style>{style}</style>
      <div className="op-wrap">
        <div className="op-inner">

          {/* ── Header ── */}
          <div className="op-header">
            <div>
              <div className="op-brand">
                <span className="op-brand-dexter">DEXTER</span>
                <span className="op-brand-lux">LUXURIES</span>
              </div>
              <h1 className="op-title">Recent Orders</h1>
              <p className="op-sub">Live feed of verified purchases · updates in real time</p>
            </div>
            <div className="op-live-badge">
              <span className="op-pulse-wrap">
                <span className="op-pulse-ring" />
                <span className="op-pulse-dot" />
              </span>
              <span>Live</span>
            </div>
          </div>

          {/* ── Stats bar — only recency signal, no total count, no product count ── */}
          <div className="op-stats">
            <div className="op-stat">
              <div className="op-stat-number op-stat-hot">{lastHour.length}</div>
              <div className="op-stat-label">Orders In The Last Hour</div>
            </div>
          </div>

          {/* ── Feed ── */}
          {loading ? (
            <div className="op-empty">
              <div className="op-spinner" />
              <p>Loading orders…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="op-empty">
              <div className="op-empty-icon">📦</div>
              <p>No orders yet. Be the first!</p>
            </div>
          ) : (
            <div className="op-feed">
              {orders.map((order, i) => {
                const isNew   = i === 0;
                const email   = order.maskedEmail || maskEmail(order.email) || "—";
                const initial = email[0]?.toUpperCase() || "?";
                const hue     = avatarHue(email);

                return (
                  <div
                    key={order.id}
                    className={`op-row ${isNew ? "op-row-new" : ""}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div
                      className="op-avatar"
                      style={{ background: `linear-gradient(135deg, hsl(${hue},70%,62%), hsl(${(hue + 45) % 360},75%,58%))` }}
                    >
                      {initial}
                    </div>

                    <div className="op-identity">
                      <span className="op-email">{email}</span>
                      <span className="op-product-line">
                        {order.productName || "—"}
                        {order.planDuration && <span className="op-plan-badge">{order.planDuration}</span>}
                      </span>
                    </div>

                    <span className="op-status-badge">
                      <span className="op-status-dot" />
                      Delivered
                    </span>

                    <span className="op-time">{timeAgo(order.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="op-footer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            All orders are verified and fulfilled by ChartVault
          </div>

        </div>
      </div>
    </>
  );
}