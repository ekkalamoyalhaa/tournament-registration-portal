import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail({
  to,
  firstName,
  verifyUrl,
}: {
  to: string;
  firstName: string;
  verifyUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY not set — skipping send');
    return { success: false, error: 'No API key' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Tournament Portal <${process.env.FROM_EMAIL ?? 'onboarding@resend.dev'}>`,
      to,
      subject: 'Verify your tournament account',
      html: verificationTemplate({ firstName, verifyUrl }),
    });

    if (error) {
      console.error('[EMAIL] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('[EMAIL] Sent verification to', to, '— id:', data?.id);
    return { success: true, id: data?.id };
  } catch (e) {
    console.error('[EMAIL] Exception:', e);
    return { success: false, error: 'Failed to send email' };
  }
}

function verificationTemplate({
  firstName,
  verifyUrl,
}: {
  firstName: string;
  verifyUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your account</title>
</head>
<body style="margin:0;padding:0;background-color:#0F1115;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background:#111317;border:1px solid rgba(255,255,255,0.08);border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.2);">
          <tr>
            <td style="padding:40px 32px 32px;">
              <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.05em;text-transform:uppercase;color:#849495;">Tournament Registration Portal</p>
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#e2e2e8;letter-spacing:-0.01em;">Verify your email</h1>
              <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#b9cacb;">Hi ${firstName},<br><br>Click the button below to activate your account and start your team registration.</p>
              <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;background:#00f0ff;color:#006970;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;letter-spacing:0.02em;">Verify account</a>
              <p style="margin:24px 0 0;font-size:14px;line-height:20px;color:#60708a;">Or paste this link into your browser:<br><span style="color:#00f0ff;word-break:break-all;">${verifyUrl}</span></p>
              <p style="margin:24px 0 0;font-size:12px;color:#60708a;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}