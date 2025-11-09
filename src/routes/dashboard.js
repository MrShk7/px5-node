const { Router } = require('express')
const { getDashboardSummary } = require('../controllers/dashboardController')
const asyncHandler = require('../utils/asyncHandler')
const requireUser = require('../middleware/requireUser')

const router = Router()

router.use(requireUser)
router.get('/summary', asyncHandler(getDashboardSummary))

module.exports = router
