const User = require('../models/User')
const slugify = require('../utils/slugify')

const sanitizeString = (value) =>
  typeof value === 'string' ? value.trim() : undefined

const cleanObject = (input) => {
  if (!input || typeof input !== 'object') return input
  if (Array.isArray(input)) {
    return input.map((item) => cleanObject(item))
  }
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc
    }
    acc[key] = cleanObject(value)
    return acc
  }, {})
}

const mapSocialLinks = (social = {}) => {
  const allowedKeys = [
    'facebook',
    'instagram',
    'pinterest',
    'youtube',
    'tiktok',
    'linkedin',
    'twitter',
    'website',
  ]

  return allowedKeys.reduce((acc, key) => {
    if (social[key]) {
      acc[key] = sanitizeString(social[key])
    }
    return acc
  }, {})
}

const shapeProfile = (user) => {
  if (!user) return null
  const doc = user.toObject ? user.toObject() : user

  return {
    id: doc._id,
    email: doc.email,
    handle: doc.handle,
    accountType: doc.accountType,
    profession: doc.profession,
    individualProfile: doc.individualProfile,
    studioProfile: doc.studioProfile,
    socialLinks: doc.socialLinks || {},
    portfolio: doc.portfolio || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

const getProfile = async (req, res) => {
  const profile = shapeProfile(req.user)

  res.json({
    success: true,
    data: profile,
  })
}

const updateProfile = async (req, res) => {
  const payload = req.body || {}
  const accountType = ['studio', 'freelancer'].includes(payload.accountType)
    ? payload.accountType
    : req.user.accountType

  const update = {
    accountType,
    profession: {
      userName: sanitizeString(payload.profession?.userName),
      nature: sanitizeString(payload.profession?.nature),
      experience: Number(payload.profession?.experience) || 0,
    },
    socialLinks: mapSocialLinks(payload.socialLinks),
  }

  if (accountType === 'studio') {
    update.studioProfile = {
      studioName: sanitizeString(payload.profile?.studioName),
      contactPerson: sanitizeString(payload.profile?.contactPerson),
      phone: {
        code: sanitizeString(payload.profile?.phone?.code),
        number: sanitizeString(payload.profile?.phone?.number),
      },
      location: {
        country: sanitizeString(payload.profile?.location?.country),
        city: sanitizeString(payload.profile?.location?.city),
      },
      bio: sanitizeString(payload.profile?.bio),
    }
    update.individualProfile = undefined
  } else {
    update.individualProfile = {
      displayName: sanitizeString(payload.profile?.displayName),
      phone: {
        code: sanitizeString(payload.profile?.phone?.code),
        number: sanitizeString(payload.profile?.phone?.number),
      },
      location: {
        country: sanitizeString(payload.profile?.location?.country),
        city: sanitizeString(payload.profile?.location?.city),
      },
      bio: sanitizeString(payload.profile?.bio),
    }
    update.studioProfile = undefined
  }

  const requestedHandle = sanitizeString(payload.handle)
  if (requestedHandle) {
    update.handle = slugify(requestedHandle)
  }

  if (accountType === 'studio') {
    delete update.individualProfile
  } else {
    delete update.studioProfile
  }

  const cleanedUpdate = cleanObject(update)

  let updatedUser
  try {
    updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id },
      {
        $set: cleanedUpdate,
        ...(accountType === 'studio'
          ? { $unset: { individualProfile: '' } }
          : { $unset: { studioProfile: '' } }),
      },
      { new: true, runValidators: true },
    )
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.handle) {
      return res.status(400).json({
        success: false,
        message: 'This website handle is already taken. Please choose another one.',
      })
    }
    throw error
  }

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    data: shapeProfile(updatedUser),
  })
}

module.exports = {
  getProfile,
  updateProfile,
}
