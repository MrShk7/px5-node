const { Schema, model } = require('mongoose')

const phoneSchema = new Schema(
  {
    code: { type: String, trim: true },
    number: { type: String, trim: true },
  },
  { _id: false },
)

const locationSchema = new Schema(
  {
    country: { type: String, trim: true },
    city: { type: String, trim: true },
  },
  { _id: false },
)

const professionSchema = new Schema(
  {
    userName: { type: String, trim: true },
    nature: { type: String, trim: true },
    experience: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
)

const individualProfileSchema = new Schema(
  {
    displayName: { type: String, trim: true },
    phone: phoneSchema,
    location: locationSchema,
    bio: { type: String, trim: true },
  },
  { _id: false },
)

const studioProfileSchema = new Schema(
  {
    studioName: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    phone: phoneSchema,
    location: locationSchema,
    bio: { type: String, trim: true },
  },
  { _id: false },
)

const portfolioItemSchema = new Schema(
  {
    url: { type: String, trim: true },
    alt: { type: String, trim: true },
  },
  { _id: false },
)

const socialLinksSchema = new Schema(
  {
    facebook: { type: String, trim: true },
    pinterest: { type: String, trim: true },
    youtube: { type: String, trim: true },
    tiktok: { type: String, trim: true },
    instagram: { type: String, trim: true },
    linkedin: { type: String, trim: true },
  },
  { _id: false },
)

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ['freelancer', 'studio'],
      default: 'freelancer',
    },
    handle: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    emailVerifiedAt: { type: Date, default: null },
    profession: professionSchema,
    individualProfile: individualProfileSchema,
    studioProfile: studioProfileSchema,
    socialLinks: socialLinksSchema,
    portfolio: [portfolioItemSchema],
  },
  {
    timestamps: true,
  },
)

userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ accountType: 1 })
userSchema.index({ handle: 1 }, { unique: true, sparse: true })

module.exports = model('User', userSchema)

