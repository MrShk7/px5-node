const User = require('../models/User')

const sanitizeString = (value) =>
  typeof value === 'string' ? value.trim() : undefined

const MAX_ITEMS = 20

const mapItem = (item) => ({
  url: sanitizeString(item.url),
  alt: sanitizeString(item.alt),
})

const listPortfolio = async (req, res) => {
  const portfolio = req.user.portfolio || []
  res.json({
    success: true,
    data: portfolio.map((item, index) => ({
      id: index,
      ...item,
    })),
  })
}

const replacePortfolio = async (req, res) => {
  const items = Array.isArray(req.body)
    ? req.body
        .map(mapItem)
        .filter((item) => item.url)
        .slice(0, MAX_ITEMS)
    : []

  req.user.portfolio = items
  await req.user.save()

  res.json({
    success: true,
    message: 'Portfolio updated successfully.',
    data: req.user.portfolio,
  })
}

const addPortfolioItems = async (req, res) => {
  const items = Array.isArray(req.body)
    ? req.body.map(mapItem).filter((item) => item.url)
    : []

  const merged = [...(req.user.portfolio || []), ...items].slice(0, MAX_ITEMS)
  req.user.portfolio = merged
  await req.user.save()

  res.status(201).json({
    success: true,
    message: 'Portfolio items added successfully.',
    data: req.user.portfolio,
  })
}

const deletePortfolioItem = async (req, res) => {
  const { index } = req.params
  const current = [...(req.user.portfolio || [])]
  const idx = Number(index)

  if (Number.isNaN(idx) || idx < 0 || idx >= current.length) {
    return res.status(404).json({
      success: false,
      message: 'Portfolio item not found.',
    })
  }

  current.splice(idx, 1)
  req.user.portfolio = current
  await req.user.save()

  res.json({
    success: true,
    message: 'Portfolio item removed.',
    data: req.user.portfolio,
  })
}

module.exports = {
  listPortfolio,
  replacePortfolio,
  addPortfolioItems,
  deletePortfolioItem,
}
