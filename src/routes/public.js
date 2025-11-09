const { Router } = require('express')
const {
  getPublicWebsite,
  createPublicBooking,
} = require('../controllers/websiteController')
const asyncHandler = require('../utils/asyncHandler')

const router = Router()

router.get('/website/:handle', asyncHandler(getPublicWebsite))
router.post('/website/:handle/bookings', asyncHandler(createPublicBooking))

module.exports = router

