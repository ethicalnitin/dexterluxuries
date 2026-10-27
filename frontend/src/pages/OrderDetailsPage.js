import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LuArrowLeft, LuCheck, LuClock, LuPackageCheck, LuRefreshCw, LuSearchX, LuShieldCheck, LuXCircle } from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa6";
import theme from "../theme/theme";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { cancelOrder, getOrder, submitPayment } from "../api/orders";
import { Alert, Badge, Button, StatusMessage } from "../components/ui";
import CheckoutSteps from "../components/store/CheckoutSteps";
import PaymentTimer from "../components/payment/PaymentTimer";
import UpiPayment from "../components/payment/UpiPayment";
import { formatDateTime, itemsSummary, statusInfo, timelineLabel } from "../utils/orders";
import { formatINR, formatUSD } from "../utils/pricing";
import { whatsappUrl } from "../utils/whatsapp";
import "../components/payment/checkout.css";
import "./OrderDetailsPage.css";

const POLL_MS = 30 * 1000;

const STEP_BY_STATUS = { pending_payment: 1, payment_failed: 1, verifying: 2, paid: 3, fulfilled: 3 };

export default function OrderDetailsPage() {
  const { id } = useParams();
  const { authRequest } = useAuth();
  const { removeOrderedItems } = useCart();

  const [order, setOrder] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState("");
  const [cancelStep, setCancelStep] = useState("idle");
  const [cancelError, setCancelError] = useState("");

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (quiet) setRefreshing(true);
      else setLoadState("loading");
      try {
        const data = await getOrder(authRequest, id);
        setOrder(data.order);
        setLoadState("ready");
      } catch (err) {
        if (quiet) return;
        setLoadError(err.message);
        setLoadState(err.status === 404 ? "not_found" : "error");
      } finally {
        if (quiet) setRefreshing(false);
      }
    },
    [authRequest, id]
  );

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [order?.status]);

  const status = order?.status;
  useEffect(() => {
    if (status !== "verifying") return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load({ quiet: true });
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [status, load]);

  const handleWindowClosed = useCallback(() => load({ quiet: true }), [load]);

  const openWhatsApp = (extraLine) => {
    const lines = order
      ? [
          `Hi, I need help with my ${theme.brand.name} order.`,
          ``,
          `Order ref: ${order.orderRef}`,
          ...order.items.map((item) => `• ${item.productName} — ${item.planName}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`),
          `Amount: Rs. ${formatINR(order.totalInr)}`,
          order.payment.utr ? `UTR: ${order.payment.utr}` : null,
          `Account: ${order.email}`,
          extraLine || null,
        ]
      : [`Hi, I need help with an order on ${theme.brand.name}.`, extraLine || null];
    window.open(whatsappUrl(lines.filter((l) => l !== null).join("\n")), "_blank");
  };

  const handleSubmitUtr = async (utr) => {
    setSubmitting(true);
    setPayError("");
    try {
      const { order: updated } = await submitPayment(authRequest, order.id, utr);
      setOrder(updated);
      if (updated.source === "cart") removeOrderedItems(updated.items);
    } catch (err) {
      if (err.data?.order) setOrder(err.data.order);
      setPayError(
        err.status === 0
          ? `We couldn't reach the server, so your UTR (${utr}) wasn't recorded yet. Try again, or send it to us on WhatsApp.`
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setCancelStep("cancelling");
    setCancelError("");
    try {
      const { order: updated } = await cancelOrder(authRequest, order.id);
      setOrder(updated);
      setCancelStep("idle");
    } catch (err) {
      if (err.data?.order) setOrder(err.data.order);
      setCancelError(err.message);
      setCancelStep("idle");
    }
  };

  if (loadState === "loading" && !order) {
    return (
      <div className="pay-page">
        <StatusMessage loading title="Loading your order…" />
      </div>
    );
  }
  if (loadState === "not_found") {
    return (
      <div className="pay-page">
        <StatusMessage
          icon={<LuSearchX />}
          title="Order not found"
          text="This order doesn't exist or belongs to a different account. Check you're signed in with the account you ordered from."
          action={
            <Button to="/account/orders" variant="secondary">
              Your orders
            </Button>
          }
        />
      </div>
    );
  }
  if (loadState === "error" && !order) {
    return (
      <div className="pay-page">
        <StatusMessage
          icon={<LuRefreshCw />}
          title="We couldn't load this order"
          text={loadError}
          action={
            <Button variant="secondary" icon={<LuRefreshCw />} onClick={() => load()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  const info = statusInfo(order.status);
  const amountLabel = `₹${formatINR(order.totalInr)}`;
  const awaitingPayment = order.status === "pending_payment" || order.status === "payment_failed";
  const canRetry = order.status === "pending_payment" || order.payment.attemptsLeft > 0;
  const windowSeconds = order.expiresAt ? Math.round((new Date(order.expiresAt) - new Date(order.createdAt)) / 1000) : 0;

  const cancelControls = awaitingPayment && (
    <div className="order-cancel">
      {cancelStep === "idle" && (
        <Button variant="ghost" size="sm" icon={<LuXCircle />} onClick={() => setCancelStep("confirm")}>
          Cancel order
        </Button>
      )}
      {cancelStep !== "idle" && (
        <div className="order-cancel__confirm" role="group" aria-label="Confirm cancellation">
          <span>Cancel this order? Only do this if you haven't paid.</span>
          <Button variant="danger" size="sm" loading={cancelStep === "cancelling"} onClick={handleCancel}>
            Yes, cancel order
          </Button>
          <Button variant="ghost" size="sm" disabled={cancelStep === "cancelling"} onClick={() => setCancelStep("idle")}>
            Keep order
          </Button>
        </div>
      )}
      {cancelError && <Alert variant="danger">{cancelError}</Alert>}
    </div>
  );

  const statusPanel = {
    verifying: (
      <div className="pay-block pay-success" aria-live="polite">
        <span className="pay-success__icon order-icon--pending">
          <LuClock aria-hidden="true" />
        </span>
        <h2 className="pay-success__title">Payment submitted — we're checking it</h2>
        <p className="pay-success__text">
          We're matching UTR <strong className="ui-mono">{order.payment.utr}</strong> against our bank statement. This usually takes{" "}
          <strong>15–30 minutes</strong>. This page updates on its own.
        </p>
        <div className="order-actions">
          <Button variant="secondary" icon={<LuRefreshCw />} loading={refreshing} onClick={() => load({ quiet: true })}>
            Check status
          </Button>
          <Button variant="whatsapp" icon={<FaWhatsapp />} onClick={() => openWhatsApp("I've paid — please confirm my order.")}>
            Message us
          </Button>
        </div>
      </div>
    ),
    paid: (
      <div className="pay-block pay-success">
        <span className="pay-success__icon">
          <LuShieldCheck aria-hidden="true" />
        </span>
        <h2 className="pay-success__title">Payment confirmed</h2>
        <p className="pay-success__text">
          We've received {amountLabel}. Your access is being prepared and will be sent to <strong>{order.email}</strong>.
        </p>
        <Button variant="whatsapp" icon={<FaWhatsapp />} onClick={() => openWhatsApp("My payment is confirmed — when will my access arrive?")}>
          Message us
        </Button>
      </div>
    ),
    fulfilled: (
      <div className="pay-block pay-success">
        <span className="pay-success__icon">
          <LuPackageCheck aria-hidden="true" />
        </span>
        <h2 className="pay-success__title">Delivered</h2>
        <p className="pay-success__text">
          Your access was sent to <strong>{order.email}</strong>
          {order.fulfilledAt ? ` on ${formatDateTime(order.fulfilledAt)}` : ""}. Can't find it? Check spam, or message us.
        </p>
        <Button variant="whatsapp" icon={<FaWhatsapp />} onClick={() => openWhatsApp("I can't find my access details.")}>
          Message us
        </Button>
      </div>
    ),
    cancelled: (
      <div className="pay-block pay-success">
        <span className="pay-success__icon order-icon--neutral">
          <LuXCircle aria-hidden="true" />
        </span>
        <h2 className="pay-success__title">{order.cancelReason === "expired" ? "Payment window ended" : "Order cancelled"}</h2>
        <p className="pay-success__text">
          {order.cancelReason === "expired"
            ? "No UTR was submitted within 15 minutes, so this order was cancelled. If you've already paid, message us with your UTR and we'll sort it out."
            : "You cancelled this order. Nothing was charged by us."}
        </p>
        <div className="order-actions">
          <Button to="/" variant="primary">
            Shop again
          </Button>
          {order.cancelReason === "expired" && (
            <Button variant="whatsapp" icon={<FaWhatsapp />} onClick={() => openWhatsApp("I paid but my order's payment window ended. My UTR is: ")}>
              I already paid
            </Button>
          )}
        </div>
      </div>
    ),
  }[order.status];

  return (
    <div className="pay-page">
      <div className="pay-head">
        <div className="pay-head__title">
          <h1>Order {order.orderRef}</h1>
          <Badge variant={info.variant}>{info.label}</Badge>
        </div>
        {STEP_BY_STATUS[order.status] !== undefined && <CheckoutSteps current={STEP_BY_STATUS[order.status]} />}
      </div>

      <Link to="/account/orders" className="checkout-back order-back">
        <LuArrowLeft aria-hidden="true" /> All orders
      </Link>

      {order.status === "pending_payment" && (
        <Alert variant="success" className="order-placed">
          <strong>Order placed.</strong> Pay {amountLabel} by UPI within the time shown, then enter your UTR to confirm.
        </Alert>
      )}
      {order.status === "payment_failed" && (
        <Alert variant="danger">
          <strong>We couldn't find your payment:</strong> {order.payment.failureReason}{" "}
          {canRetry
            ? `If you've paid, check the UTR in your UPI app and enter it again below (${order.payment.attemptsLeft} ${
                order.payment.attemptsLeft === 1 ? "try" : "tries"
              } left).`
            : "Message us on WhatsApp with your payment screenshot and we'll check it by hand."}
        </Alert>
      )}

      <div className="pay-shell">
        <aside className="pay-side" aria-label="Order summary">
          <div className="pay-side__merchant">
            <img src={theme.brand.logo} alt="" width="40" height="40" />
            <div>
              <strong>{theme.brand.name}</strong>
              <span>Order {order.orderRef}</span>
            </div>
          </div>

          <div className="pay-side__amount">
            <span className="pay-side__muted">{awaitingPayment ? "Amount to pay" : "Order total"}</span>
            <strong>{amountLabel}</strong>
            {typeof order.subtotal === "number" && <span className="pay-side__muted">Listed at {formatUSD(order.subtotal)} · charged in INR</span>}
          </div>

          <dl className="pay-side__details">
            <div className="pay-side__items-row">
              <dt>{order.itemCount === 1 ? "1 item" : `${order.itemCount} items`}</dt>
              <dd>
                <ul className="pay-side__items">
                  {order.items.map((item) => (
                    <li key={`${item.productId}:${item.planName}`}>
                      <span>
                        <Link to={`/product/${item.productId}`} className="order-item-link">
                          {item.productName || `Product #${item.productId}`}
                        </Link>
                        <small>
                          {item.planName}
                          {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                        </small>
                      </span>
                      <span className="ui-num">₹{formatINR(item.lineTotalInr)}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt>Delivering to</dt>
              <dd>{order.email}</dd>
            </div>
            <div>
              <dt>Placed</dt>
              <dd>{formatDateTime(order.createdAt)}</dd>
            </div>
          </dl>

          {order.status === "pending_payment" && order.expiresAt && (
            <PaymentTimer deadline={new Date(order.expiresAt).getTime()} totalSeconds={windowSeconds} onExpire={handleWindowClosed} />
          )}

          <button type="button" className="pay-side__help" onClick={() => openWhatsApp()}>
            <FaWhatsapp aria-hidden="true" />
            Need help? Chat with us
          </button>
        </aside>

        <section className="pay-main">
          {awaitingPayment && canRetry ? (
            <UpiPayment
              amountInr={order.totalInr}
              orderRef={order.orderRef}
              note={itemsSummary(order.items)}
              onSubmit={handleSubmitUtr}
              submitting={submitting}
              error={payError}
              retry={order.status === "payment_failed"}
              onHelp={openWhatsApp}
            />
          ) : awaitingPayment ? (
            <div className="pay-block">
              <Button variant="whatsapp" size="lg" block icon={<FaWhatsapp />} onClick={() => openWhatsApp("My payment couldn't be verified.")}>
                Message us on WhatsApp
              </Button>
            </div>
          ) : (
            statusPanel
          )}

          {cancelControls && <div className="pay-block">{cancelControls}</div>}

          <div className="pay-block">
            <h2 className="pay-block__title">Order timeline</h2>
            <ol className="order-timeline">
              {order.history.map((entry, i) => (
                <li key={`${entry.status}-${i}`}>
                  <span className="order-timeline__dot" aria-hidden="true">
                    {i === order.history.length - 1 ? <LuCheck /> : null}
                  </span>
                  <span className="order-timeline__label">{timelineLabel(entry.status)}</span>
                  <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
