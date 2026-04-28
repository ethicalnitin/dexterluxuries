import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  :root {
    --gold: #C9A84C;
    --gold-light: #E8C97A;
    --gold-dim: #8B6914;
    --dark: #0A0A0A;
    --dark2: #111111;
    --dark3: #1A1A1A;
    --dark4: #242424;
    --white: #F5F0E8;
    --white-dim: rgba(245,240,232,0.6);
    --white-faint: rgba(245,240,232,0.08);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .hp-root {
    background: var(--dark);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .hp-announce-bar {
    background: var(--gold);
    color: #000;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    padding: 10px 0;
    overflow: hidden;
    white-space: nowrap;
  }

  .hp-marquee-track {
    display: inline-flex;
    animation: marquee 28s linear infinite;
  }

  .hp-marquee-track span {
    padding-right: 80px;
  }

  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  .hp-hero {
    position: relative;
    height: 92vh;
    min-height: 560px;
    overflow: hidden;
  }

  .hp-slides {
    position: absolute;
    inset: 0;
  }

  .hp-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 1.2s ease;
  }

  .hp-slide--active { opacity: 1; }

  .hp-slide-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.35);
  }

  .hp-slide-overlay {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,168,76,0.15) 0%, transparent 70%),
      linear-gradient(to bottom, transparent 40%, rgba(10,10,10,0.95) 100%);
  }

  .hp-hero-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 24px;
    animation: fadeUp 0.8s ease both;
  }

  .hp-hero-eyebrow {
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 20px;
    font-weight: 500;
  }

  .hp-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.8rem, 7vw, 5.5rem);
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: -1px;
    margin-bottom: 20px;
  }

  .hp-hero-accent {
    color: var(--gold);
    font-style: italic;
  }

  .hp-hero-sub {
    font-size: clamp(1rem, 2vw, 1.2rem);
    color: var(--white-dim);
    font-weight: 300;
    margin-bottom: 40px;
    max-width: 480px;
  }

  .hp-hero-cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--gold);
    color: #000;
    font-weight: 600;
    font-size: 15px;
    padding: 16px 40px;
    border-radius: 3px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 0 40px rgba(201,168,76,0.3);
    letter-spacing: 0.3px;
  }

  .hp-hero-cta:hover {
    background: var(--gold-light);
    transform: translateY(-2px);
    box-shadow: 0 8px 48px rgba(201,168,76,0.45);
  }

  .hp-dots {
    position: absolute;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
  }

  .hp-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: none;
    background: rgba(201,168,76,0.35);
    cursor: pointer;
    transition: background 0.3s, transform 0.3s;
    padding: 0;
  }

  .hp-dot--active {
    background: var(--gold);
    transform: scale(1.3);
  }

  .hp-trust {
    background: var(--dark2);
    border-top: 1px solid rgba(201,168,76,0.12);
    border-bottom: 1px solid rgba(201,168,76,0.12);
    padding: 40px 24px;
    text-align: center;
  }

  .hp-trust-label {
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 28px;
    font-weight: 500;
  }

  .hp-trust-grid {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 32px 48px;
    max-width: 900px;
    margin: 0 auto;
  }

  .hp-trust-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transition: transform 0.2s;
  }

  .hp-trust-item:hover { transform: translateY(-3px); }

  .hp-trust-img {
    height: 44px;
    width: auto;
    object-fit: contain;
    filter: brightness(0) invert(1);
    opacity: 0.75;
  }

  .hp-trust-text {
    font-size: 12px;
    letter-spacing: 1px;
    color: var(--white-dim);
    text-transform: uppercase;
    font-weight: 400;
  }

  .hp-social-proof {
    background: var(--dark3);
    border-bottom: 1px solid rgba(201,168,76,0.1);
    padding: 14px 24px;
    text-align: center;
    font-size: 14px;
    color: var(--white-dim);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .hp-social-proof strong { color: var(--gold); }

  .hp-social-proof-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold);
    opacity: 0.6;
    display: inline-block;
  }

  .hp-products {
    padding: 80px 24px 100px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .hp-section-header {
    text-align: center;
    margin-bottom: 56px;
  }

  .hp-section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    margin-bottom: 12px;
    line-height: 1.2;
  }

  .hp-section-sub {
    font-size: 15px;
    color: var(--white-dim);
    font-weight: 300;
  }

  .hp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2px;
    background: rgba(201,168,76,0.08);
    border: 1px solid rgba(201,168,76,0.12);
  }

  .hp-card {
    background: var(--dark2);
    transition: background 0.3s;
    display: flex;
    flex-direction: column;
  }

  .hp-card:hover { background: var(--dark3); }

  .hp-card-img-wrap {
    position: relative;
    overflow: hidden;
    display: block;
    aspect-ratio: 4/3;
  }

  .hp-card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .hp-card:hover .hp-card-img { transform: scale(1.05); }

  .hp-card-badge {
    position: absolute;
    top: 14px;
    left: 14px;
    background: var(--gold);
    color: #000;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 2px;
  }

  .hp-card-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .hp-card-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.15rem;
    font-weight: 700;
    margin-bottom: 12px;
    color: var(--white);
    text-decoration: none;
    line-height: 1.3;
  }

  .hp-card-name a { color: inherit; text-decoration: none; }

  .hp-card-pricing {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .hp-card-price {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--gold);
    font-family: 'Playfair Display', serif;
  }

  .hp-card-strike {
    font-size: 14px;
    color: var(--white-dim);
    text-decoration: line-through;
    font-weight: 300;
  }

  .hp-card-discount {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #000;
    background: var(--gold);
    padding: 3px 8px;
    border-radius: 2px;
  }

  .hp-card-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: auto;
    background: transparent;
    border: 1px solid rgba(201,168,76,0.35);
    color: var(--gold);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.5px;
    padding: 11px 20px;
    border-radius: 2px;
    text-decoration: none;
    transition: all 0.2s;
    width: fit-content;
  }

  .hp-card-btn:hover {
    background: var(--gold);
    color: #000;
    border-color: var(--gold);
  }

  .hp-loading {
    text-align: center;
    padding: 80px 24px;
    color: var(--white-dim);
    font-size: 15px;
    font-weight: 300;
  }

  .hp-loading-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold);
    margin: 0 3px;
    animation: loadingBounce 1.2s infinite;
  }

  .hp-loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .hp-loading-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes loadingBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-8px); opacity: 1; }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 640px) {
    .hp-trust-grid { gap: 24px 32px; }
    .hp-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 420px) {
    .hp-grid { grid-template-columns: 1fr; }
  }
`;

const trustBadges = [
  { src: "https://i.ibb.co/Xf3yCrN4/image.png", alt: "Secure Payment" },
  { src: "https://i.ibb.co/x8j8N7Pr/image.png", alt: "SSL Certified" },
  { src: "https://i.ibb.co/wNJpGYyz/image.png", alt: "Fast Shipping" },
  { src: "https://i.ibb.co/T9ddrcV/image.png", alt: "24/7 Customer Support" },
];

const slides = [
  { img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f" },
  { img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c" },
  { img: "https://images.unsplash.com/photo-1556740749-887f6717d7e4" },
];

const marqueeText = "📣 More than 80% off on digital products! 🛒 ✨ Limited Time Offer!  🚚 Instant Digital Delivery on all products! ⚡ TradingView Premium starting at ₹495! 🔥";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("https://dexterluxuries-backend-6ptn.onrender.com/api/products")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{style}</style>
      <div className="hp-root">

        <div className="hp-announce-bar">
          <div className="hp-marquee-track">
            <span>{marqueeText}</span>
            <span>{marqueeText}</span>
          </div>
        </div>

        <section className="hp-hero">
          <div className="hp-slides">
            {slides.map((slide, i) => (
              <div key={i} className={`hp-slide ${i === current ? "hp-slide--active" : ""}`}>
                <img src={slide.img} alt="banner" className="hp-slide-img" />
                <div className="hp-slide-overlay" />
              </div>
            ))}
          </div>
          <div className="hp-hero-content">
            <p className="hp-hero-eyebrow">✦ Premium Digital Store ✦</p>
            <h1 className="hp-hero-title">
              Unlock <span className="hp-hero-accent">Digital</span> Excellence
            </h1>
            <p className="hp-hero-sub">Top-tier digital products at unbeatable prices — instant delivery, zero compromise.</p>
            <a href="#products" className="hp-hero-cta">Shop Now →</a>
          </div>
          <div className="hp-dots">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`hp-dot ${current === i ? "hp-dot--active" : ""}`} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </section>

        <div className="hp-social-proof">
          <span className="hp-social-proof-dot" />
          🎉 Join <strong>50,000+</strong> traders and digital users exploring our premium collection! New products added weekly.
          <span className="hp-social-proof-dot" />
        </div>

        <section className="hp-products" id="products">
          <div className="hp-section-header">
            <h2 className="hp-section-title">Featured Products 🔥</h2>
            <p className="hp-section-sub">Handpicked digital gems — instant delivery, lifetime access</p>
          </div>

          {loading ? (
            <div className="hp-loading">
              <span className="hp-loading-dot" />
              <span className="hp-loading-dot" />
              <span className="hp-loading-dot" />
              <p style={{ marginTop: 16 }}>Loading products, please wait...</p>
            </div>
          ) : (
            <div className="hp-grid">
              {products.map((product) => (
                <div key={product.id} className="hp-card">
                  <Link to={`/product/${product.id}`} className="hp-card-img-wrap">
                    <img src={product.image} alt={product.name} className="hp-card-img" />
                    <div className="hp-card-badge">Digital</div>
                  </Link>
                  <div className="hp-card-body">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="hp-card-name">{product.name}</h3>
                    </Link>
                    <div className="hp-card-pricing">
                      <span className="hp-card-price">₹{product.price}</span>
                      {product.strikeThroughPrice && (
                        <>
                          <span className="hp-card-strike">₹{product.strikeThroughPrice}</span>
                          <span className="hp-card-discount">
                            {Math.round(((product.strikeThroughPrice - product.price) / product.strikeThroughPrice) * 100)}% off
                          </span>
                        </>
                      )}
                    </div>
                    <Link to={`/product/${product.id}`} className="hp-card-btn">View Details →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default HomePage;
