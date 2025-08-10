import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors({ origin: ['http://127.0.0.1:8000', 'http://localhost:8000'], credentials: false }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: 'Missing fields' });
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, TO_EMAIL } = process.env;

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST || 'smtp.gmail.com',
      port: Number(SMTP_PORT || 587),
      secure: false,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });

    const info = await transporter.sendMail({
      from: SMTP_USER || 'no-reply@localhost',
      to: TO_EMAIL || SMTP_USER || 'narek_harutyunyan@brown.edu',
      replyTo: email,
      subject: `Website contact from ${name}`,
      text: `From: ${name} <${email}>
\n${message}`,
    });

    return res.json({ ok: true, id: info.messageId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Failed to send' });
  }
});

app.listen(PORT, () => {
  console.log(`Contact API listening on http://127.0.0.1:${PORT}`);
}); 