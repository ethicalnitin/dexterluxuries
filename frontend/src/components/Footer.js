import React from 'react';
import { Link } from 'react-router-dom';

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700&family=DM+Sans:wght@300;400;500&display=swap');

  .footer-root {
    background: #080808;
    color: #F5F0E8;
    font-family: 'DM Sans', sans-serif;
    border-top: 1px solid rgba(201,168,76,0.2);
  }

  .footer-top {
    max-width: 1200px;
    margin: 0 auto;
    padding: 64px 32px 48px;
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr;
    gap: 48px;
  }

  .footer-brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #C9A84C;
    margin-bottom: 14px;
    letter-spacing: 0.5px;
  }

  .footer-brand-desc {
    font-size: 14px;
    color: rgba(245,240,232,0.55);
    line-height: 1.75;
    font-weight: 300;
    max-width: 280px;
    margin-bottom: 28px;
  }

  .footer-socials {
    display: flex;
    gap: 14px;
  }

  .footer-social-link {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid rgba(201,168,76,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(245,240,232,0.6);
    font-size: 15px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .footer-social-link:hover {
    border-color: #C9A84C;
    color: #C9A84C;
    background: rgba(201,168,76,0.08);
    transform: translateY(-2px);
  }

  .footer-col-title {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #C9A84C;
    font-weight: 500;
    margin-bottom: 24px;
  }

  .footer-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .footer-links a {
    font-size: 14px;
    color: rgba(245,240,232,0.55);
    text-decoration: none;
    font-weight: 300;
    transition: color 0.2s, padding-left 0.2s;
    display: inline-block;
  }

  .footer-links a:hover {
    color: #C9A84C;
    padding-left: 4px;
  }

  .footer-contact-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 18px;
  }

  .footer-contact-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(245,240,232,0.35);
    font-weight: 500;
  }

  .footer-contact-value {
    font-size: 14px;
    color: rgba(245,240,232,0.7);
    font-weight: 300;
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-contact-value:hover { color: #C9A84C; }

  .footer-divider {
    border: none;
    border-top: 1px solid rgba(201,168,76,0.1);
    margin: 0;
  }

  .footer-bottom {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .footer-copy {
    font-size: 12px;
    color: rgba(245,240,232,0.3);
    font-weight: 300;
    letter-spacing: 0.3px;
  }

  .footer-copy span { color: #C9A84C; }

  .footer-bottom-links {
    display: flex;
    gap: 24px;
  }

  .footer-bottom-links a {
    font-size: 12px;
    color: rgba(245,240,232,0.3);
    text-decoration: none;
    transition: color 0.2s;
    font-weight: 300;
  }

  .footer-bottom-links a:hover { color: #C9A84C; }

  @media (max-width: 768px) {
    .footer-top {
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }

    .footer-brand { grid-column: 1 / -1; }
    .footer-brand-desc { max-width: 100%; }

    .footer-bottom {
      flex-direction: column;
      text-align: center;
    }

    .footer-bottom-links { justify-content: center; flex-wrap: wrap; gap: 16px; }
  }

  @media (max-width: 480px) {
    .footer-top { grid-template-columns: 1fr; }
  }
`;

export const Footer = () => {
  return (
    <>
      <style>{style}</style>
      <footer className="footer-root">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-brand-name">Dexter Luxuries</div>
            <p className="footer-brand-desc">
              India's trusted digital product store since 2021. Serving 50,000+ traders and enthusiasts with premium subscriptions at unbeatable prices.
            </p>
            <div className="footer-socials">
              <a href="https://www.instagram.com/cybermafia.shop" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://www.facebook.com/cybermafia.shop" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://t.me/cybermafia.shop" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Telegram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <p className="footer-col-title">Navigation</p>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/Proofs">Proofs & Vouches</Link></li>
            </ul>
          </div>

          <div>
            <p className="footer-col-title">Legal & Contact</p>
            <ul className="footer-links">
              <li><Link to="/refund-policy">Refund Policy</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            </ul>
            <div style={{ marginTop: 28 }}>
              <div className="footer-contact-item">
                <span className="footer-contact-label">Email</span>
                <a href="mailto:leader@cybermafia.shop" className="footer-contact-value">leader@cybermafia.shop</a>
              </div>
              <div className="footer-contact-item">
                <span className="footer-contact-label">Telegram</span>
                <a href="https://t.me/dexterluxuries" target="_blank" rel="noopener noreferrer" className="footer-contact-value">@dexterluxuries</a>
              </div>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-copy">© 2021–2025 <span>Dexter Luxuries</span>. All Rights Reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/refund-policy">Refund Policy</Link>
            <Link to="/about">About</Link>
          </div>
        </div>
      </footer>
    </>
  );
};