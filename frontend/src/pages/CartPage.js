import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuArrowRight, LuMinus, LuPlus, LuShoppingCart, LuTrash2, LuUndo2 } from "react-icons/lu";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { quoteCart } from "../api/cart";
import { Alert, Badge, Button, StatusMessage } from "../components/ui";
import ProductImage from "../components/store/ProductImage";
import { MAX_ITEM_QUANTITY, cartCount, lineKey, toQuoteItems } from "../utils/cart";
import { formatINR, formatUSD } from "../utils/pricing";
import "./CartPage.css";

const QUOTE_DELAY_MS = 250;

const STATUS_TEXT = {
  unavailable: "Out of stock right now — remove it to check out.",
  not_found: "No longer sold in the store — remove it to check out.",
};

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function QuantityStepper({ name, quantity, onChange, disabled }) {
  return (
    <div className="cart-qty" role="group" aria-label={`Quantity of ${name}`}>
      <button
        type="button"
        className="cart-qty__btn"
        onClick={() => onChange(quantity - 1)}
        disabled={disabled || quantity <= 1}
        aria-label={`Decrease quantity of ${name}`}
      >
        <LuMinus aria-hidden="true" />
      </button>
      <output className="cart-qty__value" aria-live="polite">
        {quantity}
      </output>
      <button
        type="button"
        className="cart-qty__btn"
        onClick={() => onChange(quantity + 1)}
        disabled={disabled || quantity >= MAX_ITEM_QUANTITY}
        aria-label={`Increase quantity of ${name}`}
      >
        <LuPlus aria-hidden="true" />
      </button>
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated, requireAuth } = useAuth();
  const { items, loading, syncError, setQuantity, removeItem, restoreItem, syncFromQuote } = useCart();

  const quoteKey = JSON.stringify(toQuoteItems(items));
  const quoteItems = useMemo(() => JSON.parse(quoteKey), [quoteKey]);

  const [quote, setQuote] = useState({ key: null, data: null, byKey: new Map() });
  const [quoteStatus, setQuoteStatus] = useState("idle");
  const [quoteError, setQuoteError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (quoteItems.length === 0) {
      setQuoteStatus("idle");
      return undefined;
    }
    let cancelled = false;
    setQuoteStatus("loading");
    const timer = setTimeout(() => {
      quoteCart(quoteItems)
        .then((data) => {
          if (cancelled) return;
          const byKey = new Map(quoteItems.map((item, i) => [lineKey(item), data.items[i]]));
          setQuote({ key: JSON.stringify(quoteItems), data, byKey });
          setQuoteStatus("ready");
          syncFromQuote(data.items);
        })
        .catch((err) => {
          if (cancelled) return;
          setQuoteError(err.message);
          setQuoteStatus("error");
        });
    }, QUOTE_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [quoteItems, retryCount, syncFromQuote]);

  const current = quoteStatus === "ready" && quote.key === quoteKey ? quote.data : null;
  const count = cartCount(items);
  const hasBlockedLines = items.some((item) => {
    const line = quote.byKey.get(lineKey(item));
    return line && line.status !== "ok";
  });
  const pricesChanged = items.some((item) => {
    const line = quote.byKey.get(lineKey(item));
    return line && line.status !== "not_found" && typeof item.unitPrice === "number" && item.unitPrice !== line.unitPrice;
  });
  const canCheckout = Boolean(current && current.allAvailable);
  const pricedCount = current ? cartCount(current.items.filter((line) => line.status === "ok")) : count;

  const handleRemove = (item, index, name) => {
    removeItem(lineKey(item));
    setNotice({ text: `Removed ${name} from your cart.`, undo: () => restoreItem(item, index) });
  };

  const handleCheckout = () => {
    if (!canCheckout) return;
    syncFromQuote(current.items, { acceptPrices: true });
    requireAuth(() => navigate("/checkout"));
  };

  let body;
  if (items.length === 0 && loading) {
    body = <StatusMessage loading title="Loading your cart…" />;
  } else if (items.length === 0) {
    body = (
      <StatusMessage
        icon={<LuShoppingCart />}
        title="Your cart is empty"
        text="Browse the store, pick a plan and add it here. You can check out several products in one payment."
        action={
          <Button to="/" variant="primary" iconRight={<LuArrowRight />}>
            Browse products
          </Button>
        }
      />
    );
  } else {
    body = (
      <div className="cart-layout">
        <section aria-label="Items in your cart">
          <ul className="cart-lines">
            {items.map((item, index) => {
              const key = lineKey(item);
              const line = quote.byKey.get(key);
              const name = line?.productName || item.name || `Product #${item.productId}`;
              const planName = line?.planName || item.planName;
              const unitPrice = line && line.status !== "not_found" ? line.unitPrice : item.unitPrice;
              const blocked = line && line.status !== "ok";
              const priceChanged =
                line && line.status !== "not_found" && typeof item.unitPrice === "number" && item.unitPrice !== line.unitPrice;
              return (
                <li key={key} className={`cart-line${blocked ? " cart-line--blocked" : ""}`}>
                  <Link to={`/product/${item.productId}`} className="cart-line__thumb" tabIndex={-1} aria-hidden="true">
                    <ProductImage src={line?.image ?? item.image} name={name} />
                  </Link>
                  <div className="cart-line__info">
                    <Link to={`/product/${item.productId}`} className="cart-line__name">
                      {name}
                    </Link>
                    <span className="cart-line__meta">
                      {planName}
                      {typeof unitPrice === "number" ? ` · ${formatUSD(unitPrice)} each` : ""}
                    </span>
                    {blocked && (
                      <Badge variant="danger" className="cart-line__status">
                        {STATUS_TEXT[line.status]}
                      </Badge>
                    )}
                    {priceChanged && (
                      <span className="cart-line__changed">Price changed from {formatUSD(item.unitPrice)}</span>
                    )}
                  </div>
                  <div className="cart-line__actions">
                    <QuantityStepper
                      name={name}
                      quantity={item.quantity}
                      onChange={(q) => setQuantity(key, q)}
                      disabled={Boolean(blocked)}
                    />
                    <span className="cart-line__total ui-num">
                      {typeof unitPrice === "number" ? formatUSD(unitPrice * item.quantity) : "—"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<LuTrash2 />}
                      onClick={() => handleRemove(item, index, name)}
                      aria-label={`Remove ${name} from cart`}
                      className="cart-line__remove"
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="cart-summary" aria-label="Cart total">
          <h2 className="cart-summary__title">Order summary</h2>
          <dl className="cart-summary__rows">
            <div>
              <dt>Subtotal ({plural(pricedCount, "item")})</dt>
              <dd className="ui-num">{current ? formatUSD(current.subtotal) : "…"}</dd>
            </div>
            <div className="cart-summary__total">
              <dt>You pay by UPI</dt>
              <dd className="ui-num">{current ? `₹${formatINR(current.totalInr)}` : "…"}</dd>
            </div>
          </dl>
          <p className="cart-summary__note">Prices are listed in USD and charged in rupees at checkout.</p>

          {quoteStatus === "loading" && (
            <p className="cart-summary__checking" role="status">
              <span className="ui-spinner" aria-hidden="true" /> Checking today's prices…
            </p>
          )}
          {quoteStatus === "error" && (
            <Alert variant="danger">
              {quoteError}{" "}
              <button type="button" className="ui-link" onClick={() => setRetryCount((n) => n + 1)}>
                Try again
              </button>
            </Alert>
          )}
          {quoteStatus !== "loading" && hasBlockedLines && (
            <Alert variant="warning">Remove the items marked unavailable to check out.</Alert>
          )}
          {pricesChanged && quoteStatus !== "error" && (
            <Alert variant="info">Some prices changed since you added them. The totals use today's prices.</Alert>
          )}

          <Button variant="primary" size="lg" block disabled={!canCheckout} onClick={handleCheckout} iconRight={<LuArrowRight />}>
            {isAuthenticated ? "Checkout" : "Log in to check out"}
          </Button>
          <Button to="/" variant="ghost" block>
            Continue shopping
          </Button>
        </aside>
      </div>
    );
  }

  return (
    <div className="ui-container cart-page">
      <header className="cart-head">
        <h1 className="ui-title-page">Your cart</h1>
        {items.length > 0 && <p className="ui-muted">{plural(count, "item")}</p>}
      </header>

      {syncError && <Alert variant="warning">{syncError}</Alert>}
      {notice && (
        <div className="cart-notice" role="status">
          <span>{notice.text}</span>
          {notice.undo && (
            <Button
              variant="ghost"
              size="sm"
              icon={<LuUndo2 />}
              onClick={() => {
                notice.undo();
                setNotice(null);
              }}
            >
              Undo
            </Button>
          )}
        </div>
      )}
      {body}
    </div>
  );
}
