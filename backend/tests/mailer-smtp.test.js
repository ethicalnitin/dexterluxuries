const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');

function startFakeSmtp() {
  const messages = [];
  const server = net.createServer((socket) => {
    let buffer = '';
    let mode = 'command';
    let current = { auth: null, from: null, to: [], data: '' };
    let loginStep = 0;
    const send = (line) => socket.write(`${line}\r\n`);
    send('220 fake.smtp ESMTP ready');

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let idx;
      while ((idx = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (mode === 'data') {
          if (line === '.') {
            messages.push(current);
            current = { auth: current.auth, from: null, to: [], data: '' };
            mode = 'command';
            send('250 2.0.0 queued');
          } else {
            current.data += `${line.startsWith('..') ? line.slice(1) : line}\n`;
          }
          continue;
        }
        if (loginStep === 1) {
          current.auth = { user: Buffer.from(line, 'base64').toString() };
          loginStep = 2;
          send('334 UGFzc3dvcmQ6');
          continue;
        }
        if (loginStep === 2) {
          current.auth.pass = Buffer.from(line, 'base64').toString();
          loginStep = 0;
          send('235 2.7.0 Authentication successful');
          continue;
        }
        const upper = line.toUpperCase();
        if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
          socket.write('250-fake.smtp\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n');
        } else if (upper.startsWith('AUTH PLAIN')) {
          const [, user, pass] = Buffer.from(line.split(' ')[2], 'base64').toString().split('\u0000');
          current.auth = { user, pass };
          send('235 2.7.0 Authentication successful');
        } else if (upper.startsWith('AUTH LOGIN')) {
          loginStep = 1;
          send('334 VXNlcm5hbWU6');
        } else if (upper.startsWith('MAIL FROM')) {
          current.from = line.slice(10);
          send('250 2.1.0 OK');
        } else if (upper.startsWith('RCPT TO')) {
          current.to.push(line.slice(8));
          send('250 2.1.5 OK');
        } else if (upper === 'DATA') {
          mode = 'data';
          send('354 End data with <CR><LF>.<CR><LF>');
        } else if (upper === 'QUIT') {
          send('221 2.0.0 Bye');
          socket.end();
        } else {
          send('250 OK');
        }
      }
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port, messages }));
  });
}

function decode(data) {
  const words = data
    .replace(/\?=\n =\?UTF-8\?Q\?/g, '')
    .replace(/=\?UTF-8\?Q\?(.*?)\?=/g, (_, word) => word.replace(/_/g, ' '));
  const bytes = words.replace(/=\n/g, '').replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return Buffer.from(bytes, 'latin1').toString('utf8');
}

let smtp;
let mailer;

before(async () => {
  smtp = await startFakeSmtp();
  process.env.NODE_ENV = 'development';
  process.env.LOG_LEVEL = 'silent';
  process.env.BRAND_NAME = 'Test Store';
  Object.assign(process.env, {
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(smtp.port),
    SMTP_USER: 'mailer-user',
    SMTP_PASS: 'mailer-pass',
    SMTP_FROM: 'Test Store <noreply@store.example>',
  });
  mailer = require('../utils/mailer');
});
after(() => new Promise((resolve) => smtp.server.close(resolve)));

describe('SMTP delivery', () => {
  it('authenticates and sends a delivery email with escaped HTML', async () => {
    await mailer.sendDeliveryEmail({
      to: 'buyer@example.com',
      productName: 'Pro <Plan>',
      planDuration: '3 Months',
      link: 'https://drive.example/file?a=1&b=2',
      message: 'Thanks for buying!',
    });
    const msg = smtp.messages.at(-1);
    assert.deepEqual(msg.auth, { user: 'mailer-user', pass: 'mailer-pass' });
    assert.match(msg.from, /noreply@store\.example/);
    assert.deepEqual(msg.to.map((t) => t.replace(/[<>]/g, '')), ['buyer@example.com']);
    const text = decode(msg.data);
    assert.match(text, /^Subject: Your Pro <Plan> Plan is Ready — Test Store$/m);
    assert.match(text, /<p[^>]*>Pro &lt;Plan&gt; · 3 Months<\/p>/);
    assert.match(text, /href="https:\/\/drive\.example\/file\?a=1&amp;b=2"/);
    assert.match(text, /^Access link: https:\/\/drive\.example\/file\?a=1&b=2$/m);
  });

  it('sends the password reset code', async () => {
    const result = await mailer.sendPasswordResetEmail('user@example.com', '135790');
    assert.deepEqual(result, { delivered: true });
    const msg = smtp.messages.at(-1);
    assert.deepEqual(msg.to.map((t) => t.replace(/[<>]/g, '')), ['user@example.com']);
    const text = decode(msg.data);
    assert.match(text, /^Subject: Your Test Store password reset code$/m);
    assert.match(text, /135790/);
  });
});
