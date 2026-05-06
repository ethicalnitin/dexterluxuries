import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import "./OrdersPage.css";

function timeAgo(timestamp) {
  if (!timestamp) return "Just now";
  const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
  if (seconds < 60)   return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function PulseDot() {
  return (
    <span className="op-pulse-wrap">
      <span className="op-pulse-ring" />
      <span className="op-pulse-dot" />
    </span>
  );
}

// Mask email: j***@gmail.com
function maskEmail(email) {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user[0]}***@${domain}`;
}

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

  // ── Derived stats ─────────────────────────────────────────────────────────
  const now       = Date.now();
  const lastHour  = orders.filter(o => o.createdAt && now - o.createdAt.toMillis() < 3_600_000);
  const today     = orders.filter(o => o.createdAt && now - o.createdAt.toMillis() < 86_400_000);
  const products  = [...new Set(orders.map(o => o.productName).filter(Boolean))].length;

  return (
    <div className="op-wrap">

      {/* ── Header ── */}
      <div className="op-header">
        <div className="op-header-left">
          <div className="op-brand">
            <span className="op-brand-dexter">DEXTER</span>
            <span className="op-brand-lux">LUXURIES</span>
          </div>
          <h1 className="op-title">Recent Orders</h1>
          <p className="op-sub">Live feed of verified purchases · updates in real time</p>
        </div>
        <div className="op-live-badge">
          <PulseDot />
          <span>Live</span>
        </div>
      </div>

      {/* ── Stats bar — NO total count ── */}
      <div className="op-stats">
        <div className="op-stat">
          <div className="op-stat-number op-stat-hot">{lastHour.length}</div>
          <div className="op-stat-label">Last Hour</div>
        </div>
        <div className="op-stat-div" />
        <div className="op-stat">
          <div className="op-stat-number">{today.length}</div>
          <div className="op-stat-label">Today</div>
        </div>
        <div className="op-stat-div" />
        <div className="op-stat">
          <div className="op-stat-number">{products}</div>
          <div className="op-stat-label">Products</div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="op-table-wrap">
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
          <table className="op-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const isNew    = i === 0;
                const isHot    = order.createdAt && now - order.createdAt.toMillis() < 3_600_000;
                const email    = order.maskedEmail || maskEmail(order.email) || "—";
                const initial  = email[0]?.toUpperCase() || "?";

                return (
                  <tr key={order.id} className={`op-row ${isNew ? "op-row-new" : ""}`}>
                    <td className="op-td-num">
                      {isHot && <span className="op-hot-dot" title="Ordered in last hour" />}
                      {orders.length - i}
                    </td>
                    <td>
                      <div className="op-email-cell">
                        <div className="op-avatar" data-initial={initial}>{initial}</div>
                        <span className="op-email">{email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="op-product">{order.productName || "—"}</span>
                    </td>
                    <td>
                      {order.planDuration
                        ? <span className="op-plan-badge">{order.planDuration}</span>
                        : <span className="op-plan-empty">—</span>}
                    </td>
                    <td>
                      <span className="op-status-badge">
                        <span className="op-status-dot" />
                        Delivered
                      </span>
                    </td>
                    <td className="op-time">{timeAgo(order.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="op-footer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        All orders are verified and fulfilled by Dexter Luxuries
      </div>
    </div>
  );
}