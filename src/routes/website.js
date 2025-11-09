const { Router } = require('express')
const {
  getWebsiteConfig,
  updateWebsiteConfig,
} = require('../controllers/websiteController')
const asyncHandler = require('../utils/asyncHandler')
const requireUser = require('../middleware/requireUser')

const router = Router()

router.use(requireUser)

router.get('/', asyncHandler(getWebsiteConfig))
router.patch('/', asyncHandler(updateWebsiteConfig))

module.exports = router

