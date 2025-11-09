const Booking = require('../models/Booking')
const Customer = require('../models/Customer')
const Service = require('../models/Service')
const Website = require('../models/Website')

const startOfToday = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const computeWebsiteCompletion = (user, website) => {
  const checks = [
    user?.profession?.userName,
    user?.accountType === 'studio'
      ? user?.studioProfile?.bio
      : user?.individualProfile?.bio,
    (user?.portfolio || []).length > 0,
    website?.hero?.title,
    website?.servicesSection?.title,
    website?.contactSection?.email,
  ]

  const filled = checks.filter(Boolean).length
  const percent = Math.round((filled / checks.length) * 100)

  return {
    percent,
    missingSections: checks.length - filled,
  }
}

const getDashboardSummary = async (req, res) => {
  const ownerId = req.user._id

  const [bookingCount, customerCount, serviceCount, website, serviceBreakdown] =
    await Promise.all([
      Booking.countDocuments({ owner: ownerId }),
      Customer.countDocuments({ owner: ownerId }),
      Service.countDocuments({ owner: ownerId }),
      Website.findOne({ owner: ownerId }).lean(),
      Booking.aggregate([
        { $match: { owner: ownerId } },
        {
          $group: {
            _id: '$serviceName',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ])

  const websiteStatus = computeWebsiteCompletion(req.user, website)

  const totalServiceBookings = serviceBreakdown.reduce(
    (sum, item) => sum + item.count,
    0,
  )

  const topSegments = serviceBreakdown.slice(0, 6).map((item) => ({
    name: item._id || 'Unknown service',
    count: item.count,
  }))

  if (serviceBreakdown.length > 6) {
    const otherCount = serviceBreakdown
      .slice(6)
      .reduce((sum, item) => sum + item.count, 0)
    topSegments.push({ name: 'Other services', count: otherCount })
  }

  const segments = topSegments.map((segment) => ({
    name: segment.name,
    count: segment.count,
    percent:
      totalServiceBookings === 0
        ? 0
        : Number(((segment.count / totalServiceBookings) * 100).toFixed(2)),
  }))

  const upcomingBookings = await Booking.find({
    owner: ownerId,
    scheduledDate: { $gte: startOfToday() },
  })
    .sort({ scheduledDate: 1 })
    .limit(6)
    .lean()

  const upcoming = upcomingBookings.map((booking) => {
    const date = new Date(booking.scheduledDate)
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return {
      id: booking._id,
      serviceName: booking.serviceName || 'Photography service',
      customerName: booking.customerName,
      date: booking.scheduledDate,
      dateLabel: dateFormatter.format(date),
      timeRange: booking.startTime && booking.endTime
        ? `${booking.startTime} - ${booking.endTime}`
        : booking.startTime || 'All day',
      status: booking.status,
    }
  })

  res.json({
    success: true,
    data: {
      metrics: {
        bookings: bookingCount,
        customers: customerCount,
        services: serviceCount,
        portfolio: (req.user.portfolio || []).length,
      },
      website: {
        percent: websiteStatus.percent,
        message:
          websiteStatus.percent < 100
            ? 'Your website is waiting — complete the customization and go live!'
            : 'Nice! Your website is ready to share.',
      },
      serviceBreakdown: {
        total: totalServiceBookings,
        segments,
      },
      upcomingBookings: upcoming,
    },
  })
}

module.exports = {
  getDashboardSummary,
}
