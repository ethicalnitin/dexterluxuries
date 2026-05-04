import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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


import './index.css';
import AdminPage from "./pages/AdminPage";
import OrdersPage from "./pages/OrdersPage";
import PaymentPage from "./pages/PaymentPage";

function App(){

 
  
    return (
      <Router>
       
        <Navbar />
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
        </Routes>
        <Footer />
        <WhatsappButton />
      </Router>
      
    );
  
}


export default App;
