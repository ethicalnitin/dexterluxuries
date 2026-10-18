import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaFacebook, FaTelegram } from "react-icons/fa6";
import theme from "../theme/theme";
import "./layout.css";

// Social and contact destinations are kept exactly as they were.
const socials = [
  { label: "Instagram", href: "https://www.instagram.com/chartvault.store_official", Icon: FaInstagram },
  { label: "Facebook", href: "https://www.facebook.com/", Icon: FaFacebook },
  { label: "Telegram", href: "https://t.me/aasarambapu", Icon: FaTelegram },
];

const navigation = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
  { label: "Proofs & Vouches", to: "/proofs" },
];

const legal = [
  { label: "Refund Policy", to: "/refund-policy" },
  { label: "Privacy Policy", to: "/privacy-policy" },
];

export const Footer = () => {
  const { brand } = theme;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="ui-container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Link to="/" className="site-brand">
              <img src={brand.logo} alt="" className="site-brand__logo" width="36" height="36" />
              <span className="site-brand__name site-brand__name--full">{brand.name}</span>
            </Link>
            <p className="site-footer__desc">{brand.description}</p>
            <div className="site-footer__socials">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="site-footer__social"
                  aria-label={label}
                >
                  <Icon aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="site-footer__title">Navigation</h2>
            <ul className="site-footer__links">
              {navigation.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="site-footer__title">Legal</h2>
            <ul className="site-footer__links">
              {legal.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="site-footer__title">Contact</h2>
            <dl className="site-footer__contact">
              <div>
                <dt>Email</dt>
                <dd>
                  <a href="mailto:leader@cybermafia.shop">leader@cybermafia.shop</a>
                </dd>
              </div>
              <div>
                <dt>Telegram</dt>
                <dd>
                  <a href="https://t.me/aasarambapu" target="_blank" rel="noopener noreferrer">
                    @mkrtoolsandsoftwares
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>
            © {brand.foundedYear}–{year} {brand.name}. All rights reserved.
          </p>
          <p className="site-footer__tagline">{brand.tagline}</p>
        </div>
      </div>
    </footer>
  );
};
