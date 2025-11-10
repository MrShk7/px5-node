const { Router } = require('express')
const { getDashboardOverview, getUsersDirectory, getOperationsOverview } = require('../controllers/adminController')
const asyncHandler = require('../utils/asyncHandler')
const adminAuth = require('../middleware/adminAuth')

const router = Router()

router.use(adminAuth)

router.get('/dashboard', asyncHandler(getDashboardOverview))
router.get('/users', asyncHandler(getUsersDirectory))
router.get('/operations', asyncHandler(getOperationsOverview))

module.exports = router
