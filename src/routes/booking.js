const { Router } = require('express')
const {
  listBookings,
  createBooking,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController')
const asyncHandler = require('../utils/asyncHandler')
const requireUser = require('../middleware/requireUser')

const router = Router()

router.use(requireUser)

router.get('/', asyncHandler(listBookings))
router.post('/', asyncHandler(createBooking))
router.patch('/:bookingId', asyncHandler(updateBooking))
router.delete('/:bookingId', asyncHandler(deleteBooking))

module.exports = router

