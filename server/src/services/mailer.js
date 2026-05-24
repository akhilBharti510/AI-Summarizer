import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: Number(env.SMTP_PORT) === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    if (env.isProd) {
      logger.error('SMTP not configured — refusing to send mail in production', { to, subject });
      throw new Error('Mailer not configured');
    }
    logger.warn(`[mailer:dev] would send to=${to} subject="${subject}"`);
    logger.debug(`[mailer:dev] body: ${text || html}`);
    return { mocked: true };
  }
  return t.sendMail({ from: env.MAIL_FROM, to, subject, html, text });
}

export function buildResetEmail({ name, link }) {
  const text = `Hi ${name},

We received a request to reset your AI Summarizer password.
Click the link below to set a new password. It expires in 30 minutes.

${link}

If you didn't request this, you can safely ignore this email.`;
  const html = `<p>Hi ${name},</p>
  <p>We received a request to reset your AI Summarizer password.</p>
  <p><a href="${link}">Reset your password</a> (link expires in 30 minutes).</p>
  <p>If you didn't request this, you can safely ignore this email.</p>`;
  return { text, html };
}
