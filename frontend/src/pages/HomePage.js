import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LuPackage, LuRefreshCw, LuSearch, LuX, LuArrowRight } from "react-icons/lu";
import { getProducts } from "../api/products";
import { getStartingPlan } from "../utils/pricing";
import { Accordion, Button, Section, Select, StatusMessage } from "../components/ui";
import ProductCard, { ProductRow, categoryTint } from "../components/store/ProductCard";
import ProductImage from "../components/store/ProductImage";
import "./Homepage.css";

const facts = [
  { title: "UPI checkout", text: "Google Pay, PhonePe, Paytm or any UPI app" },
  { title: "Checked by a person", text: "Every payment is matched to our bank statement" },
  { title: "Replacement guarantee", text: "For the full length of your plan" },
];

const steps = [
  { title: "Choose a plan", text: "Pick the product and the plan length that suits you." },
  { title: "Pay by UPI", text: "Pay from any UPI app, then enter the 12-digit UTR from your receipt." },
  { title: "We verify the payment", text: "Your UTR is matched against our bank statement before anything is released." },
  { title: "Get your access", text: "Access details arrive by WhatsApp or email, usually within 15–30 minutes." },
];

const faqItems = [
  {
    q: "How is my product delivered?",
    a: "After you pay by UPI and enter the 12-digit UTR from your payment receipt, we match it against our bank statement and send your access — usually within 15–30 minutes.",
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
    a: "We offer a replacement guarantee. Message us on Telegram or WhatsApp with your order reference and we'll fix or replace it.",
  },
];

const FEATURED_IDS = ["117", "118", "119"];

const SORTS = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

const getFeatured = (products) =>
  FEATURED_IDS.map((id) => products.find((p) => String(p.id) === String(id))).filter(Boolean);

function buildCategories(products) {
  const byName = new Map();
  products.forEach((p) => {
    const name = p.category || "Uncategorized";
    const entry = byName.get(name) || { name, count: 0, image: "" };
    entry.count += 1;
    if (!entry.image && p.image) entry.image = p.image;
    byName.set(name, entry);
  });
  return [...byName.values()].sort((a, b) => b.count - a.count);
}

const matchesQuery = (product, query) =>
  [product.name, product.category, product.brand].some((field) => String(field || "").toLowerCase().includes(query));

function sortByPrice(products, direction) {
  const priceOf = (p) => Number(getStartingPlan(p)?.price);
  return [...products].sort((a, b) => {
    const pa = priceOf(a);
    const pb = priceOf(b);
    if (!Number.isFinite(pa)) return 1;
    if (!Number.isFinite(pb)) return -1;
    return direction === "asc" ? pa - pb : pb - pa;
  });
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function CatalogSkeleton() {
  return (
    <div className="ui-grid home-grid" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="home-skeleton-card" key={i}>
          <div className="ui-skeleton home-skeleton-card__media" />
          <div className="ui-skeleton" style={{ height: 10, width: "35%" }} />
          <div className="ui-skeleton" style={{ height: 14, width: "85%" }} />
          <div className="ui-skeleton" style={{ height: 14, width: "40%" }} />
        </div>
      ))}
    </div>
  );
}

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [sort, setSort] = useState("featured");
  const [params, setParams] = useSearchParams();
  const catalogRef = useRef(null);

  const activeCategory = params.get("category") || "";
  const query = (params.get("q") || "").trim();
  const isFiltered = Boolean(activeCategory || query);

  const loadProducts = useCallback(() => {
    setStatus("loading");
    getProducts()
      .then((data) => {
        setProducts(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (isFiltered && status === "ready") catalogRef.current?.scrollIntoView({ block: "start" });
  }, [isFiltered, activeCategory, query, status]);

  const featured = useMemo(() => getFeatured(products), [products]);
  const categories = useMemo(() => buildCategories(products), [products]);
  const visibleProducts = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = products.filter(
      (p) => (!activeCategory || (p.category || "Uncategorized") === activeCategory) && (!q || matchesQuery(p, q))
    );
    return sort === "featured" ? filtered : sortByPrice(filtered, sort === "price-asc" ? "asc" : "desc");
  }, [products, activeCategory, query, sort]);

  const updateParams = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setParams(next);
  };

  const heading = query ? `Results for “${query}”` : activeCategory || "All products";
  const scrollToCatalog = () => catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="home">
      <section className="home-intro">
        <div className={`ui-container home-intro__grid${featured.length ? "" : " home-intro__grid--single"}`}>
          <div className="home-intro__copy">
            <h1 className="home-intro__title">Software subscriptions, trading tools and courses — on your own account.</h1>
            <p className="home-intro__lead">
              Choose a plan, pay by UPI and receive your access details once we've verified the payment, usually within 15–30
              minutes.
            </p>
            <ul className="home-facts">
              {facts.map(({ title, text }) => (
                <li key={title}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div className="home-intro__links">
              <Button variant="primary" onClick={scrollToCatalog} iconRight={<LuArrowRight />}>
                Browse the catalog
              </Button>
              <Link to="/proofs" className="ui-link">
                See delivery proofs
              </Link>
            </div>
          </div>

          {featured.length > 0 && (
            <aside className="home-featured" aria-labelledby="home-featured-title">
              <h2 id="home-featured-title" className="home-featured__title">
                Featured
              </h2>
              <ul className="home-featured__list">
                {featured.map((product) => (
                  <li key={product.id}>
                    <ProductRow product={product} />
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </section>

      {status === "ready" && categories.length > 1 && !isFiltered && (
        <Section className="home-shop-categories" aria-labelledby="home-categories-title">
          <h2 id="home-categories-title" className="home-section-title">
            Shop by category
          </h2>
          <ul className="home-cat-tiles">
            {categories.map(({ name, count, image }) => (
              <li key={name}>
                <Link to={`/?category=${encodeURIComponent(name)}`} className="home-cat-tile">
                  <span className="home-cat-tile__media" style={{ "--tint": categoryTint(name) }}>
                    <ProductImage src={image} name={name} />
                  </span>
                  <span className="home-cat-tile__name">{name}</span>
                  <span className="home-cat-tile__count">{plural(count, "product")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="catalog" ref={catalogRef} className="home-catalog">
        <div className="home-catalog__head">
          <div className="home-catalog__title">
            <h2 className="home-section-title">{heading}</h2>
            {status === "ready" && (
              <p className="home-count" role="status">
                {plural(visibleProducts.length, "product")}
              </p>
            )}
          </div>
          {status === "ready" && products.length > 0 && (
            <Select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)} className="home-sort">
              {Object.entries(SORTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </div>

        {status === "ready" && products.length > 0 && (
          <div className="home-filters">
            <div className="home-chips" role="group" aria-label="Filter by category">
              <button type="button" className="home-chip" aria-pressed={!activeCategory} onClick={() => updateParams({ category: "" })}>
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  className="home-chip"
                  aria-pressed={activeCategory === cat.name}
                  onClick={() => updateParams({ category: cat.name })}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {query && (
              <button type="button" className="home-search-pill" onClick={() => updateParams({ q: "" })} aria-label={`Clear search for ${query}`}>
                <LuSearch aria-hidden="true" />
                {query}
                <LuX aria-hidden="true" />
              </button>
            )}
          </div>
        )}

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

        {status === "ready" && products.length > 0 && visibleProducts.length === 0 && (
          <StatusMessage
            icon={<LuSearch />}
            title="No products match"
            text="Try a different name, or browse all categories."
            action={
              <Button variant="secondary" onClick={() => setParams({})}>
                Show all products
              </Button>
            }
          />
        )}

        {status === "ready" && visibleProducts.length > 0 && (
          <div className="ui-grid home-grid">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </Section>

      <section className="home-process" aria-labelledby="home-process-title">
        <div className="ui-container home-process__grid">
          <div className="home-process__intro">
            <h2 id="home-process-title" className="home-section-title">
              How buying works
            </h2>
            <p>Every plan is for your own account, and a person checks every payment before access is sent.</p>
          </div>
          <ol className="home-steps">
            {steps.map(({ title, text }, i) => (
              <li key={title}>
                <span className="home-steps__num">{i + 1}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Section className="home-faq">
        <div className="home-faq__grid">
          <div className="home-faq__intro">
            <h2 className="home-section-title">Questions before you buy</h2>
            <p>
              Can't find the answer?{" "}
              <Link to="/contact" className="ui-link">
                Contact us
              </Link>
              .
            </p>
          </div>
          <Accordion items={faqItems} defaultOpen={0} idPrefix="home-faq" />
        </div>
      </Section>
    </div>
  );
};

export default HomePage;
