import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LuMenu, LuX, LuUserCircle, LuLogOut, LuChevronDown } from "react-icons/lu";
import { FaTelegram } from "react-icons/fa6";
import theme from "../theme/theme";
import { useAuth } from "../pages/AuthContext";
import { Button } from "./ui";
import "./layout.css";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Proofs & Vouches", to: "/proofs" },
];

const TELEGRAM_URL = "https://t.me/dexterluxuries";

// Signed-in account button + dropdown (name, email, log out).
function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const displayName = user?.name || user?.email || "";
  const firstName = displayName.split(/[\s@]/)[0];

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={wrapRef}>
      <button
        type="button"
        className="account-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${displayName}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="account-menu__avatar" aria-hidden="true">
          {firstName.charAt(0).toUpperCase()}
        </span>
        <span className="account-menu__name">{firstName}</span>
        <LuChevronDown className="account-menu__chevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="account-menu__panel" role="menu">
          <div className="account-menu__identity">
            {user?.name && <strong>{user.name}</strong>}
            <span>{user?.email}</span>
          </div>
          <button
            type="button"
            role="menuitem"
            className="account-menu__item"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LuLogOut aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isAuthenticated, openLogin, openSignup, logout } = useAuth();
  const { pathname } = useLocation();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const handleLogin = () => {
    setDrawerOpen(false);
    openLogin();
  };

  const handleSignup = () => {
    setDrawerOpen(false);
    openSignup();
  };

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
  };

  return (
    <>
    <header className="site-header">
      <div className="ui-container site-header__inner">
        <Link to="/" className="site-brand" aria-label={`${theme.brand.name} — home`}>
          <img src={theme.brand.logo} alt="" className="site-brand__logo" width="36" height="36" />
          <span className="site-brand__name">{theme.brand.name}</span>
        </Link>

        <nav className="site-nav" aria-label="Main">
          {navLinks.map(({ label, to }) => (
            <NavLink key={to} to={to} end={to === "/"} className="site-nav__link">
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions">
          <Button
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            size="sm"
            iconOnly
            className="site-header__telegram"
            aria-label="Join our Telegram"
            title="Join our Telegram"
          >
            <FaTelegram />
          </Button>

          {isAuthenticated ? (
            <AccountMenu user={user} onLogout={logout} />
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={openLogin} className="site-header__login" icon={<LuUserCircle />}>
                Log in
              </Button>
              <Button variant="primary" size="sm" onClick={openSignup} className="site-header__signup">
                Sign up
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            iconOnly
            className="site-header__menu"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            aria-controls="site-drawer"
          >
            <LuMenu />
          </Button>
        </div>
      </div>
    </header>

      {/* ---------- Mobile / tablet drawer ----------
          Rendered outside the header element: its backdrop-filter would
          otherwise trap these fixed-position layers inside its 64px box. */}
      <div
        className={`site-drawer-backdrop${drawerOpen ? " is-open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="site-drawer"
        className={`site-drawer${drawerOpen ? " is-open" : ""}`}
        aria-label="Menu"
        aria-hidden={!drawerOpen}
        inert={drawerOpen ? undefined : ""}
      >
        <div className="site-drawer__head">
          <span className="ui-eyebrow">Menu</span>
          <Button variant="ghost" size="sm" iconOnly onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <LuX />
          </Button>
        </div>

        <nav className="site-drawer__nav" aria-label="Mobile">
          {navLinks.map(({ label, to }) => (
            <NavLink key={to} to={to} end={to === "/"} className="site-drawer__link">
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="site-drawer__section">
          {isAuthenticated ? (
            <>
              <div className="site-drawer__user">
                <LuUserCircle aria-hidden="true" />
                <span>
                  {user?.name && <strong>{user.name}</strong>}
                  {user?.email}
                </span>
              </div>
              <Button variant="secondary" block onClick={handleLogout} icon={<LuLogOut />}>
                Log out
              </Button>
            </>
          ) : (
            <div className="ui-stack" style={{ "--stack-gap": "var(--space-2)" }}>
              <Button variant="primary" block onClick={handleSignup}>
                Create account
              </Button>
              <Button variant="secondary" block onClick={handleLogin} icon={<LuUserCircle />}>
                Log in
              </Button>
            </div>
          )}
          <Button
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            block
            icon={<FaTelegram />}
          >
            Join our Telegram
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
