const { Schema, model, Types } = require('mongoose')

const photoSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true },
  },
  { _id: false },
)

const serviceSchema = new Schema(
  {
    owner: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    price: {
      amount: { type: Number, min: 0, default: 0 },
      currency: { type: String, default: 'USD' },
    },
    startDate: { type: Date },
    endDate: { type: Date },
    address: { type: String, trim: true },
    location: {
      city: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    paymentLink: { type: String, trim: true },
    description: { type: String, trim: true },
    photos: [photoSchema],
    isActive: { type: Boolean, default: true },
    rating: { type: Number, min: 0, max: 5, default: 4.5 },
  },
  {
    timestamps: true,
  },
)

serviceSchema.index({ owner: 1, title: 1 }, { unique: false })
serviceSchema.index({ isActive: 1 })

module.exports = model('Service', serviceSchema)

