import React from "react";
import { LuBadgeCheck, LuClock, LuUser, LuRefreshCw, LuArrowRight } from "react-icons/lu";
import theme from "../theme/theme";
import { Button, CtaPanel, FeatureGrid, PageHeader, Section, SectionHeader } from "../components/ui";
import "./ContentPages.css";

const values = [
  { Icon: LuBadgeCheck, title: "Quality first", text: "Every product is tested and verified before delivery." },
  { Icon: LuClock, title: "Prompt delivery", text: "Access details usually arrive within 15–30 minutes of your payment being verified." },
  { Icon: LuUser, title: "Your own account", text: "Plans are for your own account — single ownership, not a shared login." },
  { Icon: LuRefreshCw, title: "Always supported", text: "If something stops working during your plan, we replace it." },
];

const About = () => {
  const { name, foundedYear } = theme.brand;

  return (
    <div className="content-page">
      <PageHeader
        title="About us"
        description={`${name} sells software subscriptions, trading tools and courses. We've been doing it since ${foundedYear}.`}
      />

      <Section narrow>
        <SectionHeader title="Premium products. Honest prices." />
        <div className="ui-prose">
          <p>
            <strong>{name}</strong> started in {foundedYear} with a simple aim: make the premium tools people rely on every
            day available at prices more of them can afford. What began with trading tools now includes software
            subscriptions and courses.
          </p>
          <p>
            Every order is handled by a person. You pay by UPI, we match your payment against our bank statement, and then
            we send your access details — usually within 15–30 minutes.
          </p>
          <p>
            We vet the products we list and stand behind each plan with a replacement guarantee for its full length. If you
            have a question before or after you buy, you'll get an answer from us on WhatsApp or Telegram.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHeader title="What we stand for" />
        <FeatureGrid items={values} columns={4} plain />
      </Section>

      <Section>
        <CtaPanel
          title="Find the right plan"
          text="Browse the catalog, or ask us anything before you buy."
          actions={
            <>
              <Button to="/" variant="primary" size="lg" iconRight={<LuArrowRight />}>
                Browse products
              </Button>
              <Button to="/contact" variant="secondary" size="lg">
                Contact us
              </Button>
            </>
          }
        />
      </Section>
    </div>
  );
};

export default About;
