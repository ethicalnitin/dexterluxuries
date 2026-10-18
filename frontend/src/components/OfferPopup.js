import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Countdown from "react-countdown";
import { LuClock, LuArrowRight } from "react-icons/lu";
import { API_BASE } from "../config/api";
import { getOfferEnd, findBiggestDeal } from "../utils/offer";
import { formatPlanDuration } from "../utils/pricing";
import { Badge, Button, Modal, Price } from "./ui";
import ProductImage from "./store/ProductImage";
import "./OfferPopup.css";

/* ============================================================
   FIRST-VISIT OFFER POPUP — shown once per browser, a moment
   after a new visitor arrives. Edit the settings below.
============================================================ */
const OFFER = {
  enabled: true,
  // Change the version (e.g. "_v2") to show the popup again to everyone,
  // including people who already closed it.
  storageKey: "mkr_offer_popup_v1",
  delayMs: 1500,
  // Never interrupt checkout or the admin tool.
  hiddenOn: ["/payment", "/filedelivery"],
  eyebrow: "Limited-time offer",
  // "{pct}" is replaced with the store's real biggest discount.
  title: "Up to {pct}% off premium tools",
  fallbackTitle: "Today's sale is live",
  text: "Sale prices on premium subscriptions and tools. The offer ends when the timer runs out.",
};

function hasSeenOffer() {
  try {
    return localStorage.getItem(OFFER.storageKey) === "1";
  } catch {
    return false;
  }
}

function markOfferSeen() {
  try {
    localStorage.setItem(OFFER.storageKey, "1");
  } catch {
    // storage blocked (e.g. private mode) — it simply shows once per page load
  }
}

const pad = (n) => String(n).padStart(2, "0");

function OfferTimer({ end }) {
  return (
    <Countdown
      date={end}
      renderer={({ hours, minutes, seconds, completed }) =>
        completed ? null : (
          <div className="offer-timer" role="timer" aria-label={`Offer ends in ${hours} hours ${minutes} minutes`}>
            <span className="offer-timer__label">
              <LuClock aria-hidden="true" />
              Ends in
            </span>
            {[
              [hours, "hrs"],
              [minutes, "min"],
              [seconds, "sec"],
            ].map(([value, unit]) => (
              <span className="offer-timer__unit" key={unit} aria-hidden="true">
                <strong className="ui-mono">{pad(value)}</strong>
                <small>{unit}</small>
              </span>
            ))}
          </div>
        )
      }
    />
  );
}

export default function OfferPopup() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [eligible] = useState(() => OFFER.enabled && !hasSeenOffer());
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [deal, setDeal] = useState(undefined); // undefined = loading, null = none
  const [end] = useState(getOfferEnd);

  // Look up the biggest real discount to feature (first-time visitors only).
  useEffect(() => {
    if (!eligible) return undefined;
    let cancelled = false;
    fetch(`${API_BASE}/products`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => !cancelled && setDeal(findBiggestDeal(Array.isArray(data) ? data : [])))
      .catch(() => !cancelled && setDeal(null));
    return () => {
      cancelled = true;
    };
  }, [eligible]);

  // Open after a short delay, once product data has arrived (or after a few
  // seconds without it), and never on checkout/admin pages.
  useEffect(() => {
    if (!eligible || shown || OFFER.hiddenOn.includes(pathname)) return undefined;
    const ready = deal !== undefined;
    const t = setTimeout(() => {
      if (!ready) setDeal((d) => (d === undefined ? null : d));
      setOpen(true);
      setShown(true);
      markOfferSeen();
    }, ready ? OFFER.delayMs : OFFER.delayMs + 3500);
    return () => clearTimeout(t);
  }, [eligible, shown, pathname, deal]);

  const close = useCallback(() => setOpen(false), []);

  if (!eligible) return null;

  const title = deal ? OFFER.title.replace("{pct}", deal.pricing.discountPct) : OFFER.fallbackTitle;
  const dealHref = deal ? `/product/${deal.product.id}` : "/";

  const browseAll = () => {
    close();
    if (pathname === "/") document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
    else navigate("/");
  };

  return (
    <Modal
      open={open}
      onClose={close}
      eyebrow={
        <Badge variant="warning" icon={<LuClock aria-hidden="true" />}>
          {OFFER.eyebrow}
        </Badge>
      }
      title={title}
      description={OFFER.text}
      className="offer-modal"
    >
      <OfferTimer end={end} />

      {deal && (
        <Link to={dealHref} className="offer-deal" onClick={close}>
          <span className="offer-deal__media">
            <ProductImage src={deal.product.image} name={deal.product.name} />
          </span>
          <span className="offer-deal__info">
            <span className="offer-deal__label">Biggest deal right now</span>
            <span className="offer-deal__name">{deal.product.name}</span>
            <span className="offer-deal__plan">{formatPlanDuration(deal.plan)}</span>
            <span className="offer-deal__price">
              <Price amount={deal.pricing.price} strike={deal.pricing.strike} size="sm" />
              <Badge variant="success">-{deal.pricing.discountPct}%</Badge>
            </span>
          </span>
        </Link>
      )}

      <div className="offer-actions">
        {deal ? (
          <Button to={dealHref} variant="primary" size="lg" block onClick={close} iconRight={<LuArrowRight />}>
            Grab this deal
          </Button>
        ) : (
          <Button variant="primary" size="lg" block onClick={browseAll} iconRight={<LuArrowRight />}>
            Shop the sale
          </Button>
        )}
        {deal && (
          <Button variant="secondary" size="lg" block onClick={browseAll}>
            Browse all products
          </Button>
        )}
        <button type="button" className="offer-dismiss" onClick={close}>
          No thanks
        </button>
      </div>
    </Modal>
  );
}
