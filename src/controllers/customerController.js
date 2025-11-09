const Customer = require('../models/Customer')

const sanitize = (value) =>
  typeof value === 'string' ? value.trim() : value ?? undefined

const transformCustomer = (customer) => ({
  id: customer._id.toString(),
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  totalBookings: customer.totalBookings,
  notes: customer.notes,
  lastBookingAt: customer.lastBookingAt,
  createdAt: customer.createdAt,
  updatedAt: customer.updatedAt,
})

const listCustomers = async (req, res) => {
  const { page = 1, limit = 15, search = '' } = req.query

  const numericLimit = Math.min(Number(limit) || 15, 50)
  const numericPage = Math.max(Number(page) || 1, 1)

  const filter = { owner: req.user._id }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .sort({ updatedAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .lean(),
    Customer.countDocuments(filter),
  ])

  return res.json({
    success: true,
    data: items.map(transformCustomer),
    meta: {
      page: numericPage,
      limit: numericLimit,
      total,
    },
  })
}

const createCustomer = async (req, res) => {
  const payload = req.body

  const customer = await Customer.create({
    owner: req.user._id,
    name: sanitize(payload.name),
    email: sanitize(payload.email),
    phone: sanitize(payload.phone),
    totalBookings: Number(payload.totalBookings) || 0,
    notes: sanitize(payload.notes),
    lastBookingAt: payload.lastBookingAt ? new Date(payload.lastBookingAt) : undefined,
  })

  return res.status(201).json({
    success: true,
    message: 'Customer created successfully.',
    data: transformCustomer(customer.toObject()),
  })
}

const updateCustomer = async (req, res) => {
  const { customerId } = req.params
  const payload = req.body

  const customer = await Customer.findOne({
    _id: customerId,
    owner: req.user._id,
  })

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found.',
    })
  }

  customer.name = sanitize(payload.name) ?? customer.name
  customer.email = sanitize(payload.email) ?? customer.email
  customer.phone = sanitize(payload.phone) ?? customer.phone

  if (payload.totalBookings !== undefined) {
    customer.totalBookings = Math.max(Number(payload.totalBookings) || 0, 0)
  }

  customer.notes = sanitize(payload.notes) ?? customer.notes
  customer.lastBookingAt = payload.lastBookingAt
    ? new Date(payload.lastBookingAt)
    : customer.lastBookingAt

  await customer.save()

  return res.json({
    success: true,
    message: 'Customer updated successfully.',
    data: transformCustomer(customer.toObject()),
  })
}

const deleteCustomer = async (req, res) => {
  const { customerId } = req.params

  const result = await Customer.findOneAndDelete({
    _id: customerId,
    owner: req.user._id,
  })

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found.',
    })
  }

  return res.json({
    success: true,
    message: 'Customer deleted successfully.',
  })
}

module.exports = {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
}

