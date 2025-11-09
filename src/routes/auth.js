const { Router } = require('express')
const { requestOtp, verifyOtp } = require('../controllers/authController')
const asyncHandler = require('../utils/asyncHandler')

const router = Router()

router.post('/request-otp', asyncHandler(requestOtp))
router.post('/verify-otp', asyncHandler(verifyOtp))

module.exports = router

