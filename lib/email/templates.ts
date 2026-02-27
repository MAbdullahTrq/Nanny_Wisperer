/**
 * HTML email templates for all notification types.
 * Uses inline styles for maximum email client compatibility.
 */

const BRAND_COLOR = '#6B46C1';
const BRAND_COLOR_LIGHT = '#F7F3FF';
const TEXT_COLOR = '#1F2937';
const TEXT_MUTED = '#6B7280';
const BORDER_COLOR = '#E5E7EB';

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nanny Whisperer</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F3F4F6;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Nanny Whisperer</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid ${BORDER_COLOR};text-align:center;">
              <p style="margin:0;color:${TEXT_MUTED};font-size:13px;line-height:20px;">
                &copy; ${new Date().getFullYear()} Nanny Whisperer. All rights reserved.
              </p>
              <p style="margin:8px 0 0;color:${TEXT_MUTED};font-size:12px;line-height:18px;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
  <tr>
    <td align="center" style="background-color:${BRAND_COLOR};border-radius:8px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;color:${TEXT_COLOR};font-size:22px;font-weight:600;">${text}</h2>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:${TEXT_COLOR};font-size:15px;line-height:24px;">${text}</p>`;
}

function muted(text: string): string {
  return `<p style="margin:0 0 16px;color:${TEXT_MUTED};font-size:13px;line-height:20px;">${text}</p>`;
}

function infoBox(text: string): string {
  return `<div style="background-color:${BRAND_COLOR_LIGHT};border-radius:8px;padding:16px 20px;margin:16px 0;">
  <p style="margin:0;color:${TEXT_COLOR};font-size:14px;line-height:22px;">${text}</p>
</div>`;
}

// ─── Template functions ───

export function welcomeEmail(params: { name: string; userType: string; appUrl: string }) {
  const dashboardUrl = params.userType === 'Host'
    ? `${params.appUrl}/host/dashboard`
    : `${params.appUrl}/nanny/dashboard`;

  const html = layout(`
    ${heading(`Welcome to Nanny Whisperer, ${params.name}!`)}
    ${paragraph(`Thank you for creating your <strong>${params.userType}</strong> account. We're excited to help you find the perfect match.`)}
    ${paragraph(`Here's what you can do next:`)}
    <ul style="margin:0 0 16px;padding-left:20px;color:${TEXT_COLOR};font-size:15px;line-height:28px;">
      <li>Complete your profile and onboarding</li>
      <li>${params.userType === 'Host' ? 'Browse matched nannies and au pairs' : 'Get matched with host families'}</li>
      <li>Schedule interviews with potential matches</li>
    </ul>
    ${button('Go to Dashboard', dashboardUrl)}
    ${muted('If you did not create this account, please ignore this email or contact our support team.')}
  `);

  return {
    subject: 'Welcome to Nanny Whisperer!',
    html,
  };
}

export function emailVerificationEmail(params: { name: string; verifyUrl: string }) {
  const html = layout(`
    ${heading('Verify your email address')}
    ${paragraph(`Hi ${params.name},`)}
    ${paragraph('Please verify your email address by clicking the button below. This link is valid for <strong>24 hours</strong>.')}
    ${button('Verify Email', params.verifyUrl)}
    ${muted(`If the button doesn't work, copy and paste this link into your browser:`)}
    ${muted(`<a href="${params.verifyUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${params.verifyUrl}</a>`)}
    ${muted('If you did not sign up for Nanny Whisperer, please ignore this email.')}
  `);

  return {
    subject: 'Verify your email – Nanny Whisperer',
    html,
  };
}

export function loginNotificationEmail(params: {
  name: string;
  loginTime: string;
  ipAddress: string;
  userAgent: string;
  appUrl: string;
}) {
  const html = layout(`
    ${heading('New login to your account')}
    ${paragraph(`Hi ${params.name},`)}
    ${paragraph('We detected a new login to your Nanny Whisperer account.')}
    ${infoBox(`
      <strong>Time:</strong> ${params.loginTime}<br/>
      <strong>IP Address:</strong> ${params.ipAddress}<br/>
      <strong>Device:</strong> ${params.userAgent}
    `)}
    ${paragraph('If this was you, no action is needed.')}
    ${paragraph(`If you don't recognize this activity, please <a href="${params.appUrl}/reset-password" style="color:${BRAND_COLOR};font-weight:600;">change your password</a> immediately and contact our support team.`)}
    ${muted('This is an automated security notification.')}
  `);

  return {
    subject: 'New login detected – Nanny Whisperer',
    html,
  };
}

export function forgotPasswordEmail(params: { name: string; resetUrl: string }) {
  const html = layout(`
    ${heading('Reset your password')}
    ${paragraph(`Hi ${params.name},`)}
    ${paragraph('We received a request to reset your password. Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.')}
    ${button('Reset Password', params.resetUrl)}
    ${muted(`If the button doesn't work, copy and paste this link into your browser:`)}
    ${muted(`<a href="${params.resetUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${params.resetUrl}</a>`)}
    ${muted('If you didn\'t request a password reset, you can safely ignore this email. Your password will not be changed.')}
  `);

  return {
    subject: 'Reset your password – Nanny Whisperer',
    html,
  };
}

export function passwordChangedEmail(params: { name: string; appUrl: string }) {
  const html = layout(`
    ${heading('Your password has been changed')}
    ${paragraph(`Hi ${params.name},`)}
    ${paragraph('Your Nanny Whisperer password was successfully changed.')}
    ${infoBox(`<strong>Time:</strong> ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`)}
    ${paragraph(`If you did not make this change, please <a href="${params.appUrl}/forgot-password" style="color:${BRAND_COLOR};font-weight:600;">reset your password</a> immediately and contact our support team.`)}
    ${muted('This is an automated security notification.')}
  `);

  return {
    subject: 'Password changed – Nanny Whisperer',
    html,
  };
}

export function accountLockedEmail(params: { name: string; appUrl: string }) {
  const html = layout(`
    ${heading('Your account has been locked')}
    ${paragraph(`Hi ${params.name},`)}
    ${paragraph('Your Nanny Whisperer account has been locked by an administrator. You will not be able to log in until it is unlocked.')}
    ${paragraph('If you believe this was done in error, please contact our support team for assistance.')}
    ${muted('This is an automated notification from Nanny Whisperer.')}
  `);

  return {
    subject: 'Account locked – Nanny Whisperer',
    html,
  };
}

export function accountUnlockedEmail(params: { name: string; appUrl: string }) {
  const html = layout(`
    ${heading('Your account has been unlocked')}
    ${paragraph(`Hi ${params.name},`)}
    ${paragraph('Your Nanny Whisperer account has been unlocked. You can now log in again.')}
    ${button('Log In', `${params.appUrl}/login`)}
    ${muted('This is an automated notification from Nanny Whisperer.')}
  `);

  return {
    subject: 'Account unlocked – Nanny Whisperer',
    html,
  };
}

export function matchNotificationEmail(params: {
  name: string;
  matchCount: number;
  appUrl: string;
  userType: string;
}) {
  const dashboardUrl = params.userType === 'Host'
    ? `${params.appUrl}/host/dashboard`
    : `${params.appUrl}/nanny/dashboard`;

  const html = layout(`
    ${heading('You have new matches!')}
    ${paragraph(`Hi ${params.name},`)}
    ${paragraph(`Great news! You have <strong>${params.matchCount} new match${params.matchCount > 1 ? 'es' : ''}</strong> on Nanny Whisperer.`)}
    ${paragraph('Log in to view your matches and take the next step.')}
    ${button('View Matches', dashboardUrl)}
    ${muted('This is an automated notification from Nanny Whisperer.')}
  `);

  return {
    subject: `You have ${params.matchCount} new match${params.matchCount > 1 ? 'es' : ''}! – Nanny Whisperer`,
    html,
  };
}

export function interviewScheduledEmail(params: {
  name: string;
  otherPartyName: string;
  dateTime: string;
  meetLink?: string;
  appUrl: string;
}) {
  const html = layout(`
    ${heading('Interview scheduled')}
    ${paragraph(`Hi ${params.name},`)}
    ${paragraph(`Your interview with <strong>${params.otherPartyName}</strong> has been scheduled.`)}
    ${infoBox(`<strong>Date & Time:</strong> ${params.dateTime}${params.meetLink ? `<br/><strong>Meeting Link:</strong> <a href="${params.meetLink}" style="color:${BRAND_COLOR};">${params.meetLink}</a>` : ''}`)}
    ${paragraph('Please make sure to join on time. Good luck!')}
    ${params.meetLink ? button('Join Meeting', params.meetLink) : button('View Details', `${params.appUrl}/login`)}
    ${muted('This is an automated notification from Nanny Whisperer.')}
  `);

  return {
    subject: `Interview scheduled with ${params.otherPartyName} – Nanny Whisperer`,
    html,
  };
}

export function shortlistDeliveredEmail(params: {
  name: string;
  shortlistUrl: string;
  nannyCount: number;
}) {
  const html = layout(`
    ${heading('Your shortlist is ready!')}
    ${paragraph(`Hi ${params.name},`)}
    ${paragraph(`Your curated shortlist with <strong>${params.nannyCount} caregiver${params.nannyCount > 1 ? 's' : ''}</strong> is ready for you to review.`)}
    ${paragraph('Take a look and let us know which candidates you\'d like to proceed with.')}
    ${button('View Shortlist', params.shortlistUrl)}
    ${muted('This is an automated notification from Nanny Whisperer.')}
  `);

  return {
    subject: 'Your shortlist is ready – Nanny Whisperer',
    html,
  };
}
