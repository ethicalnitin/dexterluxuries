import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Homepage.css";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [current, setCurrent] = useState(0);

  const trustBadges = [
    { src: "https://i.ibb.co/Xf3yCrN4/image.png", alt: "Secure Payment" },
    { src: "https://i.ibb.co/x8j8N7Pr/image.png", alt: "SSL Certified" },
    { src: "https://i.ibb.co/wNJpGYyz/image.png", alt: "Fast Shipping" },
    { src: "https://i.ibb.co/T9ddrcV/image.png", alt: "24/7 Customer Support" },
  ];

  const slides = [
    {
      title: "",
      desc: "",
      img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    },
    {
      title: "",
      desc: "",
      img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    },
    {
      title: "",
      desc: "",
      img: "https://images.unsplash.com/photo-1556740749-887f6717d7e4",
    },
  ];

  useEffect(() => {
    fetch("https://dexterluxuries-1.onrender.com/api/products/")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setProducts(data))
      .catch((error) => console.error("Error fetching products:", error));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="hp-root">
      {/* Announcement bar */}
      <div className="hp-announce-bar">
        <div className="marquee">
          <span>
            📣 More than 80% off on digital products!&nbsp;&nbsp;🛒&nbsp;&nbsp;✨
            Limited Time Offer!&nbsp;&nbsp;✨&nbsp;&nbsp;Free Shipping on Orders
            over $100!&nbsp;&nbsp;🚚&nbsp;&nbsp;Instant Digital Delivery on all
            products!&nbsp;&nbsp;⚡
          </span>
        </div>
      </div>

      {/* Hero Slider */}
      <section className="hp-hero">
        <div className="hp-slides">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`hp-slide ${index === current ? "hp-slide--active" : ""}`}
            >
              <img src={slide.img} alt="banner" className="hp-slide-img" />
              <div className="hp-slide-overlay" />
            </div>
          ))}
        </div>

        {/* Hero text overlay */}
        <div className="hp-hero-content">
          <p className="hp-hero-eyebrow">✦ Premium Digital Store ✦</p>
          <h1 className="hp-hero-title">
            Unlock <span className="hp-hero-accent">Digital</span> Excellence
          </h1>
          <p className="hp-hero-sub">
            Top-tier digital products at unbeatable prices
          </p>
          <a href="#products" className="hp-hero-cta">
            Shop Now <span>→</span>
          </a>
        </div>

        {/* Dots */}
        <div className="hp-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`hp-dot ${current === i ? "hp-dot--active" : ""}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="hp-trust">
        <p className="hp-trust-label">Shop with Confidence</p>
        <div className="hp-trust-grid">
          {trustBadges.map((badge, index) => (
            <div key={index} className="hp-trust-item">
              <img src={badge.src} alt={badge.alt} className="hp-trust-img" />
              <span className="hp-trust-text">{badge.alt}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof banner */}
      <div className="hp-social-proof">
        <span className="hp-social-proof-dot" />
        🎉Join <strong>100+</strong> active users exploring our luxurious
        collection!&nbsp;&nbsp;New products added weekly!
        <span className="hp-social-proof-dot" />
      </div>

      {/* Products */}
      <section className="hp-products" id="products">
        <div className="hp-section-header">
          <h2 className="hp-section-title">
            Featured Products <span>🔥</span>
          </h2>
          <p className="hp-section-sub">
            Handpicked digital gems — instant download, lifetime access
          </p>
        </div>

        <div className="hp-grid">
          {products.map((product) => (
            <div key={product.id} className="hp-card">
              <Link to={`/product/${product.id}`} className="hp-card-img-wrap">
                <img
                  src={product.image}
                  alt={product.name}
                  className="hp-card-img"
                />
                <div className="hp-card-badge">Digital</div>
              </Link>

              <div className="hp-card-body">
                <Link to={`/product/${product.id}`}>
                  <h3 className="hp-card-name">{product.name}</h3>
                </Link>

                <div className="hp-card-pricing">
                  <span className="hp-card-price">₹{product.price}</span>
                  <span className="hp-card-strike">
                    ₹{product.strikeThroughPrice}
                  </span>
                  {product.strikeThroughPrice && (
                    <span className="hp-card-discount">
                      {Math.round(
                        ((product.strikeThroughPrice - product.price) /
                          product.strikeThroughPrice) *
                          100
                      )}
                      % off
                    </span>
                  )}
                </div>

                <Link to={`/product/${product.id}`} className="hp-card-btn">
                  View Details <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
