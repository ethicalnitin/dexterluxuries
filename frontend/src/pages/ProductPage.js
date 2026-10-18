import React, { useState, useEffect, useRef, useCallback } from "react";
import Countdown from "react-countdown";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  LuZap,
  LuLock,
  LuUser,
  LuRefreshCw,
  LuClock,
  LuArrowRight,
  LuArrowDown,
  LuChevronLeft,
  LuChevronRight,
  LuX,
  LuAlertCircle,
  LuEyeOff,
  LuImage,
} from "react-icons/lu";
import { useAuth } from "./AuthContext";
import { API_BASE } from "../config/api";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Container,
  Field,
  Input,
  Modal,
  Price,
  Section,
  SectionHeader,
  StatusMessage,
} from "../components/ui";
import PlanSelector from "../components/store/PlanSelector";
import ProductImage from "../components/store/ProductImage";
import {
  formatPlanDuration,
  isPlanAvailable,
  getPlanPricing,
  convertUsdToInr,
  formatINR,
} from "../utils/pricing";
import { getOfferEnd } from "../utils/offer";
import "./ProductPage.css";

// Purchase process — same 4 steps for every product on the store.
const purchaseSteps = [
  { title: "Choose your plan", desc: "Pick the duration or tier that fits you on this page." },
  { title: "Enter your email", desc: "Just your email — that's all we need to send access." },
  { title: "Complete payment", desc: "Pay via UPI, card, or netbanking — whatever's easiest for you." },
  { title: "Instant delivery", desc: "Access details land in your email / Telegram within minutes." },
];

// FAQ — generic questions that apply to every digital product on the store.
const faqItems = [
  { q: "How fast will I receive access after payment?", a: "Delivery is instant for most orders — you'll get access details by email and/or Telegram within a few minutes of successful payment." },
  { q: "What if something doesn't work?", a: "We offer a replacement guarantee. Message us on Telegram with your order ID and we'll fix or replace it, no questions asked." },
  { q: "Do you offer refunds?", a: "Refunds are handled per our Refund Policy, linked in the footer. Digital delivery issues are covered — reach out and we'll sort it quickly." },
  { q: "Is my payment secure?", a: "Yes — all payments are processed through an encrypted, PCI-compliant gateway. We never see or store your card details." },
];

const trustItems = [
  { label: "Fast delivery", Icon: LuZap },
  { label: "Secure payment", Icon: LuLock },
  { label: "Single ownership", Icon: LuUser },
  { label: "Replacement guarantee", Icon: LuRefreshCw },
];

/**
 * Proof-of-delivery / proof-of-results screenshots shown for every product.
 * Falls back to this store-wide set until the backend returns
 * `product.proofs` (an array of { id, url, label }) per product.
 */
const dummyProofImages = [
  { id: 1, url: "https://res.cloudinary.com/rblaguvf/image/upload/v1783469334/proofs/fmvjx8nf4m0qkytv1tm9.jpg", label: "4965327411218590780.jpg" },
];

const PROOFS_PREVIEW_COUNT = 5;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lightweight, dependency-free confetti burst in the theme's colours.
// Pieces are plain <span>s animated by `pdpConfettiFall` (ProductPage.css)
// and remove themselves once the animation finishes.
function fireConfetti() {
  const cs = getComputedStyle(document.documentElement);
  const colors = ["--color-primary", "--color-accent", "--color-secondary", "--color-success"]
    .map((v) => cs.getPropertyValue(v).trim())
    .filter(Boolean);
  const count = 70;

  const container = document.createElement("div");
  container.className = "pdp-confetti";
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "pdp-confetti__piece";

    const width = 6 + Math.random() * 6;
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = `${width}px`;
    piece.style.height = `${width * (0.35 + Math.random() * 0.3)}px`;
    piece.style.animationDuration = `${2.2 + Math.random() * 1.6}s`;
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 180}px`);

    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 4200);
}

const pad = (n) => String(n).padStart(2, "0");

const ProductPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const accountEmail = user?.email || "";

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllProofs, setShowAllProofs] = useState(false);
  const [proofsHidden, setProofsHidden] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Index into product.plans — plans are embedded sub-documents with
  // `{ _id: false }` in the schema, so there's no plan id to key off of.
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);

  const [showStickyBar, setShowStickyBar] = useState(false);

  // Email-only checkout: no OTP, no login — just collect an email right
  // before handing off to the payment page.
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");

  // Countdown target: midnight tonight (see utils/offer.js), computed once via
  // the lazy initializer so it stays fixed for the whole session.
  const [countdownEnd] = useState(getOfferEnd);

  const { id } = useParams();
  const buyBtnAnchorRef = useRef(null);
  const proofsSectionRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setError("");
    setIsLoading(true);

    if (!id || !/^\d+$/.test(id)) {
      setError("Invalid product ID format. ID must be a number.");
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_BASE}/products/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch product");
        if (!Array.isArray(data.plans) || data.plans.length === 0) {
          throw new Error("This product has no pricing plans configured.");
        }
        setProduct(data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching the product.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Reset plan selection whenever a (new) product loads — default to the
  // first in-stock plan so shoppers don't land on a sold-out option.
  useEffect(() => {
    if (!product?.plans) return;
    const firstAvailableIdx = product.plans.findIndex(isPlanAvailable);
    setSelectedPlanIndex(firstAvailableIdx !== -1 ? firstAvailableIdx : 0);
  }, [product]);

  // Show a sticky Buy Now bar once the main buy button scrolls out of view.
  useEffect(() => {
    if (!product || !buyBtnAnchorRef.current) return;

    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 });
    observer.observe(buyBtnAnchorRef.current);
    return () => observer.disconnect();
  }, [product, isLoading]);

  // Focus the email field as soon as the modal opens. Signed-in shoppers get
  // their account email prefilled (still editable).
  useEffect(() => {
    if (showEmailModal) {
      setEmailInput(accountEmail);
      setEmailError("");
      setTimeout(() => emailInputRef.current?.focus(), 50);
    }
  }, [showEmailModal, accountEmail]);

  const proofImages = product?.proofs && product.proofs.length > 0 ? product.proofs : dummyProofImages;

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(
    () => setLightboxIndex((i) => (i - 1 + proofImages.length) % proofImages.length),
    [proofImages.length]
  );
  const showNext = useCallback(() => setLightboxIndex((i) => (i + 1) % proofImages.length), [proofImages.length]);

  // Keyboard control for the proof lightbox.
  useEffect(() => {
    if (lightboxIndex === null) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  // ── Buy Now handler ───────────────────────────────────────────────────
  // No OTP, no login gate — clicking Buy Now just opens a small modal
  // asking for an email address, then hands off to the payment page.
  const handleBuyNowClick = () => {
    const plan = product?.plans?.[selectedPlanIndex];
    if (!product || !plan || typeof plan.price === "undefined") {
      alert("Error: Could not retrieve plan pricing. Please try again in a moment.");
      return;
    }
    if (!isPlanAvailable(plan)) {
      return; // button is disabled in this state, this is just a guard
    }
    setShowEmailModal(true);
  };

  // ── Email submit handler ──────────────────────────────────────────────
  // Validates the email, fires the confetti burst, then redirects to the
  // payment page with the plan + email in the route state.
  const handleEmailSubmit = (e) => {
    e.preventDefault();

    const trimmedEmail = emailInput.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    const plan = product.plans[selectedPlanIndex];
    const amountInINR = convertUsdToInr(plan.price);
    if (amountInINR === null) {
      setEmailError("Could not calculate the payment amount. Please try again.");
      return;
    }

    fireConfetti();
    setShowEmailModal(false);

    // Small delay so the confetti burst is visible before navigating away.
    setTimeout(() => {
      navigate("/payment", {
        state: {
          productId: product.id ?? product._id,
          productName: product.name,
          planName: formatPlanDuration(plan),
          amount: amountInINR, // rupees — what PaymentPage.js's UPI flow expects
          amountUSD: plan.price, // kept too, in case you want it for crypto display later
          email: trimmedEmail,
        },
      });
    }, 650);
  };

  // Smoothly scrolls to the proofs section. Un-hides it first if the user
  // had previously collapsed it, so they always land on visible content.
  const scrollToProofs = () => {
    setProofsHidden(false);
    requestAnimationFrame(() => {
      proofsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (isLoading) {
    return (
      <Container className="pdp-state">
        <StatusMessage loading title="Loading product details…" />
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="pdp-state">
        <StatusMessage
          icon={<LuAlertCircle />}
          title="We couldn't load this product"
          text={error || "Product not found"}
          action={
            <Button to="/" variant="secondary">
              Back to the store
            </Button>
          }
        />
      </Container>
    );
  }

  // ── Real pricing, taken directly from the model's embedded plans ──────
  const plans = product.plans; // guaranteed non-empty by the fetch check above
  const isMultiPlan = plans.length > 1;
  const selectedPlan = plans[selectedPlanIndex] || plans[0];
  const isSelectedPlanAvailable = isPlanAvailable(selectedPlan);
  const { price: displayPrice, strike: displayStrike, discountPct } = getPlanPricing(selectedPlan);
  const discount = discountPct || 0;
  const inrAmount = convertUsdToInr(selectedPlan.price);
  const inrDisplay = inrAmount !== null ? `₹${formatINR(inrAmount)}` : null;

  const visibleProofs = showAllProofs ? proofImages : proofImages.slice(0, PROOFS_PREVIEW_COUNT);
  const hasMoreProofs = proofImages.length > PROOFS_PREVIEW_COUNT;

  return (
    <div className="pdp">
      <Container>
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Store</Link>
          {product.category && (
            <>
              <span aria-hidden="true">/</span>
              <span>{product.category}</span>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="pdp-breadcrumb__current">
            {product.name}
          </span>
        </nav>

        <div className="pdp-main">
          {/* ---------- Media ---------- */}
          <div className="pdp-media">
            <div className="pdp-media__frame">
              {discount ? (
                <Badge variant="success" className="pdp-media__badge">
                  {discount}% off
                </Badge>
              ) : null}
              <ProductImage src={product.image} alt={product.name} name={product.name} loading="eager" />
            </div>
            <ul className="pdp-trust">
              {trustItems.map(({ label, Icon }) => (
                <li key={label}>
                  <Icon aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- Purchase panel ---------- */}
          <div className="pdp-info">
            <span className="ui-eyebrow">
              {product.brand ? `${product.brand} · Digital Product` : "Digital Product · Premium"}
            </span>
            <h1 className={`pdp-title${(product.name || "").length > 48 ? " pdp-title--long" : ""}`}>{product.name}</h1>

            <Countdown
              date={countdownEnd}
              renderer={({ hours, minutes, seconds, completed }) => (
                <div className="pdp-countdown" role="timer" aria-live="off">
                  <LuClock aria-hidden="true" />
                  {completed ? (
                    <span>Offer expired</span>
                  ) : (
                    <>
                      <span>Offer ends in</span>
                      <span className="pdp-countdown__time ui-mono">
                        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
                      </span>
                    </>
                  )}
                </div>
              )}
            />

            {/* Single-plan products show one price up top (or an out-of-stock
                notice). Multi-plan products show prices in the plan list. */}
            {!isMultiPlan &&
              (isSelectedPlanAvailable ? (
                <div className="pdp-price">
                  <Price amount={displayPrice} strike={displayStrike} size="xl" />
                  {discount ? <Badge variant="success">Save {discount}%</Badge> : null}
                </div>
              ) : (
                <Alert variant="danger">This product is out of stock right now.</Alert>
              ))}

            {/* This ref marks where the "main" buy button lives. Once it scrolls
                out of view, the sticky bottom bar takes over as the CTA. */}
            <div ref={buyBtnAnchorRef} className="pdp-buy">
              {isMultiPlan && (
                <PlanSelector plans={plans} selectedIndex={selectedPlanIndex} onSelect={setSelectedPlanIndex} />
              )}

              <Button
                variant="primary"
                size="lg"
                block
                onClick={handleBuyNowClick}
                disabled={!isSelectedPlanAvailable}
                iconRight={isSelectedPlanAvailable ? <LuArrowRight /> : null}
              >
                {isSelectedPlanAvailable ? `Buy now — ${displayPrice}` : "Out of stock"}
              </Button>
              {isSelectedPlanAvailable && inrDisplay && (
                <p className="pdp-buy__note">
                  You'll pay <strong className="ui-mono">{inrDisplay}</strong> by UPI at checkout.
                </p>
              )}
            </div>

            <p className="pdp-cta-note">
              Just enter your email to continue — no account or verification needed. Instant delivery after payment.
            </p>

            <button type="button" className="pdp-proofs-link" onClick={scrollToProofs}>
              View delivery proof <LuArrowDown aria-hidden="true" />
            </button>
          </div>
        </div>
      </Container>

      {/* ---------- Description ---------- */}
      <Section bordered narrow className="pdp-section">
        <SectionHeader title="What's included" />
        {product.description ? (
          <div className="pdp-description" dangerouslySetInnerHTML={{ __html: product.description }} />
        ) : (
          <p className="ui-subtle">No description available for this product yet.</p>
        )}
      </Section>

      {/* ---------- Purchase process ---------- */}
      <Section bordered className="pdp-section">
        <SectionHeader
          eyebrow="How it works"
          title="From click to access, in minutes"
          description="No manual approval, no waiting on hold — the entire process is built to be fast and self-serve."
        />
        <ol className="pdp-steps">
          {purchaseSteps.map((s, i) => (
            <li className="ui-card pdp-step" key={s.title}>
              <span className="pdp-step__num ui-mono">{i + 1}</span>
              <h3 className="ui-title-card">{s.title}</h3>
              <p className="ui-muted ui-small">{s.desc}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- Proofs gallery ---------- */}
      <Section bordered className="pdp-section" ref={proofsSectionRef}>
        <SectionHeader
          eyebrow="Proof, not promises"
          title="Real orders, real deliveries"
          description="A sample of confirmation screenshots from past buyers of this product. Tap any image to view it larger."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setProofsHidden((h) => !h)}
              icon={proofsHidden ? <LuImage /> : <LuEyeOff />}
            >
              {proofsHidden ? "Show proofs" : "Hide proofs"}
            </Button>
          }
        />

        {proofsHidden ? (
          <p className="ui-subtle ui-small">Proofs are hidden — use “Show proofs” to view them.</p>
        ) : (
          <>
            <div className="pdp-proofs">
              {visibleProofs.map((proof, idx) => (
                <button
                  type="button"
                  className="pdp-proof"
                  key={proof.id}
                  onClick={() => setLightboxIndex(idx)}
                  aria-label={`View ${proof.label || `proof ${idx + 1}`} larger`}
                >
                  <img src={proof.url} alt={proof.label || `Proof ${idx + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
            {!showAllProofs && hasMoreProofs && (
              <div className="pdp-proofs__more">
                <Button variant="secondary" onClick={() => setShowAllProofs(true)}>
                  Show all {proofImages.length} proofs
                </Button>
              </div>
            )}
          </>
        )}
      </Section>

      {/* ---------- FAQ ---------- */}
      <Section bordered narrow className="pdp-section">
        <SectionHeader
          eyebrow="Good to know"
          title="Frequently asked questions"
          description="Still unsure? Here's what most buyers ask before checking out."
        />
        <Accordion items={faqItems} idPrefix="pdp-faq" />
      </Section>

      {/* ---------- Sticky buy bar (once the main CTA scrolls out of view) ---------- */}
      {showStickyBar && (
        <div className="buy-bar">
          <div className="ui-container buy-bar__inner">
            <div className="buy-bar__info">
              <span className="buy-bar__name">
                {product.name}
                {isMultiPlan ? ` — ${formatPlanDuration(selectedPlan)}` : ""}
              </span>
              {isSelectedPlanAvailable ? (
                <Price amount={displayPrice} strike={displayStrike} size="sm" />
              ) : (
                <span className="buy-bar__soldout">Out of stock</span>
              )}
            </div>
            <Countdown
              date={countdownEnd}
              renderer={({ hours, minutes, seconds, completed }) =>
                completed ? (
                  <span className="buy-bar__timer buy-bar__timer--expired">Offer expired</span>
                ) : (
                  <span className="buy-bar__timer ui-mono" aria-label="Offer ends in">
                    <LuClock aria-hidden="true" />
                    {pad(hours)}:{pad(minutes)}:{pad(seconds)}
                  </span>
                )
              }
            />
            <Button
              variant="primary"
              onClick={handleBuyNowClick}
              disabled={!isSelectedPlanAvailable}
              iconRight={isSelectedPlanAvailable ? <LuArrowRight /> : null}
            >
              {isSelectedPlanAvailable ? "Buy now" : "Sold out"}
            </Button>
          </div>
        </div>
      )}

      {/* ---------- Email capture ---------- */}
      <Modal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Where should we send access?"
        description="Enter your email to continue to payment. No account, no verification code — just this."
      >
        <form onSubmit={handleEmailSubmit} noValidate className="pdp-email-form">
          <div className="pdp-email-summary">
            <span>
              {product.name}
              {isMultiPlan ? ` · ${formatPlanDuration(selectedPlan)}` : ""}
            </span>
            <span className="pdp-email-summary__price">
              <strong className="ui-mono">{displayPrice}</strong>
              {inrDisplay && <small>{inrDisplay} by UPI</small>}
            </span>
          </div>
          <Field label="Email address" htmlFor="pdp-email" error={emailError}>
            <Input
              id="pdp-email"
              ref={emailInputRef}
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={emailInput}
              invalid={Boolean(emailError)}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (emailError) setEmailError("");
              }}
              autoComplete="email"
            />
          </Field>
          <Button type="submit" variant="primary" size="lg" block iconRight={<LuArrowRight />}>
            Continue to payment — {displayPrice}
          </Button>
        </form>
      </Modal>

      {/* ---------- Proof lightbox ---------- */}
      {lightboxIndex !== null && (
        <div className="pdp-lightbox" onClick={closeLightbox} role="dialog" aria-modal="true" aria-label="Proof image">
          <button
            type="button"
            className="pdp-lightbox__btn pdp-lightbox__close"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <LuX />
          </button>
          {proofImages.length > 1 && (
            <button
              type="button"
              className="pdp-lightbox__btn pdp-lightbox__prev"
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              aria-label="Previous"
            >
              <LuChevronLeft />
            </button>
          )}
          <img
            src={proofImages[lightboxIndex].url}
            alt={proofImages[lightboxIndex].label || "Proof"}
            className="pdp-lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />
          {proofImages.length > 1 && (
            <button
              type="button"
              className="pdp-lightbox__btn pdp-lightbox__next"
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              aria-label="Next"
            >
              <LuChevronRight />
            </button>
          )}
          <span className="pdp-lightbox__count ui-mono">
            {lightboxIndex + 1} / {proofImages.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
