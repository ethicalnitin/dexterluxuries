import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";
import { Footer } from "./components/Footer";
import RefundPolicy from './pages/RefundPolicy';  // Import the Refund Policy page
import PrivacyPolicy from './pages/PrivacyPolicy';  // Import the Privacy Policy page
import Proofs from './pages/Proofs';  // Import the Privacy Policy page


import './index.css';

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
        </Routes>
        <Footer />
      </Router>
      
    );
  
}


export default App;
