const crypto = require('crypto');

const getEnv = (name, fallback = null) => {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
};

const obfuscateEmail = (email = '') => {
  const s = String(email || '');
  const [local, domain] = s.split('@');
  if (!local || !domain) return s;
  const keep = Math.min(2, local.length);
  return `${local.slice(0, keep)}***@${domain}`;
};

async function sendEmail({ to, subject, text, html }) {
  const mode = String(getEnv('MAIL_TRANSPORT', 'auto')).toLowerCase();
  const from = getEnv('MAIL_FROM', getEnv('SMTP_FROM', 'no-reply@telehealth.local'));

  const payload = { to, from, subject, text, html };

  if (mode === 'console') {
    console.log('[mailer] MAIL_TRANSPORT=console; skipping delivery', {
      to: obfuscateEmail(to),
      subject,
      preview: (text || '').slice(0, 200),
      id: crypto.randomBytes(6).toString('hex'),
    });
    if (text) console.log(text);
    return { ok: true, skipped: true, transport: 'console' };
  }

  const host = getEnv('SMTP_HOST');
  const port = Number(getEnv('SMTP_PORT', 587));
  const user = getEnv('SMTP_USER');
  const pass = getEnv('SMTP_PASS');
  const secure = String(getEnv('SMTP_SECURE', 'false')).toLowerCase() === 'true';

  if (!host || !user || !pass) {
    console.warn('[mailer] SMTP not configured; skipping delivery', {
      hasHost: !!host,
      hasUser: !!user,
      hasPass: !!pass,
      to: obfuscateEmail(to),
    });
    if (text) console.log(text);
    return { ok: true, skipped: true, transport: 'unconfigured' };
  }

  let nodemailer;
  try {
    // Optional dependency: if not installed, we fall back to console logging.
    nodemailer = require('nodemailer');
  } catch (err) {
    console.warn('[mailer] nodemailer not installed; skipping delivery');
    if (text) console.log(text);
    return { ok: true, skipped: true, transport: 'missing-nodemailer' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const info = await transporter.sendMail(payload);
  return { ok: true, skipped: false, transport: 'smtp', info };
}

module.exports = {
  sendEmail,
};
