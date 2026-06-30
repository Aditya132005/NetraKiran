const express = require('express');
const { Resend } = require('resend');
const { pool } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

function buildEmailHtml(subject, message) {
  const safeMessage = String(message).replace(/\n/g, '<br/>');
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 24px;">
    <div style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="background: #0f172a; padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px;">Karan Optics</h1>
      </div>
      <div style="padding: 28px;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">${subject}</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">${safeMessage}</p>
      </div>
      <div style="background: #f1f5f9; padding: 16px; text-align: center; color: #64748b; font-size: 12px;">
        Karan Optics | NetraKiran
      </div>
    </div>
  </div>`;
}

router.post('/send-offer', authenticate, adminOnly, async (req, res) => {
  try {
    const { subject, message, customerIds } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message are required' });

    let rows;
    if (customerIds === 'all') {
      ({ rows } = await pool.query(
        `SELECT id, email FROM customers WHERE email IS NOT NULL AND email <> ''`
      ));
    } else {
      if (!Array.isArray(customerIds) || !customerIds.length)
        return res.status(400).json({ error: 'customerIds must be a non-empty array or "all"' });
      ({ rows } = await pool.query(
        `SELECT id, email FROM customers WHERE id = ANY($1) AND email IS NOT NULL AND email <> ''`,
        [customerIds]
      ));
    }

    const html = buildEmailHtml(subject, message);
    let sent = 0, failed = 0;
    const errors = [];

    for (const { email } of rows) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: email,
          subject,
          html
        });
        sent++;
      } catch (err) {
        failed++;
        errors.push({ email, error: err.message });
      }
    }

    res.json({ sent, failed, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
