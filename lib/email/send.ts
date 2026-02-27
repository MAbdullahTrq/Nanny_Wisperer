/**
 * Email sending functions using SMTP2Go HTTP API.
 * Each function is a thin wrapper that picks a template and sends it.
 * All functions are fire-and-forget safe — they catch errors and log them
 * without throwing, so they never break the calling API route.
 */

import { config } from '@/lib/config';
import { sendViaSmtp2Go } from './transporter';
import {
  welcomeEmail,
  emailVerificationEmail,
  loginNotificationEmail,
  forgotPasswordEmail,
  passwordChangedEmail,
  accountLockedEmail,
  accountUnlockedEmail,
  matchNotificationEmail,
  interviewScheduledEmail,
  shortlistDeliveredEmail,
} from './templates';

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  try {
    return await sendViaSmtp2Go({ to, subject, html });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Email] Failed to send to ${to}: "${subject}" —`, message);
    return { success: false, error: message };
  }
}

// ─── Public API ───

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  userType: string;
}): Promise<SendResult> {
  const { subject, html } = welcomeEmail({
    name: params.name,
    userType: params.userType,
    appUrl: config.app.url,
  });
  return send(params.to, subject, html);
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  token: string;
}): Promise<SendResult> {
  const verifyUrl = `${config.app.url}/api/auth/verify-email?token=${encodeURIComponent(params.token)}`;
  const { subject, html } = emailVerificationEmail({
    name: params.name,
    verifyUrl,
  });
  return send(params.to, subject, html);
}

export async function sendLoginNotificationEmail(params: {
  to: string;
  name: string;
  ipAddress: string;
  userAgent: string;
}): Promise<SendResult> {
  const { subject, html } = loginNotificationEmail({
    name: params.name,
    loginTime: new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }),
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    appUrl: config.app.url,
  });
  return send(params.to, subject, html);
}

export async function sendForgotPasswordEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<SendResult> {
  const { subject, html } = forgotPasswordEmail({
    name: params.name,
    resetUrl: params.resetUrl,
  });
  return send(params.to, subject, html);
}

export async function sendPasswordChangedEmail(params: {
  to: string;
  name: string;
}): Promise<SendResult> {
  const { subject, html } = passwordChangedEmail({
    name: params.name,
    appUrl: config.app.url,
  });
  return send(params.to, subject, html);
}

export async function sendAccountLockedEmail(params: {
  to: string;
  name: string;
}): Promise<SendResult> {
  const { subject, html } = accountLockedEmail({
    name: params.name,
    appUrl: config.app.url,
  });
  return send(params.to, subject, html);
}

export async function sendAccountUnlockedEmail(params: {
  to: string;
  name: string;
}): Promise<SendResult> {
  const { subject, html } = accountUnlockedEmail({
    name: params.name,
    appUrl: config.app.url,
  });
  return send(params.to, subject, html);
}

export async function sendMatchNotificationEmail(params: {
  to: string;
  name: string;
  matchCount: number;
  userType: string;
}): Promise<SendResult> {
  const { subject, html } = matchNotificationEmail({
    name: params.name,
    matchCount: params.matchCount,
    appUrl: config.app.url,
    userType: params.userType,
  });
  return send(params.to, subject, html);
}

export async function sendInterviewScheduledEmail(params: {
  to: string;
  name: string;
  otherPartyName: string;
  dateTime: string;
  meetLink?: string;
}): Promise<SendResult> {
  const { subject, html } = interviewScheduledEmail({
    name: params.name,
    otherPartyName: params.otherPartyName,
    dateTime: params.dateTime,
    meetLink: params.meetLink,
    appUrl: config.app.url,
  });
  return send(params.to, subject, html);
}

export async function sendShortlistDeliveredEmail(params: {
  to: string;
  name: string;
  shortlistUrl: string;
  nannyCount: number;
}): Promise<SendResult> {
  const { subject, html } = shortlistDeliveredEmail({
    name: params.name,
    shortlistUrl: params.shortlistUrl,
    nannyCount: params.nannyCount,
  });
  return send(params.to, subject, html);
}
