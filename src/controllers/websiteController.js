const { Types } = require('mongoose')
const Website = require('../models/Website')
const Service = require('../models/Service')
const User = require('../models/User')
const Customer = require('../models/Customer')
const Booking = require('../models/Booking')
const slugify = require('../utils/slugify')

const sanitizeString = (value) =>
  typeof value === 'string' ? value.trim() : undefined

const ensureWebsite = async (ownerId) => {
  let website = await Website.findOne({ owner: ownerId })
  if (!website) {
    website = await Website.create({ owner: ownerId })
  }
  return website
}

const normalizeHandle = (handle) => slugify(handle || '')

const getWebsiteConfig = async (req, res) => {
  const website = await ensureWebsite(req.user._id)
  const services = await Service.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean()

  res.json({
    success: true,
    data: {
      website,
      services,
      portfolio: req.user.portfolio || [],
      handle: req.user.handle,
    },
  })
}

const updateWebsiteConfig = async (req, res) => {
  const payload = req.body || {}

  const update = {}

  if (payload.hero) {
    update['hero.title'] = sanitizeString(payload.hero.title)
    update['hero.subtitle'] = sanitizeString(payload.hero.subtitle)
    update['hero.description'] = sanitizeString(payload.hero.description)
    update['hero.buttonLabel'] = sanitizeString(payload.hero.buttonLabel)
    update['hero.image'] = sanitizeString(payload.hero.image)
  }

  if (payload.brandStrip) {
    update['brandStrip.enabled'] =
      typeof payload.brandStrip.enabled === 'boolean'
        ? payload.brandStrip.enabled
        : undefined
    update['brandStrip.items'] = Array.isArray(payload.brandStrip.items)
      ? payload.brandStrip.items
          .map((item) => sanitizeString(item))
          .filter(Boolean)
          .slice(0, 8)
      : undefined
  }

  if (payload.servicesSection) {
    update['servicesSection.title'] = sanitizeString(
      payload.servicesSection.title,
    )
    update['servicesSection.subtitle'] = sanitizeString(
      payload.servicesSection.subtitle,
    )
  }

  if (payload.portfolioSection) {
    update['portfolioSection.title'] = sanitizeString(
      payload.portfolioSection.title,
    )
    update['portfolioSection.subtitle'] = sanitizeString(
      payload.portfolioSection.subtitle,
    )
  }

  if (payload.testimonialsSection) {
    update['testimonialsSection.title'] = sanitizeString(
      payload.testimonialsSection.title,
    )
    update['testimonialsSection.subtitle'] = sanitizeString(
      payload.testimonialsSection.subtitle,
    )
  }

  if (Array.isArray(payload.testimonials)) {
    update.testimonials = payload.testimonials
      .map((item) => ({
        quote: sanitizeString(item.quote),
        author: sanitizeString(item.author),
        role: sanitizeString(item.role),
      }))
      .filter((item) => item.quote)
      .slice(0, 6)
  }

  if (payload.contactSection) {
    update['contactSection.email'] = sanitizeString(
      payload.contactSection.email,
    )
    update['contactSection.phone'] = sanitizeString(
      payload.contactSection.phone,
    )
    update['contactSection.address'] = sanitizeString(
      payload.contactSection.address,
    )
    update['contactSection.note'] = sanitizeString(payload.contactSection.note)
  }

  if (payload.theme) {
    update['theme.primary'] = sanitizeString(payload.theme.primary)
    update['theme.accent'] = sanitizeString(payload.theme.accent)
    update['theme.background'] = sanitizeString(payload.theme.background)
    update['theme.surface'] = sanitizeString(payload.theme.surface)
  }

  if (payload.seo) {
    update['seo.headline'] = sanitizeString(payload.seo.headline)
    update['seo.description'] = sanitizeString(payload.seo.description)
  }

  Object.keys(update).forEach((key) => {
    if (update[key] === undefined) {
      delete update[key]
    }
  })

  const handleInput = sanitizeString(payload.handle)
  const normalizedHandle = handleInput
    ? normalizeHandle(handleInput)
    : undefined

  if (normalizedHandle) {
    try {
      await User.updateOne(
        { _id: req.user._id },
        { $set: { handle: normalizedHandle } },
      )
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.handle) {
        return res.status(400).json({
          success: false,
          message:
            'This website handle is already taken. Please choose another one.',
        })
      }
      throw error
    }
  }

  const website = await Website.findOneAndUpdate(
    { owner: req.user._id },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )

  res.json({
    success: true,
    message: 'Website updated successfully.',
    data: {
      website,
      handle: normalizedHandle || req.user.handle,
    },
  })
}

const getPublicWebsite = async (req, res) => {
  const handle = normalizeHandle(req.params.handle)

  if (!handle) {
    return res.status(400).json({
      success: false,
      message: 'Website handle is required.',
    })
  }

  const user = await User.findOne({ handle }).lean()

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Website not found.',
    })
  }

  const website = await ensureWebsite(user._id)

  const services = await Service.find({ owner: user._id, isActive: true })
    .sort({ createdAt: -1 })
    .limit(9)
    .lean()

  res.json({
    success: true,
    data: {
      website,
      services,
      portfolio: user.portfolio || [],
      user: {
        handle: user.handle,
        accountType: user.accountType,
        profession: user.profession,
        individualProfile: user.individualProfile,
        studioProfile: user.studioProfile,
        contact: website.contactSection,
      },
    },
  })
}

const createPublicBooking = async (req, res) => {
  const handle = normalizeHandle(req.params.handle)
  const payload = req.body || {}

  const name = sanitizeString(payload.name)
  const email = sanitizeString(payload.email)
  const phone = sanitizeString(payload.phone)
  const serviceId = sanitizeString(payload.serviceId)
  const requestedServiceName = sanitizeString(payload.serviceName)
  const date = sanitizeString(payload.date)
  const startTime = sanitizeString(payload.startTime)
  const endTime = sanitizeString(payload.endTime)
  const notes = sanitizeString(payload.notes)

  if (!handle || !name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and website handle are required.',
    })
  }

  const user = await User.findOne({ handle }).lean()

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Website not found.',
    })
  }

  let customer = await Customer.findOne({
    owner: user._id,
    email: email.toLowerCase(),
  })

  if (!customer) {
    customer = await Customer.create({
      owner: user._id,
      name,
      email: email.toLowerCase(),
      phone,
      totalBookings: 0,
    })
  } else {
    customer.name = name
    customer.phone = phone
  }

  let service = null
  if (serviceId && Types.ObjectId.isValid(serviceId)) {
    service = await Service.findOne({
      _id: serviceId,
      owner: user._id,
    })
  }

  const parsedDate = date ? new Date(date) : null
  const scheduledDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate
      : new Date()

  const booking = await Booking.create({
    owner: user._id,
    customer: customer._id,
    service: service?._id,
    serviceName: service?.title || requestedServiceName || 'Custom Service',
    customerName: name,
    customerEmail: email.toLowerCase(),
    scheduledDate,
    startTime: startTime || '',
    endTime: endTime || '',
    status: 'pending',
    notes,
  })

  customer.totalBookings = (customer.totalBookings || 0) + 1
  customer.lastBookingAt = scheduledDate
  await customer.save()

  res.status(201).json({
    success: true,
    message: 'Booking request submitted successfully.',
    data: {
      bookingId: booking._id,
    },
  })
}

module.exports = {
  getWebsiteConfig,
  updateWebsiteConfig,
  getPublicWebsite,
  createPublicBooking,
}

