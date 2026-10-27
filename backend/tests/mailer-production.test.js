const { it } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'production';
process.env.LOG_LEVEL = 'debug';
for (const key of Object.keys(process.env)) if (key.startsWith('SMTP_')) delete process.env[key];

const { sendPasswordResetEmail, sendDeliveryEmail } = require('../utils/mailer');

it('refuses to send instead of logging the reset code', async () => {
  const written = [];
  const original = { out: process.stdout.write, err: process.stderr.write };
  process.stdout.write = (chunk) => written.push(String(chunk)) && true;
  process.stderr.write = (chunk) => written.push(String(chunk)) && true;
  try {
    await assert.rejects(sendPasswordResetEmail('user@example.com', '918273'), { code: 'MAIL_NOT_CONFIGURED' });
  } finally {
    process.stdout.write = original.out;
    process.stderr.write = original.err;
  }
  assert.ok(!written.join('').includes('918273'), 'reset code was written to the logs');
});

it('refuses delivery emails too', async () => {
  await assert.rejects(
    sendDeliveryEmail({ to: 'a@b.co', productName: 'P', planDuration: '1 Month', link: 'https://x.example', message: 'Hi' }),
    { code: 'MAIL_NOT_CONFIGURED' }
  );
});
