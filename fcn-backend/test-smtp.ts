import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const user = process.env.SMTP_USER!;
const pass = process.env.SMTP_PASS!;

const configs = [
  { host: "mail.fcncare.com", port: 465, secure: true, label: "mail.fcncare.com:465 (SSL)" },
  { host: "mail.fcncare.com", port: 587, secure: false, label: "mail.fcncare.com:587 (STARTTLS)" },
  { host: "fcncare.com", port: 465, secure: true, label: "fcncare.com:465 (SSL)" },
  { host: "fcncare.com", port: 587, secure: false, label: "fcncare.com:587 (STARTTLS)" },
  { host: "smtp.fcncare.com", port: 465, secure: true, label: "smtp.fcncare.com:465 (SSL)" },
  { host: "smtp.fcncare.com", port: 587, secure: false, label: "smtp.fcncare.com:587 (STARTTLS)" },
];

async function testAll() {
  console.log(`Testing with: ${user}\n`);

  for (const cfg of configs) {
    const label = cfg.label;
    try {
      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 5000
      });
      await transporter.verify();
      console.log(`✓ SUCCESS: ${label}`);
      process.exit(0);
    } catch (err: any) {
      const msg = err.code || err.message.split("\n")[0];
      console.log(`✗ FAILED:  ${label} → ${msg}`);
    }
  }
  console.log("\nNone worked. The email account password is likely wrong.");
}

testAll();
