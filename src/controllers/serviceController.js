const Service = require('../models/Service')

const sanitize = (value) =>
  typeof value === 'string' ? value.trim() : value ?? undefined

const parseDate = (value) => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const transformService = (service) => ({
  id: service._id.toString(),
  title: service.title,
  category: service.category,
  price: service.price,
  startDate: service.startDate,
  endDate: service.endDate,
  address: service.address,
  location: service.location,
  paymentLink: service.paymentLink,
  description: service.description,
  photos: service.photos,
  isActive: service.isActive,
  rating: service.rating,
  createdAt: service.createdAt,
  updatedAt: service.updatedAt,
})

const getService = async (req, res) => {
  const { serviceId } = req.params

  const service = await Service.findOne({
    _id: serviceId,
    owner: req.user._id,
  }).lean()

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found.',
    })
  }

  return res.json({
    success: true,
    data: transformService(service),
  })
}

const listServices = async (req, res) => {
  const { page = 1, limit = 15, view = 'table', search = '' } = req.query

  const numericLimit = Math.min(Number(limit) || 15, 50)
  const numericPage = Math.max(Number(page) || 1, 1)

  const filter = { owner: req.user._id }

  if (search) {
    filter.title = { $regex: search, $options: 'i' }
  }

  const [items, total] = await Promise.all([
    Service.find(filter)
      .sort({ createdAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .lean(),
    Service.countDocuments(filter),
  ])

  return res.json({
    success: true,
    data: items.map(transformService),
    meta: {
      page: numericPage,
      limit: numericLimit,
      total,
      view,
    },
  })
}

const createService = async (req, res) => {
  const payload = req.body

  const service = await Service.create({
    owner: req.user._id,
    title: sanitize(payload.title),
    category: sanitize(payload.category),
    price: {
      amount: Number(payload.price?.amount ?? payload.price) || 0,
      currency: sanitize(payload.price?.currency) || 'USD',
    },
    startDate: parseDate(payload.startDate),
    endDate: parseDate(payload.endDate),
    address: sanitize(payload.address),
    location: {
      city: sanitize(payload.location?.city) || sanitize(payload.city),
      country: sanitize(payload.location?.country) || sanitize(payload.country),
    },
    paymentLink: sanitize(payload.paymentLink),
    description: sanitize(payload.description),
    photos: Array.isArray(payload.photos)
      ? payload.photos
          .filter((photo) => photo?.url)
          .map((photo) => ({
            url: sanitize(photo.url),
            alt: sanitize(photo.alt),
          }))
      : [],
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
    rating: Number(payload.rating) || 4.5,
  })

  return res.status(201).json({
    success: true,
    data: transformService(service.toObject()),
    message: 'Service created successfully.',
  })
}

const updateService = async (req, res) => {
  const { serviceId } = req.params
  const payload = req.body

  const service = await Service.findOne({
    _id: serviceId,
    owner: req.user._id,
  })

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found.',
    })
  }

  service.title = sanitize(payload.title) ?? service.title
  service.category = sanitize(payload.category) ?? service.category
  service.price = {
    amount:
      Number(payload.price?.amount ?? payload.price?.value ?? service.price.amount) ||
      service.price.amount,
    currency:
      sanitize(payload.price?.currency) || service.price.currency || 'USD',
  }
  service.startDate = parseDate(payload.startDate) ?? service.startDate
  service.endDate = parseDate(payload.endDate) ?? service.endDate
  service.address = sanitize(payload.address) ?? service.address
  service.location = {
    city: sanitize(payload.location?.city) || sanitize(payload.city) || service.location?.city,
    country:
      sanitize(payload.location?.country) ||
      sanitize(payload.country) ||
      service.location?.country,
  }
  service.paymentLink = sanitize(payload.paymentLink) ?? service.paymentLink
  service.description = sanitize(payload.description) ?? service.description

  if (Array.isArray(payload.photos)) {
    service.photos = payload.photos
      .filter((photo) => photo?.url)
      .map((photo) => ({
        url: sanitize(photo.url),
        alt: sanitize(photo.alt),
      }))
  }

  if (payload.isActive !== undefined) {
    service.isActive = Boolean(payload.isActive)
  }

  if (payload.rating !== undefined) {
    service.rating = Math.min(Math.max(Number(payload.rating), 0), 5)
  }

  await service.save()

  return res.json({
    success: true,
    message: 'Service updated successfully.',
    data: transformService(service.toObject()),
  })
}

const deleteService = async (req, res) => {
  const { serviceId } = req.params

  const result = await Service.findOneAndDelete({
    _id: serviceId,
    owner: req.user._id,
  })

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Service not found.',
    })
  }

  return res.json({
    success: true,
    message: 'Service deleted successfully.',
  })
}

const toggleServiceStatus = async (req, res) => {
  const { serviceId } = req.params
  const { isActive } = req.body

  const service = await Service.findOne({
    _id: serviceId,
    owner: req.user._id,
  })

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found.',
    })
  }

  service.isActive =
    isActive !== undefined ? Boolean(isActive) : !Boolean(service.isActive)
  await service.save()

  return res.json({
    success: true,
    message: 'Service status updated.',
    data: transformService(service.toObject()),
  })
}

module.exports = {
  getService,
  listServices,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
}

