const User = require('../models/User')
const slugify = require('../utils/slugify')

const normalizeEmail = (email) => email.trim().toLowerCase()

const sanitizeString = (value) =>
  typeof value === 'string' ? value.trim() : undefined

const submitProfile = async (req, res) => {
  const payload = req.body

  if (!payload || !payload.email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required.',
    })
  }

  const normalizedEmail = normalizeEmail(payload.email)
  const accountType =
    payload.accountType === 'studio' ? 'studio' : 'freelancer'
  const experience = Number(payload.profession?.experience) || 0

  const requestedHandle = sanitizeString(payload.handle)
  const fallbackHandle =
    sanitizeString(payload.profession?.userName) ||
    sanitizeString(payload.profile?.studioName) ||
    sanitizeString(payload.profile?.name)
  const normalizedHandle = slugify(requestedHandle || fallbackHandle || '')

  const setDoc = {
    accountType,
    profession: {
      userName: sanitizeString(payload.profession?.userName),
      nature: sanitizeString(payload.profession?.nature),
      experience,
    },
    socialLinks: payload.social
      ? Object.entries(payload.social).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: sanitizeString(value),
          }),
          {},
        )
      : undefined,
    portfolio: Array.isArray(payload.portfolio)
      ? payload.portfolio
          .filter((item) => item?.url)
          .slice(0, 10)
          .map((item) => ({
            url: sanitizeString(item.url),
            alt: sanitizeString(item.alt),
          }))
      : undefined,
  }

  if (normalizedHandle) {
    setDoc.handle = normalizedHandle
  }

  const unsetDoc = {}

  if (accountType === 'studio') {
    setDoc.studioProfile = {
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
    unsetDoc.individualProfile = ''
  } else {
    setDoc.individualProfile = {
      displayName: sanitizeString(payload.profile?.name),
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
    unsetDoc.studioProfile = ''
  }

  const update = {
    $set: setDoc,
    ...(Object.keys(unsetDoc).length ? { $unset: unsetDoc } : {}),
    $setOnInsert: { email: normalizedEmail },
  }

  try {
    const result = await User.findOneAndUpdate(
      { email: normalizedEmail },
      update,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    ).lean()

    return res.status(201).json({
      success: true,
      message: 'Onboarding details saved successfully.',
      data: {
        email: result.email,
        accountType: result.accountType,
        emailVerifiedAt: result.emailVerifiedAt,
        handle: result.handle,
        profession: result.profession,
        individualProfile: result.individualProfile,
        studioProfile: result.studioProfile,
        socialLinks: result.socialLinks,
        portfolio: result.portfolio,
      },
    })
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

module.exports = {
  submitProfile,
}

