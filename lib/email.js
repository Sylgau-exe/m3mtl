// lib/email.js - Email service for M3 Style
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'M3 Style <noreply@m3style.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sgauthier@executiveproducer.ca';
const APP_URL = process.env.APP_URL || 'https://m3style.vercel.app';

export async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    throw new Error('Email service not configured');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: Array.isArray(to) ? to : [to], subject, html, text, reply_to: replyTo }),
  });
  const data = await response.json();
  if (!response.ok) { console.error('Resend API error:', data); throw new Error(data.message || 'Failed to send email'); }
  return data;
}

function emailWrapper(content) {
  return `<!DOCTYPE html><html><head><style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #0D0D1A; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .header { background: #0D0D1A; color: #F5F0E8; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 4px; }
    .header h1 span { color: #C4A35A; }
    .header .sub { color: #999; font-size: 14px; margin-top: 8px; }
    .content { padding: 40px 30px; }
    .cta { text-align: center; margin: 32px 0; }
    .cta a { display: inline-block; background: #C4A35A; color: #0D0D1A; padding: 14px 32px; border-radius: 4px; text-decoration: none; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; font-size: 14px; }
    .warning { background: #FFF8E8; border: 1px solid #C4A35A; border-radius: 6px; padding: 16px; margin: 24px 0; font-size: 14px; }
    .footer { text-align: center; padding: 24px; color: #999; font-size: 13px; border-top: 1px solid #eee; }
    .gold { color: #C4A35A; }
  </style></head><body><div class="container"><div class="card">
    <div class="header"><h1>M3 <span>STYLE</span></h1><div class="sub">Votre styliste IA personnel</div></div>
    ${content}
    <div class="footer"><p>&copy; 2026 M3 Style &mdash; M3 Mode Masculine Montr&eacute;al &times; Sylvain PMO Consulting</p></div>
  </div></div></body></html>`;
}

export async function sendPasswordResetEmail({ name, email, resetToken, resetUrl }) {
  const firstName = name ? name.split(' ')[0] : '';
  const fullResetUrl = resetUrl || `${APP_URL}?reset_token=${resetToken}`;
  
  const html = emailWrapper(`
    <div class="content">
      <p>Bonjour ${firstName},</p>
      <p>Nous avons re&ccedil;u une demande de r&eacute;initialisation de votre mot de passe M3 Style. Cliquez le bouton ci-dessous pour cr&eacute;er un nouveau mot de passe&nbsp;:</p>
      <div class="cta"><a href="${fullResetUrl}">R&eacute;initialiser le mot de passe</a></div>
      <div class="warning">&nbsp; Ce lien expire dans 1 heure. Si vous n&rsquo;avez pas demand&eacute; cette r&eacute;initialisation, ignorez ce courriel.</div>
      <p>Si le bouton ne fonctionne pas, copiez-collez cette URL dans votre navigateur&nbsp;:</p>
      <p style="word-break:break-all;color:#C4A35A;">${fullResetUrl}</p>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: 'R\u00e9initialisation de votre mot de passe M3 Style',
    html,
    text: `Bonjour ${firstName}, visitez ce lien pour r\u00e9initialiser votre mot de passe: ${fullResetUrl}. Ce lien expire dans 1 heure.`,
  });
}

export async function sendWelcomeEmail({ name, email }) {
  const firstName = name ? name.split(' ')[0] : '';
  
  const html = emailWrapper(`
    <div class="content">
      <p>Bonjour ${firstName},</p>
      <p>Bienvenue sur <strong>M3 Style</strong>&nbsp;! Votre styliste IA personnel est pr&ecirc;t &agrave; vous aider.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin:24px 0;">
        <p>📐 <strong>Profil de mensurations</strong> &mdash; Pour des recommandations pr&eacute;cises</p>
        <p>👔 <strong>Garde-robe num&eacute;rique</strong> &mdash; Photographiez vos v&ecirc;tements</p>
        <p>✨ <strong>Styliste IA</strong> &mdash; Mix &amp; Match intelligent</p>
        <p>🛍 <strong>Designers M3</strong> &mdash; Collections exclusives</p>
      </div>
      <div class="cta"><a href="${APP_URL}/dashboard.html">Acc&eacute;der &agrave; mon tableau de bord &rarr;</a></div>
      <p>Bon style&nbsp;!<br><strong>L&rsquo;&eacute;quipe M3 Style</strong></p>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: `Bienvenue sur M3 Style, ${firstName}\u00a0! \u2728`,
    html,
    text: `Bienvenue sur M3 Style, ${firstName}! Acc\u00e9dez \u00e0 votre tableau de bord: ${APP_URL}/dashboard.html`,
    replyTo: ADMIN_EMAIL,
  });
}
