const nodemailer = require('nodemailer')

let transporter = null

const {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USER,
  MAIL_PASS,
  MAIL_FROM,
} = process.env

if (MAIL_HOST) {
  transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: Number(MAIL_PORT) || 587,
    secure: MAIL_SECURE === 'true',
    auth:
      MAIL_USER && MAIL_PASS
        ? {
            user: MAIL_USER,
            pass: MAIL_PASS,
          }
        : undefined,
  })
}

const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.warn('[emailService] Mail transport not configured. Logging email instead.')
    console.warn(`[emailService] To: ${to}`)
    console.warn(`[emailService] Subject: ${subject}`)
    console.warn(`[emailService] Text: ${text}`)
    return
  }

  await transporter.sendMail({
    from: MAIL_FROM || MAIL_USER,
    to,
    subject,
    text,
    html,
  })
}

const sendOtpEmail = async ({ to, otp }) => {
  const subject = 'Your Pixlfy verification code'
  const text = `Your Pixlfy verification code is ${otp}. It will expire in 2 minutes.`
  const html = `
    <div style="font-family: sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color: #4c1d95;">Your Pixlfy verification code</h2>
      <p>Use the following one-time password to verify your email address:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
      <p>This code will expire in 2 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `

  await sendMail({ to, subject, text, html })
}

module.exports = {
  sendMail,
  sendOtpEmail,
}
