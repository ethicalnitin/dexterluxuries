const nodemailer = require("nodemailer");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

const isConfigured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for port 465, false for 587/others
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
} else {
  console.warn(
    "[Mailer] SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS not fully set — password reset codes will be logged to the " +
      "server console instead of emailed. Fine for local testing, NOT fine for production."
  );
}

async function sendPasswordResetEmail(email, code) {
  if (!transporter) {
    console.warn(`[Mailer] (dev fallback) Password reset code for ${email} is: ${code}`);
    return { delivered: false };
  }

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: "Your ChartVault password reset code",
    text: `Your ChartVault password reset code is ${code}. It expires in 5 minutes. If you didn't ask to reset your password, you can ignore this email — your password won't change.`,
    html: `
      <div style="font-family:sans-serif;padding:24px;">
        <p style="color:#444;">Your ChartVault password reset code is:</p>
        <p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:12px 0;">${code}</p>
        <p style="color:#888;font-size:13px;">Expires in 5 minutes. If you didn't ask to reset your password, you can ignore this email — your password won't change.</p>
      </div>
    `,
  });

  return { delivered: true };
}

module.exports = { sendPasswordResetEmail, isConfigured };