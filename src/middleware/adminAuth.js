const adminAuth = (req, res, next) => {
  const adminKey = process.env.ADMIN_API_KEY

  if (!adminKey) {
    return next()
  }

  const provided = req.header('x-admin-key')

  if (!provided || provided !== adminKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized admin access.',
    })
  }

  return next()
}

module.exports = adminAuth
