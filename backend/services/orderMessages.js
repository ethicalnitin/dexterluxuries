const { escapeHtml } = require('../utils/escapeHtml');

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

function itemLine(line) {
  const name = escapeHtml(line.productName || `Product #${line.productId}`);
  const plan = line.planName ? ` — ${escapeHtml(line.planName)}` : '';
  const price = line.lineTotalInr ? ` = ${inr(line.lineTotalInr)}` : '';
  const flag = line.status === 'unavailable' ? ' ⚠️ SOLD OUT' : line.status === 'not_found' ? ' ⚠️ NOT IN CATALOG' : '';
  return `   • ${name}${plan} × ${line.quantity}${price}${flag}`;
}

const timestamp = () => `🕐 <b>Time:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

module.exports = { inr, itemLine, timestamp };
