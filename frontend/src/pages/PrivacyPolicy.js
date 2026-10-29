import React from "react";
import { LuMail } from "react-icons/lu";
import theme from "../theme/theme";
import { Button, PageHeader, Section } from "../components/ui";
import "./ContentPages.css";

const sections = [
  {
    num: "01",
    title: "Information We Collect",
    list: [
      { label: "Personal Information", desc: "When you create an account, make a purchase, or contact us, we may collect personal details such as your name, email address, and billing information." },
      { label: "Payment Information", desc: "We collect payment details for processing transactions. This data is securely handled by our payment providers and is not stored directly on our servers." },
      { label: "Usage Data", desc: "We may collect non-personal information such as your IP address, browser type, device information, and usage patterns to improve user experience and analyze website traffic." },
    ],
  },
  {
    num: "02",
    title: "How We Use Your Information",
    list: [
      { label: "Order Processing", desc: "To process your orders, provide digital products, and deliver customer support." },
      { label: "Communication", desc: "To communicate with you regarding your orders, updates, or promotional offers (with your consent)." },
      { label: "Personalization", desc: "To improve your experience by personalizing content and product recommendations based on your preferences." },
      { label: "Analytics", desc: "To analyze website traffic, monitor performance, and improve our website's functionality." },
    ],
  },
  {
    num: "03",
    title: "How We Protect Your Information",
    body: [
      "We take appropriate security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. We use secure encryption protocols (SSL) to ensure that your payment details are transmitted safely.",
      "While we take all necessary precautions to protect your data, please understand that no method of transmission over the internet or electronic storage is completely secure. Therefore, we cannot guarantee absolute security.",
    ],
  },
  {
    num: "04",
    title: "Sharing Your Information",
    list: [
      { label: "Service Providers", desc: "We may share your data with third-party service providers (e.g., payment gateways, hosting services) who assist in operating our website and processing transactions. These providers are contractually obligated to maintain confidentiality." },
      { label: "Legal Requirements", desc: "We may disclose your information if required by law or to comply with legal processes, such as a subpoena or court order." },
      { label: "Business Transfers", desc: "In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner. You will be notified in advance of any change in ownership." },
    ],
  },
  {
    num: "05",
    title: "Your Rights",
    body: [
      "You have the right to access, update, or delete your personal information at any time. If you would like to exercise any of these rights or have any concerns about the information we hold about you, please contact us at leader@cybermafia.shop.",
    ],
  },
  {
    num: "06",
    title: "Cookies",
    body: [
      "Our website uses cookies to enhance your browsing experience. Cookies are small files stored on your device that allow us to remember your preferences and improve site functionality. You can control the use of cookies through your browser settings, but disabling cookies may affect certain features of our website.",
    ],
  },
  {
    num: "07",
    title: "Third-Party Links",
    body: [
      "Our website may contain links to third-party websites. These sites have their own privacy policies, and we are not responsible for their practices. We encourage you to review the privacy policies of any external sites before providing any personal information.",
    ],
  },
  {
    num: "08",
    title: "Changes to This Policy",
    body: [
      "We reserve the right to update or modify this Privacy Policy at any time. Any changes will be posted on this page with an updated date. We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.",
    ],
  },
];

const PrivacyPolicy = () => (
  <div className="content-page">
    <PageHeader eyebrow="Legal" title="Privacy Policy" description="Last updated — January 2025" />

    <Section narrow>
      <div className="ui-prose policy">
        <p className="policy__intro">
          At {theme.brand.name}, we value your privacy and are committed to protecting the personal information you share
          with us. This Privacy Policy outlines how we collect, use, store, and safeguard your data when you visit our
          website or make a purchase from our digital product store.
        </p>

        {sections.map((sec) => (
          <section key={sec.num} className="policy__section" aria-labelledby={`privacy-${sec.num}`}>
            <span className="policy__num">Section {sec.num}</span>
            <h2 id={`privacy-${sec.num}`}>{sec.title}</h2>
            {sec.body && sec.body.map((p, j) => <p key={j}>{p}</p>)}
            {sec.list && (
              <ul>
                {sec.list.map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}:</strong> {item.desc}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="ui-card policy-contact">
        <div>
          <h2 className="ui-title-card">Have questions?</h2>
          <p className="ui-muted ui-small">
            If you have any questions or concerns about our Privacy Policy, or if you would like to exercise your rights
            regarding your personal information, we're here to help.
          </p>
        </div>
        <Button href="mailto:leader@cybermafia.shop" variant="secondary" icon={<LuMail />}>
          leader@cybermafia.shop
        </Button>
      </div>
    </Section>
  </div>
);

export default PrivacyPolicy;
 