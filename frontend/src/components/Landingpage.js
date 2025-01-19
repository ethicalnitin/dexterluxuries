import React, { useEffect, useState } from 'react';
import { FaWhatsapp, FaTelegram, FaStar } from 'react-icons/fa';
import logo from './lgo.jpeg';
import productImage from './finalbcpost.png';
import {Footer} from './Footer';

const Landingpage = () => {
  const [selectedPlan, setSelectedPlan] = useState('Lifetime');
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const planDetails = {
    'Lifetime': { price: 297, strikeThroughPrice: 999 },
  };

  const whatsappUrl = `https://wa.me/7533833069`;
  const telegramUrl = `https://t.me/dextersenior`;
  const proofsUrl = 'https://shorturl.at/Nsuke';

  // Function to send events to backend for Conversion API
  const sendEventToBackend = async (eventName, additionalData = {}) => {
    const backendUrl = 'https://backend1-ztvf.onrender.com/track-event'; // Your backend URL

    const postData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: window.location.href,
      action_source: 'website',
      user_data: {
        email: 'testuser@example.com', // Replace with real user data
        client_ip_address: await fetch('https://api64.ipify.org?format=json').then(res => res.json()).then(data => data.ip), // Fetch IP dynamically
        client_user_agent: navigator.userAgent
      },
      ...additionalData
    };

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        console.error('Error sending event to backend:', response);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Track PageView on load (both browser-side and server-side)
  useEffect(() => {
    // Browser-side pixel tracking
    
     
    // Server-side tracking via CAPI
    sendEventToBackend('PageView');
console.log('pageview capi lp done');
  }, []);

  // Handle WhatsApp button click (both browser-side and server-side)
  const handleWhatsappClick = () => {
    // Browser-side pixel tracking
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: 'WhatsApp Contact',
        content_category: 'Contact',
        content_type: 'button',
      });
    }

    // Server-side tracking via CAPI
    sendEventToBackend('ViewContent', {
      custom_data: {
        content_name: 'WhatsApp Contact',
        content_category: 'Contact',
      }
    });

    window.open(whatsappUrl, '_blank');
  };

  // Handle Proofs button click (both browser-side and server-side)
  const handleProofsClick = () => {
    // Browser-side pixel tracking
    if (window.fbq) {
      window.fbq('trackCustom', 'ProofAndVouches', {
        action: 'Click',
      });
    }

    // Server-side tracking via CAPI
    sendEventToBackend('ProofAndVouches', {
      custom_data: {
        action: 'Click',
      }
    });

    window.open(proofsUrl, '_blank');
  };

  // Handle Telegram button click (browser only)
  const handleTelegramClick = () => {
    // Browser-side pixel tracking
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: 'Telegram',
        content_category: 'Contact',
        content_type: 'button',
      });
    }

    // Server-side tracking via CAPI
    sendEventToBackend('ViewContent', {
      custom_data: {
        content_name: 'Telegram',
        content_category: 'Contact',
      }
    });

    window.open(telegramUrl, '_blank');
  };

  // Handle Buy Now button click (both browser-side and server-side)
  const handleBuyNowClick = async () => {
    // If already loading, prevent multiple clicks
    if (isLoading) return;
  
    setIsLoading(true); // Set loading state to true when Buy Now is clicked
    const planPrice = planDetails[selectedPlan].price;
  
    // Browser-side pixel tracking
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: planPrice,
        currency: 'INR',
        content_ids: [`plan_${selectedPlan}`],
        content_type: 'product',
        num_items: 1,
      });
    }
  
    // Server-side tracking via CAPI
    try {
      await sendEventToBackend('InitiateCheckout', {
        custom_data: {
          value: planPrice,
          currency: 'INR',
          content_ids: [`plan_${selectedPlan}`],
        }
      });
  
      console.log('pageview capi lp done');
      window.location.href = `https://payments.cybermafia.shop?amount=${planPrice}`;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false); // Reset loading state after the redirect or error
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-white text-center p-2">
  <header className="w-full bg-white shadow-md py-4 px-6 fixed top-0 left-0 flex justify-between items-center z-10 flex-wrap">
    <div className="flex items-center flex-shrink-0">
      <img src={logo} alt="Dexter Luxuries Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-full mr-2" />
      <h1 className="text-base md:text-lg font-bold text-black uppercase tracking-wide whitespace-nowrap">
        Dexter Luxuries
      </h1>
    </div>

    <div className="flex items-center space-x-2 md:space-x-4 mt-2 md:mt-0">
      <button onClick={handleWhatsappClick} className="bg-green-500 text-white p-2 md:py-3 md:px-6 rounded-full hover:bg-green-600 transition duration-300 shadow-md">
        <FaWhatsapp />
      </button>
      <button onClick={handleTelegramClick} className="bg-blue-500 text-white p-2 md:py-3 md:px-6 rounded-full hover:bg-blue-600 transition duration-300 shadow-md">
        <FaTelegram />
      </button>
    </div>
  </header>

  <div className="pt-24 flex flex-col justify-center items-center mb-40">
    <h2 className="text-2xl font-bold mb-4 text-left w-full max-w-md">#1211 - Software Engineering Placement Bundle - You can't miss this! {selectedPlan.replace('-', ' ')} Access ✅</h2>

    <img src={productImage} alt="TradingView Premium Plan" className="w-full max-w-xs sm:max-w-md rounded-lg shadow-md mb-4" />

    <div className="flex space-x-4 mb-8">
      <button onClick={() => setSelectedPlan('Lifetime')} className={`py-2 px-4 rounded-full text-white font-semibold ${selectedPlan === 'Lifetime' ? 'bg-red-500' : 'bg-gray-400'}`}>
      Lifetime
      </button>
     
    </div>

    <div className="flex items-center text-yellow-400 mb-6 text-center w-full max-w-md">
      <div className="flex items-center">
        <FaStar className="text-2xl" />
        <FaStar className="text-2xl" />
        <FaStar className="text-2xl" />
        <FaStar className="text-2xl" />
      </div>
      <span className="ml-2 text-black font-semibold text-lg">4.6/5</span>
      <button onClick={handleProofsClick} className="ml-4 text-blue-500 hover:underline">
        Proofs And Vouches
      </button>
    </div>

    <div className="text-black text-left max-w-md space-y-6 mb-16">

    <h3 className="text-xl font-semibold">What's Included :</h3>
    <ul className="list-disc pl-5 space-y-2">
    <li>300+ DSA questions asked in <strong>actual OA rounds in 2020-2024 tenure</strong> + Tailored Resume with <strong>80+</strong>ATS score +Source Code for <strong>Personal Portfolio Website</strong>+ Core Subject Notes + Programing Languages Notes </li>
    </ul>

  <h3 className="text-xl font-semibold">Crack Your Dream Job with Our Placement Bundle 💼:</h3>
  <ul className="list-disc pl-5 space-y-2">
    <li><strong>Customized DSA Question Bank:</strong> Handpicked questions from actual Online Assessment (OA) rounds of top companies, compiled from verified sources and Telegram groups.</li>
    <li><strong>ATS-Friendly Resume Template:</strong> Achieve an ATS score of 80+ and make your resume stand out in automated screenings.</li>
    <li><strong>Comprehensive Notes:</strong> Detailed PDFs covering core CS subjects like Operating Systems (OS), DBMS, and Computer Networking.</li>
    <li><strong>Programming Language Notes:</strong> Easy-to-understand guides for C, Python, and Artificial Intelligence (AI).</li>
    <li><strong>Machine Learning Notes:</strong> Simplified concepts to get you interview-ready for ML-based roles.</li>
    <li><strong>Interview Questions:</strong> A thorough collection of technical and HR interview questions for better preparation.</li>
    <li><strong>Real-World Insights:</strong> Curated material from students who cracked top tech firms, ensuring relevance and accuracy.</li>
    <li><strong>Extra Edge:</strong> Unique strategies and tips to boost your confidence and performance during assessments and interviews.</li>
  </ul>
</div>

<div className="mt-2 bg-white text-black rounded-lg shadow-lg max-w-lg mx-auto p-1">
    <h4 className="text-xl font-semibold mb-6 ">What Students Are Saying ⭐</h4>
    <div className="space-y-4">
      <div className="border-b pb-4">
        <p className="text-sm italic">"This bundle helped me land my dream job at a startup at Noida! The DSA questions were spot on!"</p>
        <p className="text-right text-sm font-medium">- Rajeev Ranjan</p>
      </div>
      <div className="border-b pb-4">
        <p className="text-sm italic">"The resume template and notes made my preparation so much easier. Highly recommended!"</p>
        <p className="text-right text-sm font-medium">- Pintu Sardar</p>
      </div>
      <div>
        <p className="text-sm italic">"A lifesaver for placement season! The personalized DSA questions were a game-changer."</p>
        <p className="text-right text-sm font-medium">- Raj Verma</p>
      </div>
      <div>
        <p className="text-sm italic">"Good"</p>
        <p className="text-right text-sm font-medium">- Pankaj</p>
      </div>
    </div>
  </div>
   
  </div>
  

  <div className="fixed bottom-0 left-0 w-full bg-gray-100 py-4 flex justify-between items-center px-6 shadow-lg border-t">
    <div className="text-black font-bold text-xl">
      ₹{planDetails[selectedPlan].price}{' '}
      {selectedPlan === '12-month' && <span className="text-red-500 font-semibold">Limited Offer</span>}
      <span className="text-gray-500 line-through">₹{planDetails[selectedPlan].strikeThroughPrice}</span>
    </div>
    <button
      onClick={handleBuyNowClick}
      className={`bg-red-500 text-white py-3 px-6 rounded-full transition duration-300 shadow-md cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
      disabled={isLoading}
    >
      <span className="font-bold">{isLoading ? 'Loading...' : 'Buy Now'}</span>
    </button>
  </div>
  <Footer/>
</div>
  
  );
};

export default Landingpage;