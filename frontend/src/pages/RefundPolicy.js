import React from "react";
import { LuMail } from "react-icons/lu";
import theme from "../theme/theme";
import { Button, PageHeader, Section } from "../components/ui";
import "./ContentPages.css";

const RefundPolicy = () => {
  const { name } = theme.brand;

  return (
    <div className="content-page">
      <PageHeader
        eyebrow="Legal"
        title="Refund Policy"
        description={`At ${name}, we take pride in delivering premium digital products. Due to the nature of digital goods, all purchases are considered final.`}
      />

      <Section narrow>
        <div className="ui-prose policy">
          <p className="policy__intro">
            However, in rare cases where the product does not function as intended or fails to meet the described
            standards, we may offer a refund or replacement under strict conditions.
          </p>

          <section className="policy__section" aria-labelledby="refund-eligibility">
            <h2 id="refund-eligibility">Refund eligibility</h2>
            <p>To qualify for a refund, the following conditions must be met:</p>
            <ul>
              <li>
                Request must be made within <strong>7 days</strong> of purchase.
              </li>
              <li>
                Product must be <strong>defective or not as described</strong>.
              </li>
              <li>
                Product must <strong>not be used or fully consumed</strong>.
              </li>
            </ul>
          </section>

          <section className="policy__section" aria-labelledby="refund-how">
            <h2 id="refund-how">How to request</h2>
            <p>
              To request a refund, contact us at <a href="mailto:leader@cybermafia.shop">leader@cybermafia.shop</a> with:
            </p>
            <ul>
              <li>Order details</li>
              <li>Reason for request</li>
              <li>Supporting proof (if applicable)</li>
            </ul>
            <p>
              Our team will review your request within <strong>3–5 business days</strong>.
            </p>
          </section>

          <section className="policy__section" aria-labelledby="refund-excluded">
            <h2 id="refund-excluded">Non-refundable cases</h2>
            <ul>
              <li>Change of mind after purchase</li>
              <li>Failure to meet system requirements</li>
              <li>Misunderstanding of product features</li>
            </ul>
            <p>We reserve the right to decline any request that does not meet our policy standards.</p>
          </section>
        </div>

        <div className="ui-card policy-contact">
          <div>
            <h2 className="ui-title-card">Contact</h2>
            <p className="ui-muted ui-small">
              For any concerns, reach out by email. Thank you for trusting {name}.
            </p>
          </div>
          <Button href="mailto:leader@cybermafia.shop" variant="secondary" icon={<LuMail />}>
            leader@cybermafia.shop
          </Button>
        </div>
      </Section>
    </div>
  );
};

export default RefundPolicy;
