const Booking = require('../models/Booking')
const Customer = require('../models/Customer')
const Service = require('../models/Service')

const sanitize = (value) =>
  typeof value === 'string' ? value.trim() : value ?? undefined

const parseDate = (value) => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const transformBooking = (booking) => ({
  id: booking._id.toString(),
  serviceName: booking.serviceName,
  customerName: booking.customerName,
  customerEmail: booking.customerEmail,
  scheduledDate: booking.scheduledDate,
  startTime: booking.startTime,
  endTime: booking.endTime,
  status: booking.status,
  notes: booking.notes,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
})

const listBookings = async (req, res) => {
  const { page = 1, limit = 15, search = '', status } = req.query

  const numericLimit = Math.min(Number(limit) || 15, 50)
  const numericPage = Math.max(Number(page) || 1, 1)

  const filter = { owner: req.user._id }

  if (search) {
    filter.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { serviceName: { $regex: search, $options: 'i' } },
    ]
  }

  if (status) {
    filter.status = status
  }

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ scheduledDate: -1, createdAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .lean(),
    Booking.countDocuments(filter),
  ])

  return res.json({
    success: true,
    data: items.map(transformBooking),
    meta: {
      page: numericPage,
      limit: numericLimit,
      total,
    },
  })
}

const createBooking = async (req, res) => {
  const payload = req.body

  const customer = await Customer.findOne({
    _id: payload.customerId,
    owner: req.user._id,
  })

  if (!customer) {
    return res.status(400).json({
      success: false,
      message: 'Customer not found for this booking.',
    })
  }

  let service
  if (payload.serviceId) {
    service = await Service.findOne({
      _id: payload.serviceId,
      owner: req.user._id,
    })
  }

  const booking = await Booking.create({
    owner: req.user._id,
    customer: customer._id,
    service: service?._id,
    serviceName: sanitize(payload.serviceName) || service?.title,
    customerName: customer.name,
    customerEmail: customer.email,
    scheduledDate: parseDate(payload.scheduledDate) || new Date(),
    startTime: sanitize(payload.startTime),
    endTime: sanitize(payload.endTime),
    status: sanitize(payload.status) || 'pending',
    notes: sanitize(payload.notes),
  })

  customer.totalBookings = (customer.totalBookings || 0) + 1
  customer.lastBookingAt = booking.scheduledDate
  await customer.save()

  return res.status(201).json({
    success: true,
    message: 'Booking created successfully.',
    data: transformBooking(booking.toObject()),
  })
}

const updateBooking = async (req, res) => {
  const { bookingId } = req.params
  const payload = req.body

  const booking = await Booking.findOne({
    _id: bookingId,
    owner: req.user._id,
  })

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found.',
    })
  }

  booking.serviceName = sanitize(payload.serviceName) ?? booking.serviceName
  booking.customerName = sanitize(payload.customerName) ?? booking.customerName
  booking.customerEmail = sanitize(payload.customerEmail) ?? booking.customerEmail
  booking.scheduledDate = parseDate(payload.scheduledDate) ?? booking.scheduledDate
  booking.startTime = sanitize(payload.startTime) ?? booking.startTime
  booking.endTime = sanitize(payload.endTime) ?? booking.endTime
  booking.status = sanitize(payload.status) ?? booking.status
  booking.notes = sanitize(payload.notes) ?? booking.notes

  await booking.save()

  return res.json({
    success: true,
    message: 'Booking updated successfully.',
    data: transformBooking(booking.toObject()),
  })
}

const deleteBooking = async (req, res) => {
  const { bookingId } = req.params

  const booking = await Booking.findOneAndDelete({
    _id: bookingId,
    owner: req.user._id,
  })

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found.',
    })
  }

  return res.json({
    success: true,
    message: 'Booking deleted successfully.',
  })
}

module.exports = {
  listBookings,
  createBooking,
  updateBooking,
  deleteBooking,
}

