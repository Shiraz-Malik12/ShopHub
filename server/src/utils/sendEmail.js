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

  // Dev convenience: until real SMTP credentials are added to server/.env,
  // log the code instead of failing the whole request. Lets you test
  // register -> DB -> OTP hashing/expiry -> verify end-to-end before
  // Gmail is wired up. Never falls back like this if SMTP_USER is set.
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[email:dev-fallback] OTP for ${to} (${purpose}) is ${code} (SMTP not configured — not actually sent)`)
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

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text: `${lead} ${code}. It expires in 10 minutes.`,
    html,
  })
}
