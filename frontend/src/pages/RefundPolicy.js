import React from 'react';

const RefundPolicy = () => {
  return (
    <div className="container mx-auto p-6 mt-16">
      <h1 className="text-3xl font-bold">Refund Policy</h1>
      <p className="text-gray-700 mt-4">
        At Dexter Luxuries, we take immense pride in the quality of our digital products and are committed to providing an excellent experience for our customers. Given the nature of digital products, we typically do not offer refunds once a purchase has been completed. 
      </p>
      
      <p className="text-gray-700 mt-4">
        However, we understand that there may be rare instances where our products might not meet your expectations, or you might experience issues with the product. In such cases, we offer a refund or exchange, but only under specific circumstances and within a limited time frame.
      </p>
      
      <h3 className="text-2xl font-semibold mt-6">Refund Eligibility</h3>
      <p className="text-gray-700 mt-4">
        To be eligible for a refund, you must meet the following conditions:
      </p>
      <ul className="list-disc pl-6 mt-4">
        <li>The request must be made within 7 days of the purchase date.</li>
        <li>The product must be faulty, defective, or not as described in the listing.</li>
        <li>The product must not have been downloaded or used in any way.</li>
      </ul>

      <h3 className="text-2xl font-semibold mt-6">How to Request a Refund</h3>
      <p className="text-gray-700 mt-4">
        If you believe you qualify for a refund based on the above criteria, please reach out to us at <strong>leader@cybermafia.shop</strong>. In your email, please include the following information:
      </p>
      <ul className="list-disc pl-6 mt-4">
        <li>Your order number and purchase details.</li>
        <li>A brief explanation of why you are requesting the refund.</li>
        <li>Any relevant supporting documentation (if applicable).</li>
      </ul>

      <p className="text-gray-700 mt-4">
        Our team will review your request as soon as possible and respond within 3-5 business days. If your refund request is approved, the refund will be processed, and you will receive a confirmation email once the refund has been issued.
      </p>

      <h3 className="text-2xl font-semibold mt-6">Non-Refundable Situations</h3>
      <p className="text-gray-700 mt-4">
        Please note that the following situations are not eligible for refunds:
      </p>
      <ul className="list-disc pl-6 mt-4">
        <li>Change of mind after purchase.</li>
        <li>Failure to meet system requirements for the product.</li>
        <li>Non-technical issues such as misunderstanding of the product description or features.</li>
      </ul>

      <p className="text-gray-700 mt-4">
        We reserve the right to refuse a refund request if we find it does not meet the outlined criteria or if we determine that the product was misused or downloaded.
      </p>

      <h3 className="text-2xl font-semibold mt-6">Contact Information</h3>
      <p className="text-gray-700 mt-4">
        If you have any questions regarding our refund policy or would like to discuss a refund request, please don't hesitate to reach out to us at <strong>leader@cybermafia.shop</strong>.
      </p>

      <p className="text-gray-700 mt-6">
        Thank you for shopping at Dexter Luxuries. We value your trust and are committed to ensuring your satisfaction with our products.
      </p>
    </div>
  );
};

export default RefundPolicy;
