import React, { useCallback, useEffect, useState } from "react";
import { LuCheck, LuMail, LuPackageCheck, LuReceipt, LuRefreshCw, LuX } from "react-icons/lu";
import { useAuth } from "../../pages/AuthContext";
import { adminListOrders, adminSetOrderStatus } from "../../api/orders";
import { Alert, Badge, Button, Input, StatusMessage } from "../ui";
import { formatDateTime, statusInfo } from "../../utils/orders";
import { formatINR } from "../../utils/pricing";
import "./AdminOrders.css";

const TABS = [
  { status: "verifying", label: "To verify", empty: "No payments are waiting to be checked." },
  { status: "paid", label: "To deliver", empty: "No paid orders are waiting for delivery." },
  { status: "", label: "All recent", empty: "No orders yet." },
];

const DEFAULT_FAILURE = "We couldn't find a payment with this UTR for this amount.";

export default function AdminOrders({ onUseForDelivery }) {
  const { authRequest } = useAuth();
  const [tab, setTab] = useState("verifying");
  const [orders, setOrders] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [failing, setFailing] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => {
    setState("loading");
    adminListOrders(authRequest, tab || undefined)
      .then((data) => {
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setState("ready");
      })
      .catch((err) => {
        setError(err.message);
        setState("error");
      });
  }, [authRequest, tab]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (order, status, reason) => {
    setBusyId(order.id);
    setNotice(null);
    try {
      const { order: updated } = await adminSetOrderStatus(authRequest, order.id, status, reason);
      setOrders((list) => (tab && updated.status !== tab ? list.filter((o) => o.id !== updated.id) : list.map((o) => (o.id === updated.id ? updated : o))));
      setNotice({ variant: "success", text: `${updated.orderRef}: ${statusInfo(updated.status).label.toLowerCase()}.` });
      setFailing(null);
    } catch (err) {
      setNotice({ variant: "danger", text: `${order.orderRef}: ${err.message}` });
      if (err.data?.order) setOrders((list) => list.map((o) => (o.id === order.id ? err.data.order : o)));
    } finally {
      setBusyId(null);
    }
  };

  const activeTab = TABS.find((t) => t.status === tab);

  return (
    <section className="admin__card admin-orders" aria-labelledby="admin-orders-title">
      <header className="admin__header admin-orders__header">
        <span className="ui-icon-tile">
          <LuReceipt aria-hidden="true" />
        </span>
        <div>
          <h2 id="admin-orders-title" className="admin__title">
            Customer orders
          </h2>
          <p className="ui-muted ui-small">Check each UTR in the bank app, then record what you found.</p>
        </div>
        <Button variant="ghost" size="sm" iconOnly onClick={load} aria-label="Refresh orders" title="Refresh">
          <LuRefreshCw />
        </Button>
      </header>

      <div className="admin__body">
        <div className="admin-orders__tabs" role="tablist" aria-label="Order queue">
          {TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={tab === t.status}
              className="admin-orders__tab"
              onClick={() => {
                setTab(t.status);
                setFailing(null);
                setNotice(null);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {notice && <Alert variant={notice.variant}>{notice.text}</Alert>}

        {state === "loading" && <StatusMessage loading title="Loading orders…" />}
        {state === "error" && (
          <Alert variant="danger">
            {error}{" "}
            <button type="button" className="ui-link" onClick={load}>
              Try again
            </button>
          </Alert>
        )}
        {state === "ready" && orders.length === 0 && <p className="ui-muted ui-small">{activeTab.empty}</p>}

        {state === "ready" && orders.length > 0 && (
          <ul className="admin-orders__list">
            {orders.map((order) => {
              const info = statusInfo(order.status);
              const busy = busyId === order.id;
              return (
                <li key={order.id} className="admin-order" aria-label={`Order ${order.orderRef}`}>
                  <div className="admin-order__head">
                    <strong className="ui-mono">{order.orderRef}</strong>
                    <Badge variant={info.variant}>{info.label}</Badge>
                    <span className="admin-order__amount ui-num">₹{formatINR(order.totalInr)}</span>
                  </div>
                  <dl className="admin-order__details">
                    <div>
                      <dt>UTR</dt>
                      <dd className="ui-mono">{order.payment.utr || "—"}</dd>
                    </div>
                    <div>
                      <dt>Deliver to</dt>
                      <dd>{order.email}</dd>
                    </div>
                    <div>
                      <dt>Account</dt>
                      <dd>{order.account?.email || "—"}</dd>
                    </div>
                    <div>
                      <dt>Placed</dt>
                      <dd>{formatDateTime(order.createdAt)}</dd>
                    </div>
                  </dl>
                  <ul className="admin-order__items">
                    {order.items.map((item) => (
                      <li key={`${item.productId}:${item.planName}`}>
                        {item.productName} — {item.planName}
                        {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                      </li>
                    ))}
                  </ul>
                  {order.payment.failureReason && <p className="admin-order__reason">Told customer: {order.payment.failureReason}</p>}

                  {failing?.id === order.id ? (
                    <form
                      className="admin-order__fail"
                      onSubmit={(e) => {
                        e.preventDefault();
                        setStatus(order, "payment_failed", failing.reason.trim());
                      }}
                    >
                      <label className="ui-label" htmlFor={`fail-${order.id}`}>
                        Reason shown to the customer
                      </label>
                      <Input
                        id={`fail-${order.id}`}
                        value={failing.reason}
                        maxLength={200}
                        onChange={(e) => setFailing({ id: order.id, reason: e.target.value })}
                      />
                      <div className="admin-order__actions">
                        <Button type="submit" variant="danger" size="sm" loading={busy} disabled={!failing.reason.trim()}>
                          Mark not received
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setFailing(null)} disabled={busy}>
                          Back
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="admin-order__actions">
                      {(order.status === "verifying" || order.status === "payment_failed") && (
                        <Button variant="success" size="sm" icon={<LuCheck />} loading={busy} onClick={() => setStatus(order, "paid")}>
                          Payment received
                        </Button>
                      )}
                      {order.status === "verifying" && (
                        <Button variant="secondary" size="sm" icon={<LuX />} disabled={busy} onClick={() => setFailing({ id: order.id, reason: DEFAULT_FAILURE })}>
                          Not received
                        </Button>
                      )}
                      {order.status === "paid" && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<LuMail />}
                            onClick={() =>
                              onUseForDelivery({
                                email: order.email,
                                productName: order.items.map((i) => i.productName).join(", "),
                                planDuration: order.items.map((i) => (i.quantity > 1 ? `${i.planName} × ${i.quantity}` : i.planName)).join(", "),
                              })
                            }
                          >
                            Fill delivery email
                          </Button>
                          <Button variant="success" size="sm" icon={<LuPackageCheck />} loading={busy} onClick={() => setStatus(order, "fulfilled")}>
                            Mark delivered
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
