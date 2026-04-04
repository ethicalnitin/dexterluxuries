import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Countdown from "react-countdown";
import "./ProductPage.css";

const reviews = [
  { id: 1, name: "Amit Sharma", review: "Great product! Helped me understand DSA concepts much better." },
  { id: 2, name: "Sneha Verma", review: "The notes are well structured and easy to follow. Highly recommended!" },
  { id: 3, name: "Rahul Mehta", review: "Worth the price! Covers everything needed for cracking interviews." },
  { id: 4, name: "Priya Das", review: "Absolutely loved it! The AI section is very detailed." },
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
        const response = await fetch(`http://localhost:3046/api/products/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch product");
        setProduct(data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching the product.");
        console.error("Fetch Product Error:", err);
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
      <div className="pp-loading">
        <div className="pp-spinner" />
        <p>Loading product details…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pp-error">
        <span className="pp-error-icon">⚠️</span>
        <p>{error || "Product not found"}</p>
      </div>
    );
  }

  const countdownEnd = new Date(Date.now() + 3600000);
  const discount = product.strikeThroughPrice
    ? Math.round(((product.strikeThroughPrice - product.price) / product.strikeThroughPrice) * 100)
    : null;

  const carouselSettings = {
    dots: true, infinite: true, speed: 800,
    slidesToShow: 1, slidesToScroll: 1,
    autoplay: true, autoplaySpeed: 3500, arrows: false,
  };

  return (
    <div className="pp-root">
      <div className="pp-grid">

        {/* ── LEFT: image ── */}
        <div className="pp-image-col">
          <div className="pp-image-wrap">
            {discount && <span className="pp-discount-badge">{discount}% OFF</span>}
            <img src={product.image} alt={product.name} className="pp-product-img" />
          </div>
          <div className="pp-trust-row">
            {["⚡ Instant Delivery", "🔒 Secure Payment", "♾️ Lifetime Access"].map((t) => (
              <span key={t} className="pp-trust-pill">{t}</span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: details ── */}
        <div className="pp-detail-col">
          <span className="pp-eyebrow">Digital Product · #1011</span>
          <h1 className="pp-title">{product.name} 🔥</h1>

          {/* Countdown */}
          <div className="pp-countdown-card">
            <p className="pp-countdown-label">⏳ Limited time offer ends in</p>
            <Countdown
              date={countdownEnd}
              renderer={({ hours, minutes, seconds, completed }) => {
                if (completed) return <span className="pp-expired">Offer Expired!</span>;
                return (
                  <div className="pp-countdown-display">
                    {[{ val: hours, label: "HRS" }, { val: minutes, label: "MIN" }, { val: seconds, label: "SEC" }].map(
                      ({ val, label }, i) => (
                        <React.Fragment key={label}>
                          {i > 0 && <span className="pp-colon">:</span>}
                          <div className="pp-time-block">
                            <span className="pp-time-num">{String(val).padStart(2, "0")}</span>
                            <span className="pp-time-label">{label}</span>
                          </div>
                        </React.Fragment>
                      )
                    )}
                  </div>
                );
              }}
            />
          </div>

          {/* Pricing */}
          <div className="pp-pricing">
            <span className="pp-price-current">₹{product.price}</span>
            {product.strikeThroughPrice && (
              <span className="pp-price-strike">₹{product.strikeThroughPrice}</span>
            )}
            {discount && <span className="pp-price-save">Save {discount}%</span>}
          </div>

          {/* CTA */}
          <button className="pp-buy-btn" onClick={handleBuyNowClick}>
            Buy Now — ₹{product.price} <span className="pp-btn-arrow">→</span>
          </button>
          <p className="pp-cta-note">
            You'll be redirected to our secure payment page. Please ensure ₹{product.price} is selected.
          </p>

          {/* Description */}
          {product.description && (
            <div className="pp-description">
              <h3 className="pp-desc-heading">What's included</h3>
              <div className="pp-desc-body" dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}

          {error && <p className="pp-inline-error">{error}</p>}
        </div>
      </div>

      {/* ── Reviews ── */}
      <section className="pp-reviews">
        <h2 className="pp-reviews-title">What customers say 🤝</h2>
        <div className="pp-reviews-slider">
          <Slider {...carouselSettings}>
            {reviews.map((review) => (
              <div key={review.id} className="pp-review-slide">
                <div className="pp-review-card">
                  <div className="pp-review-stars">★★★★★</div>
                  <p className="pp-review-text">"{review.review}"</p>
                  <p className="pp-review-name">— {review.name}</p>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>
    </div>
  );
};

export default ProductPage;