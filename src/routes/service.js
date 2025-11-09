const { Router } = require('express')
const {
  getService,
  listServices,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
} = require('../controllers/serviceController')
const asyncHandler = require('../utils/asyncHandler')
const requireUser = require('../middleware/requireUser')

const router = Router()

router.use(requireUser)

router.get('/', asyncHandler(listServices))
router.get('/:serviceId', asyncHandler(getService))
router.post('/', asyncHandler(createService))
router.patch('/:serviceId', asyncHandler(updateService))
router.delete('/:serviceId', asyncHandler(deleteService))
router.post('/:serviceId/toggle', asyncHandler(toggleServiceStatus))

module.exports = router

