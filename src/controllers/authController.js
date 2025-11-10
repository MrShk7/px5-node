const crypto = require('crypto')
const { OAuth2Client } = require('google-auth-library')
const slugify = require('../utils/slugify')
const OtpToken = require('../models/OtpToken')
const User = require('../models/User')
const { sendOtpEmail } = require('../services/emailService')

const OTP_TTL_MS = 2 * 60 * 1000
const MAX_OTP_ATTEMPTS = 5

const normalizeEmail = (email) => email.trim().toLowerCase()

const hashOtp = (email, otp) => {
  return crypto.createHash('sha256').update(`${email}:${otp}`).digest('hex')
}

const generateOtpCode = () => crypto.randomInt(0, 999999).toString().padStart(6, '0')

const shapeUser = (userDoc) => {
  if (!userDoc) return null
  return {
    email: userDoc.email,
    accountType: userDoc.accountType,
    emailVerifiedAt: userDoc.emailVerifiedAt,
    handle: userDoc.handle,
    profession: userDoc.profession,
    individualProfile: userDoc.individualProfile,
    studioProfile: userDoc.studioProfile,
    socialLinks: userDoc.socialLinks,
    portfolio: userDoc.portfolio,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  }
}

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null

const requestOtp = async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required to request an OTP.',
    })
  }

  const normalizedEmail = normalizeEmail(email)
  const otp = generateOtpCode()
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  await User.findOneAndUpdate(
    { email: normalizedEmail },
    { $setOnInsert: { email: normalizedEmail } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )

  await OtpToken.deleteMany({ email: normalizedEmail })
  await OtpToken.create({
    email: normalizedEmail,
    codeHash: hashOtp(normalizedEmail, otp),
    expiresAt,
  })

  const isProduction = process.env.NODE_ENV === 'production'

  const user = await User.findOne({ email: normalizedEmail }).lean()

  try {
    // await sendOtpEmail({ to: normalizedEmail, otp })
  } catch (error) {
    console.error('Failed to send OTP email:', error.message)
  }

  return res.json({
    success: true,
    message: 'OTP generated successfully.',
    expiresAt,
    otp: isProduction ? undefined : otp,
    user: shapeUser(user),
  })
}

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required.',
    })
  }

  const normalizedEmail = normalizeEmail(email)
  const token = await OtpToken.findOne({ email: normalizedEmail })

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'No OTP request found for this email.',
    })
  }

  if (token.expiresAt.getTime() < Date.now()) {
    await OtpToken.deleteMany({ email: normalizedEmail })
    return res.status(400).json({
      success: false,
      message: 'OTP expired. Please request a new one.',
    })
  }

  if (token.attemptCount >= MAX_OTP_ATTEMPTS) {
    await OtpToken.deleteMany({ email: normalizedEmail })
    return res.status(400).json({
      success: false,
      message: 'Too many incorrect attempts. Please request a new OTP.',
    })
  }

  const storedBuffer = Buffer.from(token.codeHash, 'hex')
  const providedBuffer = Buffer.from(hashOtp(normalizedEmail, otp), 'hex')

  if (storedBuffer.length !== providedBuffer.length) {
    await OtpToken.updateOne(
      { _id: token._id },
      { $inc: { attemptCount: 1 } },
    )
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP. Please try again.',
    })
  }

  const isMatch = crypto.timingSafeEqual(storedBuffer, providedBuffer)

  if (!isMatch) {
    await OtpToken.updateOne(
      { _id: token._id },
      { $inc: { attemptCount: 1 } },
    )
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP. Please try again.',
    })
  }

  const [updatedUser] = await Promise.all([
    User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          emailVerifiedAt: new Date(),
        },
      },
      { new: true, setDefaultsOnInsert: true, upsert: true },
    ),
    OtpToken.deleteMany({ email: normalizedEmail }),
  ])

  return res.json({
    success: true,
    message: 'OTP verified successfully.',
    user: shapeUser(updatedUser),
  })
}

const socialLogin = async (req, res) => {
  if (!googleClient) {
    return res.status(500).json({
      success: false,
      message: 'Google login is not configured on the server.',
    })
  }

  const { token } = req.body

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required for social login.',
    })
  }

  let ticket
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid Google token.',
    })
  }

  const payload = ticket.getPayload() || {}
  const email = payload.email
  const emailVerified = payload.email_verified
  const name = payload.name

  if (!email || !emailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Google account email is not verified.',
    })
  }

  const normalizedEmail = normalizeEmail(email)

  let user = await User.findOne({ email: normalizedEmail })

  if (!user) {
    user = new User({
      email: normalizedEmail,
      accountType: 'freelancer',
      profession: name
        ? {
            userName: name,
          }
        : undefined,
      individualProfile: name
        ? {
            displayName: name,
          }
        : undefined,
    })
  }

  user.email = normalizedEmail
  user.emailVerifiedAt = new Date()

  if (!user.accountType) {
    user.accountType = 'freelancer'
  }

  if (name) {
    user.profession = user.profession || {}
    if (!user.profession.userName) {
      user.profession.userName = name
    }

    if (user.accountType === 'studio') {
      user.studioProfile = user.studioProfile || {}
      if (!user.studioProfile.studioName) {
        user.studioProfile.studioName = name
      }
    } else {
      user.individualProfile = user.individualProfile || {}
      if (!user.individualProfile.displayName) {
        user.individualProfile.displayName = name
      }
    }
  }

  await user.save()

  return res.json({
    success: true,
    message: 'Login successful.',
    user: shapeUser(user),
  })
}

const checkHandle = async (req, res) => {
  const { handle, email } = req.body || {}

  if (!handle) {
    return res.status(400).json({
      success: false,
      message: 'Handle is required.',
    })
  }

  const slug = slugify(handle)

  if (!slug) {
    return res.status(400).json({
      success: false,
      message: 'Handle must contain alphanumeric characters.',
    })
  }

  const normalizedEmail = email ? normalizeEmail(email) : null
  const existing = await User.findOne({ handle: slug }).select('email').lean()

  const available = !existing || (normalizedEmail && existing.email === normalizedEmail)

  return res.json({
    success: true,
    data: {
      handle: slug,
      available,
    },
  })
}

module.exports = {
  requestOtp,
  verifyOtp,
  socialLogin,
  checkHandle,
}

