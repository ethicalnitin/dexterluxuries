import React from "react";
import { LuTrophy, LuZap, LuUsers, LuRefreshCw, LuArrowRight } from "react-icons/lu";
import theme from "../theme/theme";
import { Button, CtaPanel, FeatureGrid, PageHeader, Section, SectionHeader, StatStrip } from "../components/ui";
import "./ContentPages.css";

const stats = [
  { value: "2021", label: "Founded" },
  { value: "50K+", label: "Traders Served" },
  { value: "100%", label: "Success Rate" },
  { value: "24/7", label: "Support" },
];

const values = [
  { Icon: LuTrophy, title: "Quality First", text: "Every product is tested and verified before delivery. We never compromise on what we offer to our community." },
  { Icon: LuZap, title: "Instant Delivery", text: "Your subscription activates within minutes. No waiting, no delays — we respect your time." },
  { Icon: LuUsers, title: "Built on Trust", text: "50,000+ traders have placed their confidence in us. That trust is our most valuable asset." },
  { Icon: LuRefreshCw, title: "Always Supported", text: "If anything stops working, we replace it immediately. Our commitment doesn't end at purchase." },
];

const About = () => {
  const { name } = theme.brand;

  return (
    <div className="content-page">
      <PageHeader
        eyebrow="Our story"
        title="Premium products. Honest prices."
        description={`Since 2021, ${name} has been India's most trusted destination for premium digital subscriptions and tools.`}
      />

      <Section>
        <StatStrip items={stats} />
      </Section>

      <Section narrow>
        <SectionHeader eyebrow="Who we are" title={name} />
        <div className="ui-prose">
          <p>
            Welcome to <strong>{name}</strong> — a leading digital product store established in 2021. Over the years, we
            have built a loyal community of over <strong>50,000 traders and digital enthusiasts</strong> who trust us for
            high-quality products that enhance their lifestyle and trading edge.
          </p>
          <p>
            Our mission is simple: deliver <strong>premium digital tools at prices that are accessible to everyone</strong>.
            Whether you're a seasoned trader seeking TradingView Premium or a tech enthusiast looking for the best digital
            subscriptions, we have you covered — instantly.
          </p>
          <p>
            At {name}, we understand that in the fast-moving world of digital products,{" "}
            <strong>quality and reliability are non-negotiable</strong>. That's why we carefully vet every product we offer
            and stand behind every single order with our replacement guarantee.
          </p>
          <p>
            Our community is the heart of our success. We're proud to have helped thousands of individuals elevate their
            digital experience — and we're just getting started. As we grow, our commitment to{" "}
            <strong>personalized service, swift support, and honest pricing</strong> will never waver.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="What we stand for" title="Our core values" />
        <FeatureGrid items={values} columns={4} />
      </Section>

      <Section>
        <CtaPanel
          title="Ready to get started?"
          text={`Join 50,000+ satisfied customers and experience ${name} today.`}
          actions={
            <>
              <Button to="/" variant="primary" size="lg" iconRight={<LuArrowRight />}>
                Browse products
              </Button>
              <Button to="/contact" variant="secondary" size="lg">
                Get in touch
              </Button>
            </>
          }
        />
      </Section>
    </div>
  );
};

export default About;
