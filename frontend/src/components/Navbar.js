import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LuMenu, LuX, LuUser, LuLogOut, LuChevronDown, LuPackageCheck, LuShoppingCart, LuReceipt, LuSearch } from "react-icons/lu";
import { FaTelegram } from "react-icons/fa6";
import theme from "../theme/theme";
import { useAuth } from "../pages/AuthContext";
import { useCart } from "../pages/CartContext";
import { getProducts } from "../api/products";
import { Button } from "./ui";
import "./layout.css";

const pageLinks = [
  { label: "Delivery proofs", to: "/proofs" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const TELEGRAM_URL = "https://t.me/dexterluxuries";
const ADMIN_PATH = "/filedelivery";
const ORDERS_PATH = "/account/orders";

function useCategories() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    let cancelled = false;
    getProducts()
      .then((products) => {
        if (cancelled) return;
        const counts = new Map();
        products.forEach((p) => {
          if (p.category) counts.set(p.category, (counts.get(p.category) || 0) + 1);
        });
        setCategories([...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return categories;
}

function SearchForm({ id, className = "" }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const current = pathname === "/" ? params.get("q") || "" : "";
  const [value, setValue] = useState(current);

  useEffect(() => {
    setValue(current);
  }, [current]);

  const submit = (e) => {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
  };

  return (
    <form role="search" className={`site-search ${className}`} onSubmit={submit}>
      <label htmlFor={id} className="ui-visually-hidden">
        Search products
      </label>
      <input
        id={id}
        type="search"
        className="site-search__input"
        placeholder="Search subscriptions, tools and courses"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
      />
      <button type="submit" className="site-search__submit" aria-label="Search">
        <LuSearch aria-hidden="true" />
      </button>
    </form>
  );
}

function AccountMenu({ user, isAdmin, onLogout }) {
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
          <Link to={ORDERS_PATH} role="menuitem" className="account-menu__item" onClick={() => setOpen(false)}>
            <LuReceipt aria-hidden="true" /> My orders
          </Link>
          {isAdmin && (
            <Link to={ADMIN_PATH} role="menuitem" className="account-menu__item" onClick={() => setOpen(false)}>
              <LuPackageCheck aria-hidden="true" /> Order fulfillment
            </Link>
          )}
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

function CartLink() {
  const { count } = useCart();
  const label = count ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart, empty";
  return (
    <NavLink to="/cart" className="site-cart" aria-label={label} title="Cart">
      <LuShoppingCart aria-hidden="true" />
      <span className="site-cart__label" aria-hidden="true">
        Cart
      </span>
      {count > 0 && (
        <span className="site-cart__count" aria-hidden="true">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </NavLink>
  );
}

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, openLogin, openSignup, logout } = useAuth();
  const { pathname, search } = useLocation();
  const categories = useCategories();
  const activeCategory = useMemo(() => (pathname === "/" ? new URLSearchParams(search).get("category") : null), [pathname, search]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname, search]);

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

  const categoryHref = (name) => `/?category=${encodeURIComponent(name)}`;

  return (
    <>
      <header className="site-header">
        <div className="ui-container site-header__bar">
          <button
            type="button"
            className="site-header__menu"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            aria-controls="site-drawer"
          >
            <LuMenu aria-hidden="true" />
          </button>

          <Link to="/" className="site-brand" aria-label={`${theme.brand.name} — home`}>
            <img src={theme.brand.logo} alt="" className="site-brand__logo" width="36" height="36" />
            <span className="site-brand__name">{theme.brand.name}</span>
          </Link>

          <SearchForm id="site-search-desktop" className="site-search--bar" />

          <div className="site-header__actions">
            {isAuthenticated ? (
              <AccountMenu user={user} isAdmin={isAdmin} onLogout={logout} />
            ) : (
              <button type="button" className="site-signin" onClick={openLogin} aria-label="Sign in">
                <LuUser aria-hidden="true" />
                <span>Sign in</span>
              </button>
            )}
            <CartLink />
          </div>
        </div>
      </header>

      <div className="site-subnav">
        <div className="ui-container">
          <SearchForm id="site-search-mobile" className="site-search--row" />
        </div>
        <nav className="ui-container site-cats" aria-label="Shop by category">
          <ul className="site-cats__list">
            <li>
              <Link to="/" className={`site-cats__link${pathname === "/" && !activeCategory ? " is-active" : ""}`}>
                All products
              </Link>
            </li>
            {categories.map((name) => (
              <li key={name}>
                <Link to={categoryHref(name)} className={`site-cats__link${activeCategory === name ? " is-active" : ""}`}>
                  {name}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="site-cats__pages">
            {pageLinks.map(({ label, to }) => (
              <li key={to}>
                <NavLink to={to} className="site-cats__page">
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

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
          <span className="site-drawer__title">Menu</span>
          <Button variant="ghost" size="sm" iconOnly onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <LuX />
          </Button>
        </div>

        <nav className="site-drawer__nav" aria-label="Categories">
          <p className="site-drawer__label">Shop</p>
          <Link to="/" className="site-drawer__link">
            All products
          </Link>
          {categories.map((name) => (
            <Link key={name} to={categoryHref(name)} className="site-drawer__link">
              {name}
            </Link>
          ))}
        </nav>

        <nav className="site-drawer__nav" aria-label="Store">
          <p className="site-drawer__label">Store</p>
          {pageLinks.map(({ label, to }) => (
            <NavLink key={to} to={to} className="site-drawer__link">
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="site-drawer__section">
          {isAuthenticated ? (
            <>
              <div className="site-drawer__user">
                <LuUser aria-hidden="true" />
                <span>
                  {user?.name && <strong>{user.name}</strong>}
                  {user?.email}
                </span>
              </div>
              <Button to={ORDERS_PATH} variant="secondary" block icon={<LuReceipt />}>
                My orders
              </Button>
              {isAdmin && (
                <Button to={ADMIN_PATH} variant="secondary" block icon={<LuPackageCheck />}>
                  Order fulfillment
                </Button>
              )}
              <Button variant="ghost" block onClick={handleLogout} icon={<LuLogOut />}>
                Log out
              </Button>
            </>
          ) : (
            <div className="ui-stack" style={{ "--stack-gap": "var(--space-2)" }}>
              <Button variant="primary" block onClick={handleLogin}>
                Sign in
              </Button>
              <Button variant="secondary" block onClick={handleSignup}>
                Create an account
              </Button>
            </div>
          )}
          <Button href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" variant="ghost" block icon={<FaTelegram />}>
            Telegram channel
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
