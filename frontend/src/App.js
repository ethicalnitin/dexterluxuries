import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";
import { Footer } from "./components/Footer";
import RefundPolicy from './pages/RefundPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Proofs from './pages/Proofs';
import WhatsappButton from "./components/WhatsappButton";
import AdminPage from "./pages/AdminPage";
import OrdersPage from "./pages/OrdersPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import NotFound from "./pages/NotFound";
import OfferPopup from "./components/OfferPopup";
import { AuthProvider } from "./pages/AuthContext";
import { CartProvider } from "./pages/CartContext";
import CartPage from "./pages/CartPage";
import RequireAuth from "./components/RequireAuth";
import ErrorBoundary from "./components/ErrorBoundary";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <a
            href="#main-content"
            className="ui-skip-link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("main-content")?.focus();
            }}
          >
            Skip to content
          </a>
          <Navbar />
          <main className="ui-main" id="main-content" tabIndex={-1}>
            <PageErrorBoundary>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/proofs" element={<Proofs />} />
                <Route
                  path="/filedelivery"
                  element={
                    <RequireAuth role="admin">
                      <AdminPage />
                    </RequireAuth>
                  }
                />
                <Route path="/orderpage" element={<OrdersPage />} />
                <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
                <Route path="/orders/:id" element={<RequireAuth><OrderDetailsPage /></RequireAuth>} />
                <Route path="/account/orders" element={<RequireAuth><OrderHistoryPage /></RequireAuth>} />
                <Route path="/payment" element={<Navigate to="/cart" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageErrorBoundary>
          </main>
          <Footer />
          <WhatsappButton />
          <OfferPopup />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
