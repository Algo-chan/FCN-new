import { prisma } from "../../config/database";
import { emailService } from "../auth/email.service";

export class WaitlistService {
  async addToWaitlist(name: string, email: string): Promise<void> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    const existing = await prisma.waitlistEntry.findUnique({
      where: { email }
    });

    if (existing) {
      return;
    }

    await prisma.waitlistEntry.create({
      data: { name, email }
    });

    await emailService.sendCustomEmail(
      email,
      "You're on the FCN waitlist! 🎉",
      this.buildWelcomeEmail(name)
    );
  }

  private buildWelcomeEmail(name: string): string {
    return `
      <div style="background:#F8FFFE;padding:32px;font-family:Inter,Arial,sans-serif;color:#1E293B">
        <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(10,126,164,0.16);border-radius:12px;overflow:hidden">
          <div style="background:#0A7EA4;color:#FFFFFF;padding:20px 24px">
            <div style="font-size:24px;font-weight:800">FCN</div>
            <div style="font-size:13px;opacity:.9">Foundation Care Network</div>
          </div>
          <div style="padding:24px">
            <h2 style="margin:0 0 16px;color:#1E293B">You're in, ${name}! 🎉</h2>
            <p style="margin:0 0 16px;color:#475569;line-height:1.6">
              We'll notify you the moment FCN launches on July 15, 2026 in Dire Dawa, Ethiopia.
            </p>
            <p style="margin:0 0 20px;color:#475569;line-height:1.6">
              In the meantime, tell your friends and family about FCN.
            </p>
            <a href="https://fcncare.com" style="display:inline-block;background:#0A7EA4;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Share FCN</a>
            <div style="margin:24px 0 0;padding:16px;background:#F8FFFE;border-radius:8px">
              <h3 style="margin:0 0 12px;font-size:14px;color:#0A7EA4">What's coming:</h3>
              <ul style="margin:0;padding-left:20px;color:#475569;font-size:13px;line-height:1.8">
                <li>🏥 Remote Consultations — See a doctor from home</li>
                <li>🤖 AI Health Check — Symptoms in Amharic, Somali, Oromo or English</li>
                <li>💊 E-Prescriptions — Digital prescriptions to partner pharmacies</li>
              </ul>
            </div>
            <p style="margin:20px 0 0;color:#2DD4BF;font-style:italic;font-size:13px">Compassion. Connection. Care.</p>
          </div>
          <div style="padding:16px 24px;background:#F8FFFE;color:#64748B;font-size:12px">noreply@fcncare.com</div>
        </div>
      </div>
    `;
  }
}

export const waitlistService = new WaitlistService();
