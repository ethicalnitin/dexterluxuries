import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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
import PaymentPage from "./pages/PaymentPage";
import NotFound from "./pages/NotFound";
import OfferPopup from "./components/OfferPopup";
import { AuthProvider } from "./pages/AuthContext";

// Start each page at the top — the hash router doesn't do this on its own.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        {/* A "#main" href would be read as a route by the hash router, so focus it directly. */}
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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/proofs" element={<Proofs />} />
            <Route path="/filedelivery" element={<AdminPage />} />
            <Route path="/orderpage" element={<OrdersPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <WhatsappButton />
        <OfferPopup />
      </Router>
    </AuthProvider>
  );
}

export default App;
