import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LuLock, LuUser, LuRefreshCw, LuArrowRight, LuArrowDown, LuAlertCircle, LuShoppingCart, LuChevronRight } from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa6";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { getProduct } from "../api/products";
import { Accordion, Alert, Button, Container, Price, SafeHtml, Section, StatusMessage } from "../components/ui";
import PlanSelector from "../components/store/PlanSelector";
import ProductImage from "../components/store/ProductImage";
import { categoryTint } from "../components/store/ProductCard";
import ProofsGallery from "../components/store/ProofsGallery";
import {
  formatPlanDuration,
  isPlanAvailable,
  isProductInStock,
  getPlanPricing,
  convertUsdToInr,
  formatINR,
  formatUSD,
  monthlyPrice,
} from "../utils/pricing";
import { MAX_CART_LINES, MAX_ITEM_QUANTITY } from "../utils/cart";
import "./ProductPage.css";

const purchaseSteps = [
  { title: "Choose your plan", desc: "Pick the plan length that suits you." },
  { title: "Sign in and review", desc: "Log in or create an account, then confirm your order total." },
  { title: "Pay by UPI", desc: "Pay from any UPI app and enter the 12-digit UTR from your receipt." },
  { title: "Get your access", desc: "We verify the payment and send access, usually within 15–30 minutes." },
];

const faqItems = [
  { q: "How fast will I receive access after payment?", a: "Once your UTR is matched against our bank statement, access details are sent on WhatsApp — usually within 15–30 minutes." },
  { q: "What if something doesn't work?", a: "We offer a replacement guarantee. Message us on Telegram with your order ID and we'll fix or replace it, no questions asked." },
  { q: "Do you offer refunds?", a: "Refunds are handled per our Refund Policy, linked in the footer. Digital delivery issues are covered — reach out and we'll sort it quickly." },
  { q: "Is my payment secure?", a: "You pay inside your own UPI app, so your bank details never pass through this website. We only ask for the 12-digit UTR to match your payment." },
];

const expectations = [
  { term: "Delivery", text: "Access details by WhatsApp or email, usually 15–30 minutes after your payment is verified.", Icon: FaWhatsapp },
  { term: "Payment", text: "UPI from any app. Your bank details never pass through this site.", Icon: LuLock },
  { term: "Your account", text: "Single ownership — the plan is for your own account.", Icon: LuUser },
  { term: "Guarantee", text: "A replacement if it stops working during your plan.", Icon: LuRefreshCw },
];

const dummyProofImages = [
  { id: 1, url: "https://res.cloudinary.com/rblaguvf/image/upload/v1783469334/proofs/fmvjx8nf4m0qkytv1tm9.jpg", label: "4965327411218590780.jpg" },
];

const ProductPage = () => {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [proofsHidden, setProofsHidden] = useState(false);

  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);

  const [showStickyBar, setShowStickyBar] = useState(false);

  const [cartNotice, setCartNotice] = useState(null);

  const { id } = useParams();
  const buyBtnAnchorRef = useRef(null);
  const proofsSectionRef = useRef(null);

  useEffect(() => {
    setError("");
    setIsLoading(true);

    if (!id || !/^\d+$/.test(id)) {
      setError("Invalid product ID format. ID must be a number.");
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;
    getProduct(id)
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.plans) || data.plans.length === 0) {
          throw new Error("This product has no pricing plans configured.");
        }
        const firstAvailableIdx = data.plans.findIndex((plan) => isPlanAvailable(plan));
        setSelectedPlanIndex(firstAvailableIdx !== -1 ? firstAvailableIdx : 0);
        setCartNotice(null);
        setProduct(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "An error occurred while fetching the product.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!product || !buyBtnAnchorRef.current) return;

    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 });
    observer.observe(buyBtnAnchorRef.current);
    return () => observer.disconnect();
  }, [product, isLoading]);

  const proofImages = product?.proofs && product.proofs.length > 0 ? product.proofs : dummyProofImages;

  const selectPlan = (index) => {
    setSelectedPlanIndex(index);
    setCartNotice(null);
  };

  const handleBuyNowClick = () => {
    const plan = product?.plans?.[selectedPlanIndex];
    if (!product || !plan || typeof plan.price === "undefined") {
      alert("Error: Could not retrieve plan pricing. Please try again in a moment.");
      return;
    }
    if (!isProductInStock(product) || !isPlanAvailable(plan)) {
      return;
    }
    const line = { productId: Number(product.id), planIndex: selectedPlanIndex, planName: formatPlanDuration(plan), quantity: 1 };
    requireAuth(() => navigate("/checkout", { state: { items: [line], source: "buy_now" } }));
  };

  const handleAddToCart = () => {
    const plan = product?.plans?.[selectedPlanIndex];
    if (!plan || !isProductInStock(product) || !isPlanAvailable(plan)) return;
    const planName = formatPlanDuration(plan);
    const result = addItem({
      productId: Number(product.id),
      planIndex: selectedPlanIndex,
      planName,
      unitPrice: Number(plan.price),
      name: product.name,
      image: product.image || "",
    });
    if (result.full) {
      setCartNotice({ variant: "warning", text: `Your cart is full (${MAX_CART_LINES} products). Check out or remove something first.` });
    } else if (result.added === 0) {
      setCartNotice({ variant: "warning", text: `You already have the maximum of ${MAX_ITEM_QUANTITY} of this plan in your cart.` });
    } else {
      setCartNotice({
        variant: "success",
        text:
          result.quantity > 1
            ? `Added — you now have ${result.quantity} of ${planName} in your cart.`
            : `Added ${planName} to your cart.`,
      });
    }
  };

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

  const plans = product.plans;
  const isMultiPlan = plans.length > 1;
  const selectedPlan = plans[selectedPlanIndex] || plans[0];
  const productInStock = isProductInStock(product);
  const isSelectedPlanAvailable = productInStock && isPlanAvailable(selectedPlan);
  const { price: displayPrice, strike: displayStrike, discountPct } = getPlanPricing(selectedPlan);
  const discount = discountPct || 0;
  const inrAmount = convertUsdToInr(selectedPlan.price);
  const inrDisplay = inrAmount !== null ? `₹${formatINR(inrAmount)}` : null;
  const perMonth = monthlyPrice(selectedPlan);
  const maker = product.brand || product.category;
  const meta = [product.category, "Digital delivery", isMultiPlan ? `${plans.length} plans` : formatPlanDuration(plans[0])].filter(Boolean);

  return (
    <div className="pdp">
      <Container>
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          {product.category && (
            <>
              <LuChevronRight aria-hidden="true" />
              <Link to={`/?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
            </>
          )}
          <LuChevronRight aria-hidden="true" />
          <span aria-current="page" className="pdp-breadcrumb__current">
            {product.name}
          </span>
        </nav>

        <div className="pdp-main">
          <div className="pdp-media">
            <div className="pdp-media__frame" style={{ "--tint": categoryTint(product.category) }}>
              <ProductImage src={product.image} alt={product.name} name={product.name} loading="eager" />
            </div>
          </div>

          <div className="pdp-info">
            <div className="pdp-heading">
              {maker && <p className="pdp-maker">{maker}</p>}
              <h1 className={`pdp-title${(product.name || "").length > 48 ? " pdp-title--long" : ""}`}>{product.name}</h1>
              <p className="pdp-meta">{meta.join(" · ")}</p>
            </div>

            {isSelectedPlanAvailable ? (
              <div className="pdp-price-block">
                <div className="pdp-price">
                  <Price amount={displayPrice} strike={displayStrike} size="xl" />
                  {discount ? <span className="deal-tag">Save {discount}%</span> : null}
                </div>
                <p className="pdp-price__note">
                  {formatPlanDuration(selectedPlan)}
                  {perMonth !== null ? ` · ${formatUSD(perMonth)} per month` : ""}
                  {inrDisplay && (
                    <>
                      {" · You'll pay "}
                      <strong className="ui-num">{inrDisplay}</strong>
                      {" by UPI"}
                    </>
                  )}
                </p>
              </div>
            ) : (
              <Alert variant="danger">This product is out of stock right now.</Alert>
            )}

            <div ref={buyBtnAnchorRef} className="pdp-buy">
              {isMultiPlan && (
                <PlanSelector plans={plans} selectedIndex={selectedPlanIndex} onSelect={selectPlan} />
              )}

              <div className="pdp-actions">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleBuyNowClick}
                  disabled={!isSelectedPlanAvailable}
                  iconRight={isSelectedPlanAvailable ? <LuArrowRight /> : null}
                >
                  {isSelectedPlanAvailable ? `Buy now — ${displayPrice}` : "Out of stock"}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!isSelectedPlanAvailable}
                  icon={<LuShoppingCart />}
                >
                  Add to cart
                </Button>
              </div>
              {cartNotice && (
                <Alert variant={cartNotice.variant}>
                  {cartNotice.text}{" "}
                  <Link to="/cart" className="ui-link">
                    View cart
                  </Link>
                </Alert>
              )}
            </div>

            <dl className="pdp-expect">
              {expectations.map(({ term, text, Icon }) => (
                <div key={term}>
                  <dt>
                    <Icon aria-hidden="true" />
                    {term}
                  </dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>

            <button type="button" className="pdp-proofs-link" onClick={scrollToProofs}>
              See delivery proof <LuArrowDown aria-hidden="true" />
            </button>
          </div>
        </div>
      </Container>

      <Section bordered className="pdp-section">
        <div className="pdp-details">
          <div className="pdp-details__main">
            <h2 className="pdp-section-title">What's included</h2>
            {product.description ? (
              <SafeHtml className="pdp-description" html={product.description} />
            ) : (
              <p className="ui-subtle">No description available for this product yet.</p>
            )}
          </div>
          <aside className="pdp-details__side" aria-labelledby="pdp-steps-title">
            <h2 id="pdp-steps-title" className="pdp-section-title">
              How buying works
            </h2>
            <ol className="pdp-steps">
              {purchaseSteps.map((step, i) => (
                <li className="pdp-step" key={step.title}>
                  <span className="pdp-step__num">{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </Section>

      <ProofsGallery
        ref={proofsSectionRef}
        proofs={proofImages}
        hidden={proofsHidden}
        onToggleHidden={() => setProofsHidden((h) => !h)}
      />

      <Section bordered className="pdp-section">
        <div className="pdp-faq">
          <h2 className="pdp-section-title">Questions about buying</h2>
          <Accordion items={faqItems} idPrefix="pdp-faq" />
        </div>
      </Section>

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
    </div>
  );
};

export default ProductPage;
