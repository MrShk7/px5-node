const { Router } = require('express')
const { getProfile, updateProfile } = require('../controllers/profileController')
const asyncHandler = require('../utils/asyncHandler')
const requireUser = require('../middleware/requireUser')

const router = Router()

router.use(requireUser)
router.get('/', asyncHandler(getProfile))
router.patch('/', asyncHandler(updateProfile))

module.exports = router
