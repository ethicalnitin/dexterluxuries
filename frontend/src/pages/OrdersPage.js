import React, { useEffect, useState } from "react";
import { LuPackage, LuShieldCheck, LuCheck } from "react-icons/lu";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import theme from "../theme/theme";
import { Badge, Container, StatusMessage } from "../components/ui";
import "./OrdersPage.css";

function timeAgo(timestamp) {
  if (!timestamp) return "Just now";
  const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
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

// Deterministic avatar hue per row, purely cosmetic — keeps each avatar
// visually distinct without any extra data.
function avatarHue(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Re-render every 30s so timeAgo() stays fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // ── Derived stats — intentionally only a recency signal, nothing else ──
  const now = Date.now();
  const lastHour = orders.filter((o) => o.createdAt && now - o.createdAt.toMillis() < 3_600_000);

  return (
    <Container narrow className="orders">
      <header className="orders__header">
        <div>
          <h1 className="ui-title-page">Recent orders</h1>
          <p className="ui-muted">Live feed of verified purchases · updates in real time</p>
        </div>
        <span className="orders__live">
          <span className="orders__live-dot" aria-hidden="true" />
          Live
        </span>
      </header>

      {/* Only a recency signal — no total count, no product count. */}
      <div className="orders__stat">
        <span className="orders__stat-value ui-mono">{lastHour.length}</span>
        <span className="ui-muted ui-small">Orders in the last hour</span>
      </div>

      {loading ? (
        <StatusMessage loading title="Loading orders…" />
      ) : orders.length === 0 ? (
        <StatusMessage icon={<LuPackage />} title="No orders yet" text="Be the first!" />
      ) : (
        <ol className="orders__feed">
          {orders.map((order, i) => {
            const email = order.maskedEmail || maskEmail(order.email) || "—";
            const hue = avatarHue(email);
            return (
              <li key={order.id} className={`orders__row${i === 0 ? " orders__row--new" : ""}`}>
                <span
                  className="orders__avatar"
                  aria-hidden="true"
                  style={{ background: `hsl(${hue}, 55%, 45%)` }}
                >
                  {email[0]?.toUpperCase() || "?"}
                </span>
                <div className="orders__identity">
                  <span className="orders__email">{email}</span>
                  <span className="orders__product">
                    {order.productName || "—"}
                    {order.planDuration && <Badge>{order.planDuration}</Badge>}
                  </span>
                </div>
                <Badge variant="success" icon={<LuCheck aria-hidden="true" />}>
                  Delivered
                </Badge>
                <span className="orders__time">{timeAgo(order.createdAt)}</span>
              </li>
            );
          })}
        </ol>
      )}

      <p className="orders__footer">
        <LuShieldCheck aria-hidden="true" />
        All orders are verified and fulfilled by {theme.brand.name}
      </p>
    </Container>
  );
}
