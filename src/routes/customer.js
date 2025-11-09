const { Router } = require('express')
const {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController')
const asyncHandler = require('../utils/asyncHandler')
const requireUser = require('../middleware/requireUser')

const router = Router()

router.use(requireUser)

router.get('/', asyncHandler(listCustomers))
router.post('/', asyncHandler(createCustomer))
router.patch('/:customerId', asyncHandler(updateCustomer))
router.delete('/:customerId', asyncHandler(deleteCustomer))

module.exports = router

