type Email = {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
};

// Gmail SMTP needs raw TCP, which only Node has; the Worker always uses Resend.
const isWorker = () =>
  typeof navigator !== "undefined" &&
  navigator.userAgent === "Cloudflare-Workers";
const gmailReady = () =>
  !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD && !isWorker();
const resendReady = () =>
  !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

/** Whether any mail service is configured (email codes depend on it). */
export const emailConfigured = () => gmailReady() || resendReady();

async function sendWithGmail(message: Email) {
  const mod = "nodemailer";
  const nodemailer = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ mod
  )) as typeof import("nodemailer");
  const user = process.env.GMAIL_USER!;
  await nodemailer
    .createTransport({
      service: "gmail",
      auth: { user, pass: process.env.GMAIL_APP_PASSWORD },
    })
    .sendMail({
      // Gmail rewrites any other sender address to the account itself.
      from: `"Refolks" <${user}>`,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
}

export async function sendTransactionalEmail(message: Email): Promise<boolean> {
  if (gmailReady()) {
    await sendWithGmail(message);
    return true;
  }
  if (!resendReady()) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": message.idempotencyKey,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      text: message.text,
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error(`EMAIL_SEND_${response.status}`);
  return true;
}
