const { Router } = require('express')
const { requestOtp, verifyOtp, socialLogin, checkHandle } = require('../controllers/authController')
const asyncHandler = require('../utils/asyncHandler')

const router = Router()

router.post('/request-otp', asyncHandler(requestOtp))
router.post('/verify-otp', asyncHandler(verifyOtp))
router.post('/social-login', asyncHandler(socialLogin))
router.post('/check-handle', asyncHandler(checkHandle))

module.exports = router

