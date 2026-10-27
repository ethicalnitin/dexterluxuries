import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LuArrowLeft, LuArrowRight, LuLock, LuRefreshCw, LuShoppingCart } from "react-icons/lu";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { quoteCart } from "../api/cart";
import { placeOrder } from "../api/orders";
import { Alert, Button, Field, Input, StatusMessage } from "../components/ui";
import ProductImage from "../components/store/ProductImage";
import CheckoutSteps from "../components/store/CheckoutSteps";
import { isValidEmail } from "../utils/email";
import { newCheckoutKey } from "../utils/orders";
import { formatINR, formatUSD } from "../utils/pricing";
import { cartCount, toQuoteItems } from "../utils/cart";
import "../components/payment/checkout.css";
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authRequest } = useAuth();
  const { items: cartItems, loading: cartLoading } = useCart();

  const buyNowItems = location.state?.source === "buy_now" && Array.isArray(location.state.items) ? location.state.items : null;
  const source = buyNowItems ? "buy_now" : "cart";
  const items = buyNowItems || cartItems;

  const quoteKey = JSON.stringify(toQuoteItems(items));
  const quoteItems = useMemo(() => JSON.parse(quoteKey), [quoteKey]);

  const [quote, setQuote] = useState(null);
  const [quoteStatus, setQuoteStatus] = useState("loading");
  const [quoteError, setQuoteError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [email, setEmail] = useState(user?.email || "");
  const [emailError, setEmailError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [notice, setNotice] = useState("");
  const [checkoutKey] = useState(newCheckoutKey);

  useEffect(() => {
    if (quoteItems.length === 0) return undefined;
    let cancelled = false;
    setQuoteStatus("loading");
    quoteCart(quoteItems)
      .then((data) => {
        if (cancelled) return;
        setQuote(data);
        setQuoteStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setQuoteError(err.message);
        setQuoteStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [quoteItems, attempt]);

  const lines = quote ? quote.items : [];
  const blocked = lines.filter((line) => line.status !== "ok");
  const canPlace = quoteStatus === "ready" && quote.allAvailable && !placing;
  const backTo = source === "buy_now" && items[0] ? `/product/${items[0].productId}` : "/cart";
  const backLabel = source === "buy_now" ? "Back to product" : "Back to cart";

  const handlePlaceOrder = async () => {
    if (!canPlace) return;
    const delivery = email.trim();
    if (!isValidEmail(delivery)) {
      setEmailError("Enter the email address that should receive access.");
      return;
    }
    setEmailError("");
    setPlaceError("");
    setNotice("");
    setPlacing(true);
    try {
      const { order } = await placeOrder(authRequest, {
        items: toQuoteItems(lines),
        email: delivery,
        expectedTotalInr: quote.totalInr,
        idempotencyKey: checkoutKey,
        source,
      });
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (err) {
      setPlacing(false);
      if (err.status === 409 && err.data?.quote) {
        setQuote(err.data.quote);
        setNotice(err.message);
        return;
      }
      setPlaceError(err.message);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pay-page">
        {cartLoading && !buyNowItems ? (
          <StatusMessage loading title="Loading your cart…" />
        ) : (
          <StatusMessage
            icon={<LuShoppingCart />}
            title="Nothing to check out"
            text="Your cart is empty. Add a plan from the store, then come back here to check out."
            action={
              <Button to="/" variant="primary" iconRight={<LuArrowRight />}>
                Browse products
              </Button>
            }
          />
        )}
      </div>
    );
  }

  const count = cartCount(lines.length ? lines : items);

  return (
    <div className="pay-page">
      <div className="pay-head">
        <div className="pay-head__title">
          <h1>Review your order</h1>
          <span className="pay-head__secure">
            <LuLock aria-hidden="true" />
            Secure checkout
          </span>
        </div>
        <CheckoutSteps current={0} />
      </div>

      <Link to={backTo} className="checkout-back">
        <LuArrowLeft aria-hidden="true" /> {backLabel}
      </Link>

      <div className="checkout-layout">
        <section className="checkout-panel" aria-labelledby="checkout-items-title">
          <h2 id="checkout-items-title" className="checkout-panel__title">
            Items ({count})
          </h2>

          {quoteStatus === "loading" && !quote && <StatusMessage loading title="Checking today's prices…" />}
          {quoteStatus === "error" && (
            <StatusMessage
              icon={<LuRefreshCw />}
              title="We couldn't price your order"
              text={quoteError}
              action={
                <Button variant="secondary" icon={<LuRefreshCw />} onClick={() => setAttempt((n) => n + 1)}>
                  Try again
                </Button>
              }
            />
          )}

          {quote && (
            <ul className="checkout-lines">
              {lines.map((line) => (
                <li
                  key={`${line.productId}:${line.planIndex}:${line.planName}`}
                  className={`checkout-line${line.status !== "ok" ? " checkout-line--blocked" : ""}`}
                >
                  <span className="checkout-line__thumb">
                    <ProductImage src={line.image} name={line.productName || ""} />
                  </span>
                  <span className="checkout-line__info">
                    <strong>{line.productName || `Product #${line.productId}`}</strong>
                    <span>
                      {line.planName}
                      {typeof line.unitPrice === "number" ? ` · ${formatUSD(line.unitPrice)} × ${line.quantity}` : ""}
                    </span>
                    {line.status !== "ok" && (
                      <span className="checkout-line__problem">
                        {line.status === "unavailable" ? "Out of stock right now" : "No longer sold in the store"}
                      </span>
                    )}
                  </span>
                  <span className="checkout-line__total ui-num">
                    {line.lineTotalInr ? `₹${formatINR(line.lineTotalInr)}` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="checkout-panel checkout-summary" aria-label="Order total">
          <h2 className="checkout-panel__title">Order total</h2>
          <dl className="checkout-summary__rows">
            <div>
              <dt>Subtotal</dt>
              <dd className="ui-num">{quote ? formatUSD(quote.subtotal) : "…"}</dd>
            </div>
            <div className="checkout-summary__total">
              <dt>You pay by UPI</dt>
              <dd className="ui-num">{quote ? `₹${formatINR(quote.totalInr)}` : "…"}</dd>
            </div>
          </dl>
          <p className="checkout-summary__note">Prices are checked again when you place the order. Charged in rupees.</p>

          <Field
            label="Deliver access to"
            htmlFor="checkout-email"
            error={emailError}
            hint="Where your access details are sent once the payment is verified."
          >
            <Input
              id="checkout-email"
              type="email"
              autoComplete="email"
              value={email}
              invalid={Boolean(emailError)}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
            />
          </Field>

          {notice && <Alert variant="warning">{notice}</Alert>}
          {blocked.length > 0 && (
            <Alert variant="danger">
              {blocked.length === 1 ? "One item can't be bought right now." : "Some items can't be bought right now."}{" "}
              <Link to={backTo} className="ui-link">
                {source === "buy_now" ? "Choose another plan" : "Update your cart"}
              </Link>
            </Alert>
          )}
          {placeError && <Alert variant="danger">{placeError}</Alert>}

          <Button variant="primary" size="lg" block disabled={!canPlace} loading={placing} onClick={handlePlaceOrder} iconRight={<LuArrowRight />}>
            {quote && quote.allAvailable ? `Place order — ₹${formatINR(quote.totalInr)}` : "Place order"}
          </Button>
          <p className="checkout-summary__note">
            Next, you'll pay by UPI and enter the 12-digit UTR from your payment receipt. Unpaid orders are cancelled after 15
            minutes.
          </p>
        </aside>
      </div>
    </div>
  );
}
