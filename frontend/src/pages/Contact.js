import React from "react";
import { LuMail, LuArrowUpRight } from "react-icons/lu";
import { FaWhatsapp, FaTelegram, FaInstagram } from "react-icons/fa6";
import { PageHeader, Section } from "../components/ui";
import "./ContentPages.css";

const channels = [
  {
    Icon: LuMail,
    label: "Email",
    value: "leader@cybermafia.shop",
    desc: "For orders, billing & general inquiries",
    href: "mailto:leader@cybermafia.shop",
  },
  {
    Icon: FaWhatsapp,
    label: "WhatsApp",
    value: "Chat on WhatsApp",
    desc: "Fastest response — order support & queries",
    href: "https://wa.me/9259317696",
  },
  {
    Icon: FaTelegram,
    label: "Telegram",
    value: "@cybermafia.shop",
    desc: "Join our channel for deals & updates",
    href: "https://t.me/mkrtoolsandsoftwares",
  },
  {
    Icon: FaInstagram,
    label: "Instagram",
    value: "@cybermafia.shop",
    desc: "Follow us for proofs & announcements",
    href: "https://www.instagram.com/cybermafia.shop",
  },
];

const responseTimes = [
  { channel: "WhatsApp", time: "< 10 minutes" },
  { channel: "Telegram", time: "< 30 minutes" },
  { channel: "Email", time: "2–4 hours" },
  { channel: "Instagram DM", time: "2–6 hours" },
];

const Contact = () => (
  <div className="content-page">
    <PageHeader
      eyebrow="Get in touch"
      title="We're here to help."
      description="Reach out through any channel below. We respond fast — usually within minutes on WhatsApp and Telegram."
    />

    <Section>
      <div className="contact-layout">
        <div>
          <h2 className="ui-title-section contact-layout__title">Reach us anywhere</h2>
          <ul className="contact-channels">
            {channels.map(({ Icon, label, value, desc, href }) => {
              const external = !href.startsWith("mailto");
              return (
                <li key={label}>
                  <a
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="contact-channel"
                  >
                    <span className="ui-icon-tile">
                      <Icon aria-hidden="true" />
                    </span>
                    <span className="contact-channel__text">
                      <span className="contact-channel__label">{label}</span>
                      <span className="contact-channel__value">{value}</span>
                      <span className="contact-channel__desc">{desc}</span>
                    </span>
                    <LuArrowUpRight className="contact-channel__arrow" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="ui-card contact-info">
          <h2 className="ui-title-card">Before you reach out</h2>
          <p className="ui-muted ui-small">
            For the fastest response, message us on <strong>WhatsApp or Telegram</strong>. Include your order details or the
            product you're interested in so we can help you immediately.
          </p>
          <p className="ui-muted ui-small">
            Our support team operates daily and we are committed to resolving every query the same day.
          </p>
          <h3 className="contact-info__subtitle">Response times</h3>
          <dl className="contact-times">
            {responseTimes.map((r) => (
              <div key={r.channel}>
                <dt>{r.channel}</dt>
                <dd className="ui-mono">{r.time}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </Section>
  </div>
);

export default Contact;
