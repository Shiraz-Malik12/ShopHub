import nodemailer from 'nodemailer'

let transporter

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

// Which way emails go out:
//   'brevo' — Brevo's HTTPS email API (BREVO_API_KEY set). Used in production:
//             free hosts like Render block the SMTP ports, but not HTTPS.
//   'smtp'  — Gmail (or any) SMTP (SMTP_USER + SMTP_PASS set). Works locally.
//   null    — nothing set: dev fallback, emails are printed to the console.
export function emailProvider(env = process.env) {
  if (env.BREVO_API_KEY) return 'brevo'
  if (env.SMTP_USER && env.SMTP_PASS) return 'smtp'
  return null
}

// "ShopHub <shop@gmail.com>" → { name: 'ShopHub', email: 'shop@gmail.com' }
function parseFrom(from = '') {
  const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  return match ? { name: match[1] || undefined, email: match[2] } : { email: from.trim() }
}

async function sendWithBrevo({ to, subject, text, html }) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: parseFrom(process.env.EMAIL_FROM),
      to: [{ email: to }],
      subject,
      textContent: text,
      ...(html ? { htmlContent: html } : {}),
    }),
    signal: AbortSignal.timeout(10_000), // never hang a request on a slow email API
  })
  if (!response.ok) {
    // Brevo explains the problem (bad key, sender not verified...) in the body.
    const detail = await response.text().catch(() => '')
    throw new Error(`Brevo email failed (${response.status}): ${detail.slice(0, 200)}`)
  }
}

// Sends one email the configured way. Callers never need to know which.
async function deliver(mail) {
  const provider = emailProvider()
  if (provider === 'brevo') return sendWithBrevo(mail)
  if (provider === 'smtp') return getTransporter().sendMail({ from: process.env.EMAIL_FROM, ...mail })
  console.warn(`[email:dev-fallback] To: ${mail.to} | Subject: ${mail.subject} (email not configured — not actually sent)\n${mail.text}\n`)
}

// General-purpose email (order confirmations, status updates...).
export async function sendEmail({ to, subject, text, html }) {
  await deliver({ to, subject, text, html })
}

const COPY = {
  'verify-email': {
    subject: 'Your ShopHub verification code',
    lead: 'Your verification code is:',
  },
  'reset-password': {
    subject: 'Your ShopHub password reset code',
    lead: 'Use this code to reset your password:',
  },
}

export async function sendOtpEmail(to, code, purpose = 'verify-email') {
  const { subject, lead } = COPY[purpose]

  // Dev convenience: until an email provider is set in server/.env, log the
  // code instead of failing the whole request. Lets you test
  // register -> DB -> OTP hashing/expiry -> verify end-to-end before
  // email is wired up. Never falls back like this once a provider is set.
  if (!emailProvider()) {
    console.warn(`[email:dev-fallback] OTP for ${to} (${purpose}) is ${code} (email not configured — not actually sent)`)
    return
  }

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#4f46e5; margin-bottom: 4px;">ShopHub</h2>
      <p style="color:#374151;">${lead}</p>
      <p style="font-size:32px; font-weight:700; letter-spacing:8px; color:#111827;">${code}</p>
      <p style="color:#6b7280; font-size:14px;">
        This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `

  await deliver({
    to,
    subject,
    text: `${lead} ${code}. It expires in 10 minutes.`,
    html,
  })
}
