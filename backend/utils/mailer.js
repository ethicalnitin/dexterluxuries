const nodemailer = require("nodemailer");
const { escapeHtml } = require("./escapeHtml");
const { config } = require("../config/env");
const { logger } = require("./logger");

const BRAND_NAME = config.brandName;
const FROM = config.smtp && config.smtp.from;

let transporter = null;
if (config.isTest) {
  transporter = nodemailer.createTransport({ jsonTransport: true });
} else if (config.smtp) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
}

function notConfiguredError() {
  const err = new Error("Email isn't configured on the server.");
  err.code = "MAIL_NOT_CONFIGURED";
  return err;
}

async function sendPasswordResetEmail(email, code) {
  if (!transporter) {
    if (config.isProduction) throw notConfiguredError();
    logger.warn("Password reset code (development fallback: SMTP not configured)", { email, code });
    return { delivered: false };
  }

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Your ${BRAND_NAME} password reset code`,
    text: `Your ${BRAND_NAME} password reset code is ${code}. It expires in 5 minutes. If you didn't ask to reset your password, you can ignore this email — your password won't change.`,
    html: `
      <div style="font-family:sans-serif;padding:24px;">
        <p style="color:#444;">Your ${escapeHtml(BRAND_NAME)} password reset code is:</p>
        <p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:12px 0;">${code}</p>
        <p style="color:#888;font-size:13px;">Expires in 5 minutes. If you didn't ask to reset your password, you can ignore this email — your password won't change.</p>
      </div>
    `,
  });

  return { delivered: true };
}

async function sendDeliveryEmail({ to, productName, planDuration, link, message }) {
  if (!transporter) throw notConfiguredError();

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Your ${productName} Plan is Ready — ${BRAND_NAME}`,
    text: `${message}\n\n${productName} · ${planDuration}\n\nAccess link: ${link}\n\n— ${BRAND_NAME}`,
    html: `
      <div style="font-family:sans-serif;padding:24px;line-height:1.5;">
        <p style="color:#222;white-space:pre-line;">${escapeHtml(message)}</p>
        <p style="color:#444;font-weight:600;">${escapeHtml(productName)} · ${escapeHtml(planDuration)}</p>
        <p><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;border-radius:6px;text-decoration:none;">Open your access link</a></p>
        <p style="color:#888;font-size:13px;">If the button doesn't work, copy this link: ${escapeHtml(link)}</p>
        <p style="color:#888;font-size:13px;">— ${escapeHtml(BRAND_NAME)}</p>
      </div>
    `,
  });
}

module.exports = { sendPasswordResetEmail, sendDeliveryEmail };
