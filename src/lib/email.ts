import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendPasswordResetEmail({
  to,
  name,
  code,
}: {
  to: string;
  name: string;
  code: string;
}): Promise<{ success: boolean; error?: string; devCode?: string }> {
  try {
    if (resend && process.env.RESEND_API_KEY) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || "FinanceTrack <onboarding@resend.dev>";
      
      await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: `${code} is your FinanceTrack Password Reset Code`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #1e293b; }
                .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #f1f5f9; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
                .logo { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 24px; }
                .logo-accent { color: #00a859; }
                .code-box { background: #f0fdf4; border: 1.5px dashed #00a859; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
                .code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #00a859; font-family: monospace; }
                .footer { font-size: 12px; color: #94a3b8; margin-top: 28px; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">Finance<span class="logo-accent">Track</span></div>
                <h2 style="font-size: 18px; margin: 0 0 8px 0; color: #0f172a;">Password Reset Request</h2>
                <p style="font-size: 14px; line-height: 1.5; color: #64748b; margin: 0 0 16px 0;">
                  Hi ${name || "there"}, we received a request to reset your password. Use the verification code below:
                </p>
                <div class="code-box">
                  <div class="code">${code}</div>
                </div>
                <p style="font-size: 13px; color: #64748b; margin: 0;">
                  This code expires in <strong>15 minutes</strong>. If you did not request this, you can safely ignore this email.
                </p>
                <div class="footer">
                  © 2026 FinanceTrack. All rights reserved.
                </div>
              </div>
            </body>
          </html>
        `,
      });
      return { success: true };
    } else {
      console.log(`\n========================================`);
      console.log(`[PASSWORD RESET CODE FOR ${to}]: ${code}`);
      console.log(`========================================\n`);
      return { success: true, devCode: code };
    }
  } catch (error) {
    console.error("[Email Sending Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
      devCode: code,
    };
  }
}
