import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

type OtpPurpose = "verification" | "reset";

export class EmailService {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
  });

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      logger.info("DEV EMAIL", { to, subject, html });
      return;
    }

    await this.transporter.sendMail({
      from: `"FCN" <${env.SMTP_USER}>`,
      to,
      subject,
      html
    });
  }

  async sendOTPEmail(to: string, otp: string, purpose: OtpPurpose): Promise<void> {
    const subject = purpose === "verification" ? "Verify your FCN account" : "Reset your FCN password";
    await this.send(
      to,
      subject,
      this.shell(`
        <p style="margin:0 0 16px">Use this one-time code to ${purpose === "verification" ? "verify your FCN account" : "reset your FCN password"}.</p>
        <div style="font-family:Consolas,monospace;font-size:34px;font-weight:800;letter-spacing:8px;color:#0A7EA4;text-align:center;padding:18px 0">${otp}</div>
        <p style="margin:16px 0 0;color:#475569">This code expires in 10 minutes.</p>
        <p style="margin:8px 0 0;color:#475569">If you did not request this, ignore this email.</p>
      `)
    );
  }

  async sendWelcomeEmail(to: string, fullName: string, role: string): Promise<void> {
    await this.send(
      to,
      "Welcome to FCN - Healthcare Without Walls",
      this.shell(`
        <h2 style="margin:0 0 12px;color:#1E293B">Welcome, ${fullName}</h2>
        <p style="margin:0 0 16px">FCN connects patients, clinicians, and health workers across Ethiopia with remote care, vitals tracking, e-prescriptions, and coordinated follow-up.</p>
        <p style="margin:0 0 20px">Your role is registered as <strong>${role}</strong>.</p>
        <a href="${env.FRONTEND_URL}" style="display:inline-block;background:#0A7EA4;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Open FCN</a>
        <p style="margin:20px 0 0;color:#64748B">Medical care imagery: connected doctors, nurses, and patients receiving coordinated care beyond hospital walls.</p>
      `)
    );
  }

  async sendApprovalEmail(to: string, fullName: string): Promise<void> {
    await this.send(
      to,
      "Your FCN account has been approved!",
      this.shell(`<h2 style="margin:0 0 12px;color:#1E293B">Congratulations, ${fullName}</h2><p>Your FCN account is approved. You can now sign in and start using the platform.</p><a href="${env.FRONTEND_URL}/login" style="display:inline-block;background:#0A7EA4;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Login</a>`)
    );
  }

  async sendHospitalAdminWelcomeEmail(to: string, fullName: string, hospitalName: string, tempPassword: string): Promise<void> {
    await this.send(
      to,
      "You have been added as an FCN Hospital Administrator",
      this.shell(`
        <h2 style="margin:0 0 12px;color:#1E293B">Welcome, ${fullName}</h2>
        <p style="margin:0 0 16px">You have been added as a Hospital Administrator for <strong>${hospitalName}</strong>.</p>
        <p style="margin:0 0 8px">Use the following credentials to sign in:</p>
        <div style="background:#F8FFFE;border:1px solid rgba(10,126,164,0.16);border-radius:8px;padding:16px;margin:12px 0">
          <p style="margin:0 0 4px"><strong>Email:</strong> ${to}</p>
          <p style="margin:0"><strong>Temp Password:</strong> ${tempPassword}</p>
        </div>
        <p style="margin:16px 0 0;color:#F87171;font-size:13px">Please change your password on first login. This temporary password will expire in 48 hours.</p>
        <a href="${env.FRONTEND_URL}/login" style="display:inline-block;background:#0A7EA4;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:12px">Sign In to FCN</a>
      `)
    );
  }

  async sendRejectionEmail(to: string, fullName: string, reason: string): Promise<void> {
    await this.send(
      to,
      "FCN Account Application Update",
      this.shell(`<h2 style="margin:0 0 12px;color:#1E293B">Hello, ${fullName}</h2><p>We could not approve your FCN application at this time.</p><p><strong>Reason:</strong> ${reason}</p><p>You may reapply after correcting the issue.</p>`)
    );
  }

  async sendCustomEmail(to: string, subject: string, html: string): Promise<void> {
    await this.send(to, subject, html);
  }

  async sendPasswordChangeAlert(to: string, fullName: string): Promise<void> {
    const now = new Date().toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" });
    await this.send(
      to,
      "FCN: Your password was changed",
      this.shell(`
        <h2 style="margin:0 0 12px;color:#1E293B">Password Changed</h2>
        <p style="margin:0 0 16px">Your FCN account password was changed on ${now}.</p>
        <p style="margin:16px 0 0;color:#F87171;font-weight:600">If this wasn't you, please contact support immediately at support@fcncare.com</p>
      `)
    );
  }

  async send2FAEnabledEmail(to: string, fullName: string): Promise<void> {
    await this.send(
      to,
      "2FA has been enabled on your FCN account",
      this.shell(`
        <h2 style="margin:0 0 12px;color:#1E293B">Two-Factor Authentication Enabled</h2>
        <p style="margin:0 0 16px">Two-factor authentication has been enabled on your FCN account. Your account is now more secure.</p>
        <p style="margin:16px 0 0;color:#475569">If you didn't make this change, please contact support immediately.</p>
      `)
    );
  }

  async send2FADisabledEmail(to: string, fullName: string): Promise<void> {
    await this.send(
      to,
      "2FA has been disabled on your FCN account",
      this.shell(`
        <h2 style="margin:0 0 12px;color:#1E293B">Two-Factor Authentication Disabled</h2>
        <p style="margin:0 0 16px">Two-factor authentication has been disabled on your FCN account.</p>
        <p style="margin:16px 0 0;color:#475569">If you didn't make this change, please contact support immediately.</p>
      `)
    );
  }

  private shell(content: string): string {
    return `
      <div style="background:#F8FFFE;padding:32px;font-family:Inter,Arial,sans-serif;color:#1E293B">
        <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(10,126,164,0.16);border-radius:12px;overflow:hidden">
          <div style="background:#0A7EA4;color:#FFFFFF;padding:20px 24px">
            <div style="font-size:24px;font-weight:800">FCN</div>
            <div style="font-size:13px;opacity:.9">Foundation Care Network</div>
          </div>
          <div style="padding:24px">${content}</div>
          <div style="padding:16px 24px;background:#F8FFFE;color:#64748B;font-size:12px">FCN - Healthcare Without Walls</div>
        </div>
      </div>
    `;
  }
}

export const emailService = new EmailService();
