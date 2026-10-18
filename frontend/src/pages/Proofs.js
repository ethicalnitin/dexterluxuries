import React from "react";
import {
  LuZap,
  LuLock,
  LuBadgeCheck,
  LuUsers,
  LuMessageCircle,
  LuRefreshCw,
  LuFolderOpen,
  LuExternalLink,
  LuShieldCheck,
  LuArrowRight,
} from "react-icons/lu";
import theme from "../theme/theme";
import { Button, CtaPanel, FeatureGrid, PageHeader, Section, SectionHeader, StatStrip } from "../components/ui";
import "./ContentPages.css";

const trustCards = [
  { Icon: LuZap, title: "Instant Delivery", text: "Your subscription is activated within minutes of payment. No waiting, no delays — just instant access." },
  { Icon: LuLock, title: "100% Secure", text: "Every transaction is encrypted and protected. Your data and payment are always safe with us." },
  { Icon: LuBadgeCheck, title: "Verified & Working", text: "All plans are tested before delivery. We guarantee full Premium access or we make it right." },
  { Icon: LuUsers, title: "50,000+ Traders Served", text: "Our community trusts us. We've been delivering premium tools to serious traders across India." },
  { Icon: LuMessageCircle, title: "24/7 Support", text: "Got an issue? Our support team responds fast on WhatsApp. You're never left on your own." },
  { Icon: LuRefreshCw, title: "Replacement Guarantee", text: "If your plan ever stops working, we replace it immediately at no extra cost. Zero risk." },
];

const stats = [
  { value: "50K+", label: "Traders Served" },
  { value: "₹495", label: "Starting Price" },
  { value: "5 Min", label: "Avg. Delivery" },
  { value: "100%", label: "Success Rate" },
];

const proofsDriveUrl = "https://drive.google.com/drive/folders/1EtOpaPTbV4qopeA3LNUciVcGcwdkS8Po?usp=sharing";

const externalProps = { target: "_blank", rel: "noopener noreferrer" };

const Proofs = () => (
  <div className="content-page">
    <PageHeader
      eyebrow="Verified by 50,000+ traders"
      title="Don't take our word. See the proof."
      description="Real screenshots. Real traders. Real results. Every claim we make is backed by verifiable evidence — openly shared for you to inspect."
    >
      <div className="content-page__header-actions">
        <Button href={proofsDriveUrl} {...externalProps} variant="primary" size="lg" icon={<LuExternalLink />}>
          View all proofs on Drive
        </Button>
      </div>
    </PageHeader>

    <Section>
      <StatStrip items={stats} />
    </Section>

    <Section>
      <SectionHeader eyebrow="Why traders choose us" title="Built on trust. Backed by results." />
      <FeatureGrid items={trustCards} columns={3} />
    </Section>

    <Section>
      <div className="ui-card proofs-drive">
        <span className="ui-icon-tile proofs-drive__icon">
          <LuFolderOpen aria-hidden="true" />
        </span>
        <div className="proofs-drive__text">
          <h2 className="ui-title-section">Our proof folder is public &amp; open</h2>
          <p className="ui-muted">
            We have nothing to hide. Browse real screenshots of successful deliveries, activated accounts, and happy
            customer confirmations — all stored in our public Google Drive. Updated regularly.
          </p>
        </div>
        <Button href={proofsDriveUrl} {...externalProps} variant="secondary" size="lg" icon={<LuFolderOpen />}>
          Open proof folder
        </Button>
      </div>
    </Section>

    <Section narrow>
      <div className="proofs-guarantee">
        <LuShieldCheck aria-hidden="true" />
        <div>
          <h2 className="ui-title-card">Our zero-risk guarantee</h2>
          <p className="ui-muted ui-small">
            If your TradingView Premium plan ever stops working during your subscription period, we will replace it
            immediately at no cost. No questions asked. We stand behind every order we fulfil — your investment is 100%
            protected.
          </p>
        </div>
      </div>
    </Section>

    <Section>
      <CtaPanel
        title="Ready to trade like a pro?"
        text={`Join 50,000+ traders already using TradingView Premium through ${theme.brand.name}.`}
        actions={
          <>
            <Button to="/" variant="primary" size="lg" iconRight={<LuArrowRight />}>
              View plans from ₹495
            </Button>
            <Button href={proofsDriveUrl} {...externalProps} variant="secondary" size="lg">
              Browse proofs first
            </Button>
          </>
        }
      />
    </Section>
  </div>
);

export default Proofs;
