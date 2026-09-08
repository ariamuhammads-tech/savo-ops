import nodemailer from "nodemailer";

export interface EmailAttachment {
  filename: string;
  content: string; // base64 string
  contentType?: string;
  encoding?: string;
}

export interface SendEmailPayload {
  to: string;
  recipientName: string;
  venueName: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

export async function sendB2BEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const smtpUser = process.env.SMTP_USER || "thesavorium@gmail.com";
  const rawPass = process.env.SMTP_PASS || process.env.GOOGLE_APP_PASSWORD || "";
  const smtpPass = rawPass.replace(/\s+/g, "");
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const fromAddress = process.env.SMTP_FROM || `"Savo Eats" <${smtpUser}>`;

  // If password is not configured yet, record safely as simulated send
  if (!smtpPass) {
    console.log(`[Hades Mailer - Simulation Mode] Email prepared for ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Body:\n${payload.body}`);
    return {
      success: true,
      simulated: true,
      messageId: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to: payload.to,
      replyTo: smtpUser,
      subject: payload.subject,
      text: payload.body,
      attachments: payload.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        encoding: (att.encoding || "base64") as "base64",
        contentType: att.contentType,
      })),
    });

    return {
      success: true,
      simulated: false,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Hades Mailer Error]", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
