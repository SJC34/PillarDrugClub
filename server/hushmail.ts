import nodemailer from "nodemailer";

function getHushmailConfig() {
  const host = process.env.HUSHMAIL_SMTP_HOST;
  const user = process.env.HUSHMAIL_SMTP_USER;
  const pass = process.env.HUSHMAIL_SMTP_PASS;
  return { host, user, pass, configured: !!(host && user && pass) };
}

function createTransport() {
  const { host, user, pass } = getHushmailConfig();
  return nodemailer.createTransport({
    host: host || "smtp.hushmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
  });
}

export async function sendPhiEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: Buffer }>
): Promise<boolean> {
  const { configured, user } = getHushmailConfig();
  if (!configured) {
    console.warn("HushMail SMTP not configured — PHI email not sent");
    return false;
  }

  try {
    const transport = createTransport();
    await transport.sendMail({
      from: user,
      to,
      subject,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    console.log(`✅ PHI email sent via HushMail to ${to}`);
    return true;
  } catch (error) {
    console.error("HushMail PHI email failed:", error);
    return false;
  }
}

export async function testHushmailConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  const { configured } = getHushmailConfig();
  if (!configured) {
    return { connected: false, error: "HUSHMAIL_SMTP credentials not set" };
  }
  try {
    const transport = createTransport();
    await transport.verify();
    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err?.message || "Connection failed" };
  }
}

export function isHushmailConfigured(): boolean {
  return getHushmailConfig().configured;
}
