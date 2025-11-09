/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, _next) => {
  const status = err.statusCode || 500
  const message =
    err.message || 'Something went wrong. Please try again later.'

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[errorHandler]', err)
  }

  res.status(status).json({
    success: false,
    message,
  })
}

module.exports = errorHandler

