const User = require('../models/User')

const normalizeEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : ''

const requireUser = async (req, res, next) => {
  const emailHeader = req.header('x-user-email')

  if (!emailHeader) {
    return res.status(401).json({
      success: false,
      message: 'Missing x-user-email header.',
    })
  }

  const normalizedEmail = normalizeEmail(emailHeader)

  const user = await User.findOne({ email: normalizedEmail })

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found or not verified.',
    })
  }

  req.user = user
  next()
}

module.exports = requireUser

