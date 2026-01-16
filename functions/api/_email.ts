/**
 * BLAZE SPORTS INTEL - EMAIL SERVICE
 *
 * Sends transactional emails via Resend API
 * Templates for welcome, payment, subscription lifecycle
 *
 * Required env vars:
 *   RESEND_API_KEY: Resend API key
 *   FROM_EMAIL: Sender email (default: noreply@blazesportsintel.com)
 *
 * @version 1.0.0
 * @updated 2025-12-10
 */

interface EmailEnv {
  RESEND_API_KEY: string;
  FROM_EMAIL?: string;
  DB?: D1Database;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
  emailType: string;
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

const DEFAULT_FROM = 'Blaze Sports Intel <noreply@blazesportsintel.com>';
const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Send an email via Resend
 */
export async function sendEmail(options: SendEmailOptions, env: EmailEnv): Promise<EmailResult> {
  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  const logId = crypto.randomUUID();

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || DEFAULT_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const data = (await response.json()) as { id?: string; message?: string };

    // Log email
    if (env.DB) {
      await logEmail(env.DB, {
        id: logId,
        userId: options.userId,
        to: options.to,
        type: options.emailType,
        subject: options.subject,
        status: response.ok ? 'sent' : 'failed',
        providerId: data.id,
        error: response.ok ? undefined : data.message,
      });
    }

    if (!response.ok) {
      console.error('Resend error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Email send error:', error);

    if (env.DB) {
      await logEmail(env.DB, {
        id: logId,
        userId: options.userId,
        to: options.to,
        type: options.emailType,
        subject: options.subject,
        status: 'failed',
        error: String(error),
      });
    }

    return { success: false, error: String(error) };
  }
}

// --- Email Templates ---

export function welcomeEmail(
  name: string,
  email: string
): { subject: string; html: string; text: string } {
  const subject = 'Welcome to Blaze Sports Intel';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Blaze Sports Intel</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://blazesportsintel.com/images/logo/blaze-logo.png" alt="Blaze Sports Intel" style="height:48px;">
    </div>

    <div style="background-color:#1A1A1A;border-radius:12px;padding:32px;border:1px solid #333;">
      <h1 style="color:#FF6B35;margin:0 0 16px;font-size:24px;">Welcome to Blaze Sports Intel${name ? `, ${name}` : ''}</h1>

      <p style="color:#FAF8F5;font-size:16px;line-height:1.6;margin:0 0 24px;">
        You're in. Real sports analytics, no corporate slop.
      </p>

      <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Comprehensive sports intelligence—starting with college baseball. Live scores, real-time standings,
        and analytics that actually mean something.
      </p>

      <div style="margin:32px 0;">
        <a href="https://blazesportsintel.com/college-baseball"
           style="display:inline-block;background-color:#FF6B35;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
          Explore College Baseball
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #333;margin:24px 0;">

      <p style="color:#666;font-size:12px;margin:0;">
        Need more? Upgrade to Pro for advanced analytics, predictions, and API access.
      </p>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <p style="color:#666;font-size:12px;margin:0;">
        &copy; ${new Date().getFullYear()} Blaze Sports Intel. Born to Blaze the Path Less Beaten.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Welcome to Blaze Sports Intel${name ? `, ${name}` : ''}!

You're in. Real sports analytics, no corporate slop.

Comprehensive sports intelligence—starting with college baseball. Live scores, real-time standings, and analytics that actually mean something.

Get started: https://blazesportsintel.com/college-baseball

Need more? Upgrade to Pro for advanced analytics, predictions, and API access.

---
Blaze Sports Intel
Born to Blaze the Path Less Beaten`;

  return { subject, html, text };
}

export function paymentSuccessEmail(
  name: string,
  amount: number,
  tier: string,
  invoiceId: string
): { subject: string; html: string; text: string } {
  const formattedAmount = (amount / 100).toFixed(2);
  const subject = `Payment received - $${formattedAmount}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://blazesportsintel.com/images/logo/blaze-logo.png" alt="Blaze Sports Intel" style="height:48px;">
    </div>

    <div style="background-color:#1A1A1A;border-radius:12px;padding:32px;border:1px solid #333;">
      <h1 style="color:#2E7D32;margin:0 0 16px;font-size:24px;">Payment Received</h1>

      <p style="color:#FAF8F5;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Thanks${name ? `, ${name}` : ''}! Your payment has been processed.
      </p>

      <div style="background-color:#0D0D0D;border-radius:8px;padding:20px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#999;padding:8px 0;">Amount</td>
            <td style="color:#FAF8F5;text-align:right;padding:8px 0;font-weight:600;">$${formattedAmount}</td>
          </tr>
          <tr>
            <td style="color:#999;padding:8px 0;">Plan</td>
            <td style="color:#FF6B35;text-align:right;padding:8px 0;font-weight:600;">${tier.charAt(0).toUpperCase() + tier.slice(1)}</td>
          </tr>
          <tr>
            <td style="color:#999;padding:8px 0;">Invoice</td>
            <td style="color:#FAF8F5;text-align:right;padding:8px 0;font-family:monospace;font-size:12px;">${invoiceId}</td>
          </tr>
        </table>
      </div>

      <p style="color:#999;font-size:14px;line-height:1.6;margin:0;">
        You now have full access to ${tier} features. Go explore.
      </p>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <p style="color:#666;font-size:12px;margin:0;">
        Questions? Reply to this email or hit us up at support@blazesportsintel.com
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Payment Received

Thanks${name ? `, ${name}` : ''}! Your payment has been processed.

Amount: $${formattedAmount}
Plan: ${tier.charAt(0).toUpperCase() + tier.slice(1)}
Invoice: ${invoiceId}

You now have full access to ${tier} features. Go explore.

Questions? Reply to this email or hit us up at support@blazesportsintel.com`;

  return { subject, html, text };
}

export function subscriptionCanceledEmail(
  name: string,
  endDate: string
): { subject: string; html: string; text: string } {
  const subject = 'Your subscription has been canceled';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://blazesportsintel.com/images/logo/blaze-logo.png" alt="Blaze Sports Intel" style="height:48px;">
    </div>

    <div style="background-color:#1A1A1A;border-radius:12px;padding:32px;border:1px solid #333;">
      <h1 style="color:#FAF8F5;margin:0 0 16px;font-size:24px;">Subscription Canceled</h1>

      <p style="color:#FAF8F5;font-size:16px;line-height:1.6;margin:0 0 24px;">
        ${name ? `Hey ${name}, ` : ''}We've canceled your subscription as requested.
      </p>

      <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 24px;">
        You'll keep access to your current features until <strong style="color:#FAF8F5;">${endDate}</strong>.
        After that, you'll be switched to our free tier.
      </p>

      <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Changed your mind? You can resubscribe anytime from your account settings.
      </p>

      <div style="margin:32px 0;">
        <a href="https://blazesportsintel.com/portal"
           style="display:inline-block;background-color:#FF6B35;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
          Manage Account
        </a>
      </div>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <p style="color:#666;font-size:12px;margin:0;">
        Thanks for being part of Blaze Sports Intel.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Subscription Canceled

${name ? `Hey ${name}, ` : ''}We've canceled your subscription as requested.

You'll keep access to your current features until ${endDate}. After that, you'll be switched to our free tier.

Changed your mind? You can resubscribe anytime from your account settings.

Manage Account: https://blazesportsintel.com/portal

Thanks for being part of Blaze Sports Intel.`;

  return { subject, html, text };
}

export function paymentFailedEmail(
  name: string,
  attemptCount: number
): { subject: string; html: string; text: string } {
  const subject = 'Payment failed - action required';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://blazesportsintel.com/images/logo/blaze-logo.png" alt="Blaze Sports Intel" style="height:48px;">
    </div>

    <div style="background-color:#1A1A1A;border-radius:12px;padding:32px;border:1px solid #C62828;">
      <h1 style="color:#C62828;margin:0 0 16px;font-size:24px;">Payment Failed</h1>

      <p style="color:#FAF8F5;font-size:16px;line-height:1.6;margin:0 0 24px;">
        ${name ? `Hey ${name}, ` : ''}We couldn't process your payment (attempt ${attemptCount}).
      </p>

      <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Please update your payment method to keep your subscription active.
        ${attemptCount >= 2 ? 'Your account may be downgraded if payment continues to fail.' : ''}
      </p>

      <div style="margin:32px 0;">
        <a href="https://blazesportsintel.com/portal"
           style="display:inline-block;background-color:#C62828;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
          Update Payment Method
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `Payment Failed

${name ? `Hey ${name}, ` : ''}We couldn't process your payment (attempt ${attemptCount}).

Please update your payment method to keep your subscription active.
${attemptCount >= 2 ? 'Your account may be downgraded if payment continues to fail.' : ''}

Update Payment Method: https://blazesportsintel.com/portal`;

  return { subject, html, text };
}

// --- Internal helpers ---

async function logEmail(
  db: D1Database,
  data: {
    id: string;
    userId?: string;
    to: string;
    type: string;
    subject: string;
    status: string;
    providerId?: string;
    error?: string;
  }
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO email_log (id, user_id, email_to, email_type, subject, status, provider_id, error_message, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${data.status === 'sent' ? 'unixepoch()' : 'NULL'})`
      )
      .bind(
        data.id,
        data.userId || null,
        data.to,
        data.type,
        data.subject,
        data.status,
        data.providerId || null,
        data.error || null
      )
      .run();
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}
