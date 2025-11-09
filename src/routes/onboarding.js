const { Router } = require('express')
const { submitProfile } = require('../controllers/onboardingController')
const asyncHandler = require('../utils/asyncHandler')

const router = Router()

router.post('/profile', asyncHandler(submitProfile))

module.exports = router

