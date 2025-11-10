const { Router } = require('express')

const healthRouter = require('./health')
const authRouter = require('./auth')
const onboardingRouter = require('./onboarding')
const serviceRouter = require('./service')
const customerRouter = require('./customer')
const bookingRouter = require('./booking')
const websiteRouter = require('./website')
const publicRouter = require('./public')
const portfolioRouter = require('./portfolio')
const dashboardRouter = require('./dashboard')
const profileRouter = require('./profile')
const adminRouter = require('./admin')

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    message: 'StudioFlow API',
    version: '1.0.0',
  })
})

router.use('/health', healthRouter)
router.use('/auth', authRouter)
router.use('/onboarding', onboardingRouter)
router.use('/services', serviceRouter)
router.use('/customers', customerRouter)
router.use('/bookings', bookingRouter)
router.use('/website', websiteRouter)
router.use('/public', publicRouter)
router.use('/portfolio', portfolioRouter)
router.use('/dashboard', dashboardRouter)
router.use('/profile', profileRouter)
router.use('/admin', adminRouter)

module.exports = router

