const { startOfMonth, subMonths } = require('date-fns')
const User = require('../models/User')
const Service = require('../models/Service')
const Booking = require('../models/Booking')
const Website = require('../models/Website')

const monthLabel = (year, month) => {
  const date = new Date(year, month - 1)
  return date.toLocaleString('en-US', { month: 'short' })
}

const getDisplayName = (user) => {
  if (user.accountType === 'studio') {
    return user.studioProfile?.studioName || user.profession?.userName || user.email
  }
  return (
    user.individualProfile?.displayName ||
    user.profession?.userName ||
    user.email
  )
}

const getDashboardOverview = async (_req, res) => {
  const now = new Date()
  const trendStart = startOfMonth(subMonths(now, 5))

  const [
    totalUsers,
    verifiedUsers,
    activeServices,
    activeBookings,
    publishedWebsites,
    totalServices,
    totalBookings,
    signupAggregation,
    profileCompleted,
    websiteConfigurations,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ emailVerifiedAt: { $ne: null } }),
    Service.countDocuments({ isActive: true }),
    Booking.countDocuments({ status: 'accepted' }),
    Website.countDocuments({ lastPublishedAt: { $ne: null } }),
    Service.countDocuments(),
    Booking.countDocuments(),
    User.aggregate([
      { $match: { createdAt: { $gte: trendStart } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    User.countDocuments({
      $or: [
        { accountType: 'studio', 'studioProfile.bio': { $exists: true, $ne: '' } },
        {
          accountType: 'freelancer',
          'individualProfile.bio': { $exists: true, $ne: '' },
        },
      ],
    }),
    Website.countDocuments(),
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        'email accountType profession individualProfile studioProfile emailVerifiedAt createdAt',
      )
      .lean(),
  ])

  const signupTrend = []
  for (let i = 5; i >= 0; i -= 1) {
    const date = subMonths(now, i)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const bucket = signupAggregation.find(
      (entry) => entry._id.year === year && entry._id.month === month,
    )
    signupTrend.push({
      label: monthLabel(year, month),
      value: bucket ? bucket.count : 0,
    })
  }

  const onboarding = [
    {
      stage: 'Email verified',
      percent: totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
    },
    {
      stage: 'Profile completed',
      percent: totalUsers ? Math.round((profileCompleted / totalUsers) * 100) : 0,
    },
    {
      stage: 'Website configured',
      percent: totalUsers
        ? Math.round((websiteConfigurations / totalUsers) * 100)
        : 0,
    },
    {
      stage: 'Published website',
      percent: totalUsers
        ? Math.round((publishedWebsites / totalUsers) * 100)
        : 0,
    },
  ]

  const recentCreators = recentUsers.map((user) => ({
    name: getDisplayName(user),
    email: user.email,
    status: user.emailVerifiedAt ? 'Verified' : 'Invited',
    joinedAt: user.createdAt,
    accountType: user.accountType,
  }))

  return res.json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        verifiedUsers,
        activeServices,
        activeBookings,
        publishedWebsites,
        totalServices,
        totalBookings,
      },
      signupTrend,
      onboarding,
      recentCreators,
    },
  })
}

const getUsersDirectory = async (_req, res) => {
  const [users, bookingsAgg, websites] = await Promise.all([
    User.find()
      .select(
        'email accountType profession individualProfile studioProfile emailVerifiedAt createdAt',
      )
      .lean(),
    Booking.aggregate([
      {
        $group: {
          _id: '$owner',
          total: { $sum: 1 },
          accepted: {
            $sum: {
              $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0],
            },
          },
        },
      },
    ]),
    Website.find().select('owner lastPublishedAt updatedAt').lean(),
  ])

  const bookingMap = bookingsAgg.reduce((acc, entry) => {
    acc.set(entry._id.toString(), {
      total: entry.total,
      accepted: entry.accepted,
    })
    return acc
  }, new Map())

  const websiteMap = websites.reduce((acc, website) => {
    acc.set(website.owner.toString(), website)
    return acc
  }, new Map())

  const directory = users.map((user) => {
    const id = user._id.toString()
    const bookings = bookingMap.get(id) || { total: 0, accepted: 0 }
    const website = websiteMap.get(id)

    const status = !user.emailVerifiedAt
      ? 'Invited'
      : website?.lastPublishedAt
        ? 'Active'
        : 'Draft'

    return {
      id,
      name: getDisplayName(user),
      email: user.email,
      accountType: user.accountType,
      bookingsTotal: bookings.total,
      bookingsAccepted: bookings.accepted,
      websites: website ? 1 : 0,
      status,
      joined: user.createdAt,
    }
  })

  return res.json({
    success: true,
    data: directory,
  })
}

const getOperationsOverview = async (_req, res) => {
  const flagged = await Service.find({
    $or: [{ isActive: false }, { category: { $in: [null, ''] } }],
  })
    .populate('owner', 'accountType profession individualProfile studioProfile email')
    .sort({ updatedAt: -1 })
    .limit(10)
    .lean()

  const pendingBookings = await Booking.find({ status: { $in: ['pending', 'declined'] } })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean()

  const flaggedServices = flagged.map((service) => ({
    id: service._id.toString(),
    title: service.title,
    owner:
      getDisplayName(service.owner) || service.owner?.email || 'Unknown owner',
    reason: service.isActive === false ? 'Service inactive' : 'Missing category',
    createdAt: service.updatedAt || service.createdAt,
  }))

  const bookingAlerts = pendingBookings.map((booking) => ({
    id: booking._id.toString(),
    customer: booking.customerName || 'Unknown customer',
    studio: booking.serviceName || 'Pending service',
    value: booking.totalAmount || booking.price || null,
    status: booking.status,
    note:
      booking.status === 'declined'
        ? 'Declined booking awaiting follow-up'
        : 'Pending approval for more than 48 hours',
  }))

  return res.json({
    success: true,
    data: {
      summary: {
        flaggedServices: flaggedServices.length,
        bookingAlerts: bookingAlerts.length,
        pendingBookings: pendingBookings.length,
      },
      flaggedServices,
      bookingAlerts,
    },
  })
}

module.exports = {
  getDashboardOverview,
  getUsersDirectory,
  getOperationsOverview,
}
