import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuLock,
  LuZap,
  LuShieldCheck,
  LuHeadphones,
  LuGlobe,
  LuBadgeCheck,
  LuPackage,
  LuRefreshCw,
  LuArrowRight,
} from "react-icons/lu";
import { API_BASE } from "../config/api";
import {
  Accordion,
  Button,
  CtaPanel,
  FeatureGrid,
  Section,
  SectionHeader,
  StatusMessage,
} from "../components/ui";
import ProductCard from "../components/store/ProductCard";
import "./Homepage.css";

/* ============================================================
   HOMEPAGE — hero, weekly top picks, filterable catalog, why-us,
   checkout guarantees, FAQ. Header/footer come from App.js.
============================================================ */

const trustItems = [
  { label: "Encrypted checkout", Icon: LuLock },
  { label: "Instant delivery", Icon: LuZap },
  { label: "Verified products", Icon: LuShieldCheck },
  { label: "Human support", Icon: LuHeadphones },
  { label: "Worldwide checkout", Icon: LuGlobe },
];

const assurances = [
  { label: "License", title: "Verified", text: "Checked before fulfillment", Icon: LuBadgeCheck },
  { label: "Payment", title: "Encrypted", text: "Handled by our processor", Icon: LuLock },
  { label: "Delivery", title: "Instant", text: "Access issued on payment", Icon: LuZap },
];

const valueProps = [
  {
    title: "Vetted before listing",
    text: "Every product is checked against its source and licensing terms before it goes live on the store.",
    Icon: LuShieldCheck,
  },
  {
    title: "Delivered the moment you pay",
    text: "No waiting on manual fulfillment — access details are issued automatically once payment clears.",
    Icon: LuZap,
  },
  {
    title: "Support that actually replies",
    text: "Questions before or after a purchase go to a real person, not a ticket queue that goes quiet.",
    Icon: LuHeadphones,
  },
];

const securityChecks = [
  {
    title: "Encrypted checkout",
    text: "Card and payment details are handled by our payment processor and never touch our servers unencrypted.",
  },
  {
    title: "Order verification",
    text: "Every purchase is checked before a license or download is released.",
  },
  {
    title: "Clear refund policy",
    text: (
      <>
        Products that are defective or not as described can be refunded if you ask within 7 days.{" "}
        <Link to="/refund-policy" className="ui-link">
          Read the refund policy
        </Link>
      </>
    ),
  },
];

// Answers are taken from the store's own checkout, product and refund-policy copy.
const faqItems = [
  {
    q: "How is my product delivered?",
    a: "After you pay by UPI and enter the 12-digit UTR from your payment receipt, we match it against our bank statement and send your access on WhatsApp — usually within 15–30 minutes.",
  },
  {
    q: "What payment methods do you accept?",
    a: "UPI. Pay from Google Pay, PhonePe, Paytm or any other UPI app, or scan the QR code shown at checkout.",
  },
  {
    q: "Can I get a refund?",
    a: (
      <>
        Digital purchases are final, but if a product is defective or not as described you can request a refund within 7
        days of purchase.{" "}
        <Link to="/refund-policy" className="ui-link">
          See the refund policy
        </Link>{" "}
        for the full conditions.
      </>
    ),
  },
  {
    q: "What if something doesn't work?",
    a: "We offer a replacement guarantee. Message us on Telegram with your order ID and we'll fix or replace it, no questions asked.",
  },
];

// Edit this list to change the "Hit products of the week" picks (product ids).
const HIT_OF_WEEK_IDS = ["117", "118", "119"];

const getWeeklyHits = (products, hitIds = HIT_OF_WEEK_IDS) =>
  hitIds
    .map((id) => products.find((p) => String(p.id) === String(id)))
    .filter(Boolean)
    .slice(0, 3);

const buildCategoryList = (products) => {
  const counts = new Map();
  products.forEach((p) => {
    const key = p.category || "Uncategorized";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const categories = Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  categories.sort((a, b) => b.count - a.count);
  return [{ name: "All", count: products.length }, ...categories];
};

function CatalogSkeleton() {
  return (
    <div className="ui-grid home-grid" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="home-skeleton-card" key={i}>
          <div className="ui-skeleton home-skeleton-card__media" />
          <div className="home-skeleton-card__body">
            <div className="ui-skeleton" style={{ height: 10, width: "40%" }} />
            <div className="ui-skeleton" style={{ height: 14, width: "85%" }} />
            <div className="ui-skeleton" style={{ height: 14, width: "30%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [activeCategory, setActiveCategory] = useState("All");
  const catalogRef = useRef(null);

  const loadProducts = useCallback(() => {
    setStatus("loading");
    fetch(`${API_BASE}/products`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const weeklyHits = useMemo(() => getWeeklyHits(products), [products]);
  const categories = useMemo(() => buildCategoryList(products), [products]);
  const filteredProducts = useMemo(
    () =>
      activeCategory === "All"
        ? products
        : products.filter((p) => (p.category || "Uncategorized") === activeCategory),
    [products, activeCategory]
  );

  // In-page scroll (a "#catalog" href would be read as a route by the hash router).
  const scrollToCatalog = () => catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="home">
      {/* ---------- Hero ---------- */}
      <section className="home-hero">
        <div className="ui-container home-hero__grid">
          <div className="home-hero__copy">
            <span className="ui-eyebrow">Digital products marketplace</span>
            <h1 className="ui-title-hero">Premium software, sold with proof, not promises.</h1>
            <p className="ui-lead">
              Every order runs through the same verification and delivery process — so what you see at checkout is
              exactly what lands in your account.
            </p>
            <div className="home-hero__actions">
              <Button variant="primary" size="lg" onClick={scrollToCatalog} iconRight={<LuArrowRight />}>
                Browse products
              </Button>
              <Button variant="secondary" size="lg" to="/proofs">
                See delivery proofs
              </Button>
            </div>
          </div>

          <ul className="home-assurance" aria-label="How every order is handled">
            {assurances.map(({ label, title, text, Icon }) => (
              <li className="home-assurance__item" key={label}>
                <span className="ui-icon-tile">
                  <Icon aria-hidden="true" />
                </span>
                <div>
                  <span className="home-assurance__label">{label}</span>
                  <strong>{title}</strong>
                  <span className="home-assurance__text">{text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Trust bar ---------- */}
      <div className="home-trustbar">
        <ul className="ui-container home-trustbar__list">
          {trustItems.map(({ label, Icon }) => (
            <li key={label}>
              <Icon aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* ---------- Weekly top picks ---------- */}
      {status === "ready" && weeklyHits.length > 0 && (
        <Section id="hits">
          <SectionHeader
            eyebrow="Hit products of the week"
            title="This week's top 3"
            description="Ranked by what buyers are actually choosing right now."
          />
          <div className="home-hits">
            {weeklyHits.map((product, i) => (
              <ProductCard key={product.id} product={product} rank={i + 1} />
            ))}
          </div>
        </Section>
      )}

      {/* ---------- Catalog ---------- */}
      <Section id="catalog" ref={catalogRef} className="home-catalog">
        <SectionHeader
          eyebrow="Full catalog"
          title="Browse by category"
          description="Filter down to exactly the kind of tool you're after."
        />

        {status === "loading" && (
          <>
            <span className="ui-visually-hidden" role="status">
              Loading products…
            </span>
            <CatalogSkeleton />
          </>
        )}

        {status === "error" && (
          <StatusMessage
            icon={<LuRefreshCw />}
            title="Couldn't load products"
            text="Check your connection and try again. If it keeps happening, message us on WhatsApp."
            action={
              <Button variant="secondary" onClick={loadProducts} icon={<LuRefreshCw />}>
                Try again
              </Button>
            }
          />
        )}

        {status === "ready" && products.length === 0 && (
          <StatusMessage icon={<LuPackage />} title="No products available right now" text="Check back soon." />
        )}

        {status === "ready" && products.length > 0 && (
          <>
            <div className="home-categories" role="group" aria-label="Filter by category">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  className="home-chip"
                  aria-pressed={activeCategory === cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  {cat.name}
                  <span className="home-chip__count">{cat.count}</span>
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 ? (
              <StatusMessage icon={<LuPackage />} title="No products in this category yet" />
            ) : (
              <div className="ui-grid home-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </Section>

      {/* ---------- Why us ---------- */}
      <Section id="why-us">
        <SectionHeader
          eyebrow="Why shop with us"
          title="Built to be checked, not just trusted"
          description="The parts of buying software online that usually feel risky, made visible instead."
        />
        <FeatureGrid items={valueProps} columns={3} />
      </Section>

      {/* ---------- Checkout & guarantees ---------- */}
      <Section id="security">
        <div className="home-guarantee">
          <div className="home-guarantee__intro">
            <span className="ui-eyebrow">Checkout &amp; guarantees</span>
            <h2 className="ui-title-section">Nothing about your order is a black box.</h2>
            <p className="ui-muted">
              From the moment you pay to the moment your product lands, every step follows the same checked process —
              outlined here rather than buried in a terms page.
            </p>
          </div>
          <ul className="home-guarantee__list">
            {securityChecks.map((c) => (
              <li key={c.title}>
                <LuShieldCheck aria-hidden="true" />
                <div>
                  <strong>{c.title}</strong>
                  <p>{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section id="faq" narrow>
        <SectionHeader eyebrow="Questions" title="Frequently asked" description="The essentials before you check out." />
        <Accordion items={faqItems} defaultOpen={0} idPrefix="home-faq" />
      </Section>

      {/* ---------- Closing call to action ---------- */}
      <Section>
        <CtaPanel
          title="Find your next digital upgrade."
          text="Browse our latest products and get instant access."
          actions={
            <>
              <Button variant="primary" size="lg" onClick={scrollToCatalog} iconRight={<LuArrowRight />}>
                Browse products
              </Button>
              <Button variant="secondary" size="lg" to="/proofs">
                See delivery proofs
              </Button>
            </>
          }
        />
      </Section>
    </div>
  );
};

export default HomePage;
