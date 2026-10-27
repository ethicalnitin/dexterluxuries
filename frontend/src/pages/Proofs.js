import React from "react";
import { LuBadgeCheck, LuMessageCircle, LuRefreshCw, LuFolderOpen, LuExternalLink, LuShieldCheck, LuArrowRight } from "react-icons/lu";
import { Button, CtaPanel, FeatureGrid, PageHeader, Section, SectionHeader } from "../components/ui";
import "./ContentPages.css";

const trustCards = [
  { Icon: LuShieldCheck, title: "Payments checked by a person", text: "Every UPI payment is matched against our bank statement before access is sent." },
  { Icon: LuBadgeCheck, title: "Verified and working", text: "Plans are tested before delivery. If access isn't as described, we make it right." },
  { Icon: LuRefreshCw, title: "Replacement guarantee", text: "If a plan stops working during its period, we replace it at no extra cost." },
  { Icon: LuMessageCircle, title: "Support you can reach", text: "Questions about an order go to us directly on WhatsApp or Telegram." },
];

const proofsDriveUrl = "https://drive.google.com/drive/folders/1EtOpaPTbV4qopeA3LNUciVcGcwdkS8Po?usp=sharing";

const externalProps = { target: "_blank", rel: "noopener noreferrer" };

const Proofs = () => (
  <div className="content-page">
    <PageHeader
      title="Delivery proofs"
      description="Screenshots of real deliveries and activated accounts, kept in a public folder so you can check them before you buy."
    >
      <div className="content-page__header-actions">
        <Button href={proofsDriveUrl} {...externalProps} variant="primary" size="lg" icon={<LuExternalLink />}>
          View all proofs on Drive
        </Button>
      </div>
    </PageHeader>

    <Section>
      <SectionHeader title="How we handle every order" />
      <FeatureGrid items={trustCards} columns={4} plain />
    </Section>

    <Section>
      <div className="ui-card proofs-drive">
        <span className="ui-icon-tile proofs-drive__icon">
          <LuFolderOpen aria-hidden="true" />
        </span>
        <div className="proofs-drive__text">
          <h2 className="ui-title-section">The proof folder is public</h2>
          <p className="ui-muted">
            Browse screenshots of deliveries, activated accounts and customer confirmations in our Google Drive folder.
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
          <h2 className="ui-title-card">Replacement guarantee</h2>
          <p className="ui-muted ui-small">
            If your plan stops working during its subscription period, message us with your order reference and we'll
            replace it at no cost.
          </p>
        </div>
      </div>
    </Section>

    <Section>
      <CtaPanel
        title="Ready to choose a plan?"
        text="Browse subscriptions, trading tools and courses."
        actions={
          <>
            <Button to="/" variant="primary" size="lg" iconRight={<LuArrowRight />}>
              Browse products
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
