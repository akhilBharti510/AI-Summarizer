import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter = null;
let verifyPromise = null;

// Bounded per-stage timeouts. Vercel's fetch gives up at ~9s, so every SMTP
// stage must finish under that. Hangs (e.g. Railway → smtp.gmail.com:465 TLS
// stalls) would otherwise hold the request for ~90s until OS TCP retransmit.
const SMTP_TIMEOUT_MS = 8000;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST) return null;
  const secure = env.SMTP_SECURE ?? Number(env.SMTP_PORT) === 465;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure,
    requireTLS: !secure && Number(env.SMTP_PORT) === 587,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });
  return transporter;
}

// One-shot verify; cache the promise so subsequent sends reuse the result.
// Failure is logged but non-fatal — verify can flake, and the per-call timeout
// below is the real safety net.
function verifyOnce(t) {
  if (verifyPromise) return verifyPromise;
  verifyPromise = t
    .verify()
    .then(() => {
      logger.info('SMTP transport verified', { host: env.SMTP_HOST, port: env.SMTP_PORT });
      return true;
    })
    .catch((err) => {
      logger.error('SMTP verify failed', {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        code: err.code,
        command: err.command,
        message: err.message,
      });
      return false;
    });
  return verifyPromise;
}

function withTimeout(promise, ms, label) {
  let to;
  const timeout = new Promise((_, reject) => {
    to = setTimeout(() => reject(new Error(`SMTP ${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(to));
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
  // Fire-and-forget verify so we log connectivity issues early without blocking sends.
  verifyOnce(t);
  return withTimeout(
    t.sendMail({ from: env.MAIL_FROM, to, subject, html, text }),
    SMTP_TIMEOUT_MS + 1000,
    'sendMail',
  );
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
