
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const resend = new Resend(resendApiKey);

export const sendResetEmail = async (email: string, resetToken: string) => {
  // Get the site URL from request headers or use default
  const siteUrl = 'https://34d679df-b261-47ea-b136-e7aae591255b.lovableproject.com';
  const resetUrl = `${siteUrl}/auth?reset_token=${resetToken}`;

  const sanitizedEmail = email.replace(/[<>"'&]/g, '');

  const emailResponse = await resend.emails.send({
    from: 'Universal Platform <noreply@californiatelecom.com>',
    to: [sanitizedEmail],
    subject: 'Password Reset - Universal Platform',
    html: `
      <h1>Password Reset Request</h1>
      <p>You have requested to reset your password for your Universal Platform account.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <p>Best regards,<br>The Universal Platform Team</p>
    `,
  });

  console.log('Password reset email sent via Resend:', emailResponse);
  return emailResponse;
};
