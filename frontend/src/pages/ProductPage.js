import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Countdown from "react-countdown";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --gold: #C9A84C;
    --gold-light: #E8C97A;
    --dark: #0A0A0A;
    --dark2: #111111;
    --dark3: #1A1A1A;
    --dark4: #242424;
    --white: #F5F0E8;
    --white-dim: rgba(245,240,232,0.6);
    --white-faint: rgba(245,240,232,0.08);
  }

  .pp-root {
    background: var(--dark);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    padding-top: 88px;
  }

  .pp-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    gap: 20px;
    background: var(--dark);
    color: var(--white-dim);
    font-size: 15px;
    font-weight: 300;
    font-family: 'DM Sans', sans-serif;
  }

  .pp-loading-dots {
    display: flex;
    gap: 8px;
  }

  .pp-loading-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--gold);
    animation: dotBounce 1.2s infinite;
  }

  .pp-loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .pp-loading-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes dotBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-8px); opacity: 1; }
  }

  .pp-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    gap: 16px;
    background: var(--dark);
    font-family: 'DM Sans', sans-serif;
    text-align: center;
    padding: 24px;
  }

  .pp-error-icon { font-size: 48px; }

  .pp-error p {
    font-size: 16px;
    color: var(--white-dim);
    font-weight: 300;
    max-width: 400px;
  }

  .pp-grid {
    max-width: 1180px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: start;
  }

  .pp-image-col {
    position: sticky;
    top: 100px;
  }

  .pp-image-wrap {
    position: relative;
    border: 1px solid rgba(201,168,76,0.15);
    overflow: hidden;
    background: var(--dark2);
  }

  .pp-product-img {
    width: 100%;
    aspect-ratio: 4/3;
    object-fit: cover;
    display: block;
    transition: transform 0.5s ease;
  }

  .pp-image-wrap:hover .pp-product-img { transform: scale(1.03); }

  .pp-discount-badge {
    position: absolute;
    top: 16px;
    left: 16px;
    background: var(--gold);
    color: #000;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 2px;
    z-index: 2;
  }

  .pp-trust-row {
    display: flex;
    gap: 0;
    margin-top: 2px;
    background: rgba(201,168,76,0.06);
    border: 1px solid rgba(201,168,76,0.12);
    border-top: none;
  }

  .pp-trust-pill {
    flex: 1;
    text-align: center;
    font-size: 11px;
    font-weight: 400;
    color: var(--white-dim);
    padding: 12px 6px;
    border-right: 1px solid rgba(201,168,76,0.1);
    letter-spacing: 0.3px;
  }

  .pp-trust-pill:last-child { border-right: none; }

  .pp-detail-col {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .pp-eyebrow {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
    margin-bottom: 12px;
    display: block;
  }

  .pp-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 3.5vw, 2.6rem);
    font-weight: 900;
    line-height: 1.15;
    margin-bottom: 28px;
    color: var(--white);
  }

  .pp-countdown-card {
    background: var(--dark2);
    border: 1px solid rgba(201,168,76,0.2);
    padding: 20px 24px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
  }

  .pp-countdown-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(to right, var(--gold), transparent);
  }

  .pp-countdown-label {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--white-dim);
    font-weight: 400;
    margin-bottom: 14px;
  }

  .pp-countdown-display {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pp-time-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--dark3);
    border: 1px solid rgba(201,168,76,0.15);
    padding: 10px 16px;
    min-width: 64px;
  }

  .pp-time-num {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
  }

  .pp-time-label {
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--white-dim);
    margin-top: 5px;
    font-weight: 500;
  }

  .pp-colon {
    font-family: 'Playfair Display', serif;
    font-size: 1.6rem;
    color: var(--gold);
    font-weight: 700;
    margin-bottom: 14px;
  }

  .pp-expired {
    font-size: 14px;
    color: rgba(255,80,80,0.8);
    font-weight: 400;
  }

  .pp-pricing {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }

  .pp-price-current {
    font-family: 'Playfair Display', serif;
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
  }

  .pp-price-strike {
    font-size: 1.1rem;
    color: var(--white-dim);
    text-decoration: line-through;
    font-weight: 300;
  }

  .pp-price-save {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #000;
    background: var(--gold);
    padding: 4px 10px;
    border-radius: 2px;
  }

  .pp-buy-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    background: var(--gold);
    color: #000;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.3px;
    padding: 18px 32px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 0 40px rgba(201,168,76,0.25);
    margin-bottom: 12px;
  }

  .pp-buy-btn:hover {
    background: var(--gold-light);
    transform: translateY(-2px);
    box-shadow: 0 8px 48px rgba(201,168,76,0.4);
  }

  .pp-buy-btn:active { transform: translateY(0); }

  .pp-btn-arrow {
    font-size: 18px;
    transition: transform 0.2s;
  }

  .pp-buy-btn:hover .pp-btn-arrow { transform: translateX(4px); }

  .pp-cta-note {
    font-size: 12px;
    color: var(--white-dim);
    text-align: center;
    font-weight: 300;
    margin-bottom: 36px;
    line-height: 1.6;
  }

  .pp-description {
    border-top: 1px solid rgba(201,168,76,0.12);
    padding-top: 32px;
  }

  .pp-desc-heading {
    font-family: 'Playfair Display', serif;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 16px;
    color: var(--white);
  }

  .pp-desc-body {
    font-size: 14.5px;
    color: var(--white-dim);
    line-height: 1.85;
    font-weight: 300;
  }

  .pp-desc-body ul { padding-left: 0; list-style: none; }
  .pp-desc-body li { padding: 6px 0; border-bottom: 1px solid rgba(201,168,76,0.07); display: flex; gap: 10px; }
  .pp-desc-body li::before { content: '✦'; color: var(--gold); font-size: 10px; flex-shrink: 0; margin-top: 4px; }
  .pp-desc-body p { margin-bottom: 12px; }
  .pp-desc-body strong { color: var(--white); font-weight: 500; }

  .pp-inline-error {
    font-size: 13px;
    color: rgba(255,100,100,0.8);
    font-weight: 300;
    margin-top: 12px;
  }

  .pp-reviews {
    background: var(--dark2);
    border-top: 1px solid rgba(201,168,76,0.12);
    padding: 80px 32px 90px;
  }

  .pp-reviews-inner {
    max-width: 860px;
    margin: 0 auto;
  }

  .pp-reviews-eyebrow {
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
    text-align: center;
    margin-bottom: 12px;
  }

  .pp-reviews-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 3.5vw, 2.6rem);
    font-weight: 700;
    text-align: center;
    margin-bottom: 48px;
    color: var(--white);
  }

  .pp-review-card {
    background: var(--dark3);
    border: 1px solid rgba(201,168,76,0.15);
    padding: 44px 44px 36px;
    margin: 0 12px;
    position: relative;
    overflow: hidden;
  }

  .pp-review-card::before {
    content: '"';
    font-family: 'Playfair Display', serif;
    font-size: 120px;
    color: rgba(201,168,76,0.1);
    position: absolute;
    top: -10px;
    left: 20px;
    line-height: 1;
    pointer-events: none;
  }

  .pp-review-stars {
    color: var(--gold);
    font-size: 16px;
    letter-spacing: 3px;
    margin-bottom: 18px;
  }

  .pp-review-text {
    font-size: clamp(1rem, 2vw, 1.15rem);
    color: var(--white);
    font-style: italic;
    font-weight: 300;
    line-height: 1.8;
    margin-bottom: 24px;
  }

  .pp-review-divider {
    width: 36px;
    height: 1px;
    background: var(--gold);
    margin-bottom: 14px;
  }

  .pp-review-name {
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 500;
  }

  .pp-reviews .slick-dots li button:before {
    color: var(--gold) !important;
    opacity: 0.3;
    font-size: 8px;
  }

  .pp-reviews .slick-dots li.slick-active button:before {
    opacity: 1;
    color: var(--gold) !important;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 900px) {
    .pp-grid {
      grid-template-columns: 1fr;
      gap: 40px;
      padding: 40px 24px 64px;
    }

    .pp-image-col { position: static; }

    .pp-trust-row { flex-wrap: wrap; }
    .pp-trust-pill { min-width: 50%; }
  }

  @media (max-width: 480px) {
    .pp-review-card { padding: 32px 24px 28px; margin: 0; }
    .pp-time-block { min-width: 52px; padding: 8px 10px; }
    .pp-time-num { font-size: 1.4rem; }
  }
`;

const reviews = [
  { id: 1, name: "Amit Sharma", city: "Delhi", review: "Activated within 5 minutes. TradingView Premium at this price is unreal. All indicators and features work perfectly." },
  { id: 2, name: "Sneha Verma", city: "Pune", review: "Was skeptical at first, but the delivery was instant and everything works flawlessly. Saved so much money!" },
  { id: 3, name: "Rahul Mehta", city: "Mumbai", review: "Been using for 3 months straight without any issues. The support team responded in under 10 minutes when I had a question." },
  { id: 4, name: "Priya Das", city: "Bangalore", review: "Best purchase I've made for my trading setup. Full premium access, no limits. Absolutely worth every rupee." },
];

const ProductPage = () => {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { id } = useParams();

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
        const response = await fetch(`https://dexterluxuries.onrender.com/api/products/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch product");
        setProduct(data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching the product.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleBuyNowClick = () => {
    if (!product || typeof product.price === "undefined") {
      alert("Error: Could not retrieve product details. Please try again later.");
      return;
    }
    const encodedProductName = encodeURIComponent(product.name || "Product");
    const paymentUrl = `https://paymentpage-html.onrender.com?amount=${product.price}&productId=${id}&productName=${encodedProductName}`;
    window.location.href = paymentUrl;
  };

  if (isLoading) {
    return (
      <>
        <style>{style}</style>
        <div className="pp-loading">
          <div className="pp-loading-dots">
            <div className="pp-loading-dot" />
            <div className="pp-loading-dot" />
            <div className="pp-loading-dot" />
          </div>
          <p>Loading product details…</p>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <style>{style}</style>
        <div className="pp-error">
          <span className="pp-error-icon">⚠️</span>
          <p>{error || "Product not found"}</p>
        </div>
      </>
    );
  }

  const countdownEnd = new Date(Date.now() + 3600000);
  const discount = product.strikeThroughPrice
    ? Math.round(((product.strikeThroughPrice - product.price) / product.strikeThroughPrice) * 100)
    : null;

  const carouselSettings = {
    dots: true, infinite: true, speed: 800,
    slidesToShow: 1, slidesToScroll: 1,
    autoplay: true, autoplaySpeed: 4000, arrows: false,
  };

  return (
    <>
      <style>{style}</style>
      <div className="pp-root">

        <div className="pp-grid">

          <div className="pp-image-col">
            <div className="pp-image-wrap">
              {discount && <span className="pp-discount-badge">{discount}% OFF</span>}
              <img src={product.image} alt={product.name} className="pp-product-img" />
            </div>
            <div className="pp-trust-row">
              {["⚡ Instant Delivery", "🔒 Secure Payment", "♾️ Lifetime Access", "🔄 Replacement Guarantee"].map(t => (
                <span key={t} className="pp-trust-pill">{t}</span>
              ))}
            </div>
          </div>

          <div className="pp-detail-col">
            <span className="pp-eyebrow">Digital Product · Premium</span>
            <h1 className="pp-title">{product.name}</h1>

            <div className="pp-countdown-card">
              <p className="pp-countdown-label">⏳ Limited time offer ends in</p>
              <Countdown
                date={countdownEnd}
                renderer={({ hours, minutes, seconds, completed }) => {
                  if (completed) return <span className="pp-expired">Offer Expired</span>;
                  return (
                    <div className="pp-countdown-display">
                      {[{ val: hours, label: "HRS" }, { val: minutes, label: "MIN" }, { val: seconds, label: "SEC" }].map(({ val, label }, i) => (
                        <React.Fragment key={label}>
                          {i > 0 && <span className="pp-colon">:</span>}
                          <div className="pp-time-block">
                            <span className="pp-time-num">{String(val).padStart(2, "0")}</span>
                            <span className="pp-time-label">{label}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  );
                }}
              />
            </div>

            <div className="pp-pricing">
              <span className="pp-price-current">₹{product.price}</span>
              {product.strikeThroughPrice && <span className="pp-price-strike">₹{product.strikeThroughPrice}</span>}
              {discount && <span className="pp-price-save">Save {discount}%</span>}
            </div>

            <button className="pp-buy-btn" onClick={handleBuyNowClick}>
              Buy Now — ₹{product.price} <span className="pp-btn-arrow">→</span>
            </button>
            <p className="pp-cta-note">
              You'll be redirected to our secure payment page. Instant delivery after payment.
            </p>

            {product.description && (
              <div className="pp-description">
                <h3 className="pp-desc-heading">What's Included</h3>
                <div className="pp-desc-body" dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            )}

            {error && <p className="pp-inline-error">{error}</p>}
          </div>
        </div>

        <section className="pp-reviews">
          <div className="pp-reviews-inner">
            <p className="pp-reviews-eyebrow">Customer Testimonials</p>
            <h2 className="pp-reviews-title">What Our Traders Say</h2>
            <Slider {...carouselSettings}>
              {reviews.map(review => (
                <div key={review.id}>
                  <div className="pp-review-card">
                    <div className="pp-review-stars">★★★★★</div>
                    <p className="pp-review-text">{review.review}</p>
                    <div className="pp-review-divider" />
                    <p className="pp-review-name">{review.name} — {review.city}</p>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </section>

      </div>
    </>
  );
};

export default ProductPage;