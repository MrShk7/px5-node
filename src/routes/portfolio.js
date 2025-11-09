const { Router } = require('express')
const {
  listPortfolio,
  replacePortfolio,
  addPortfolioItems,
  deletePortfolioItem,
} = require('../controllers/portfolioController')
const asyncHandler = require('../utils/asyncHandler')
const requireUser = require('../middleware/requireUser')

const router = Router()

router.use(requireUser)

router.get('/', asyncHandler(listPortfolio))
router.put('/', asyncHandler(replacePortfolio))
router.post('/', asyncHandler(addPortfolioItems))
router.delete('/:index', asyncHandler(deletePortfolioItem))

module.exports = router
