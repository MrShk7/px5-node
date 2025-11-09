const { Schema, model, Types } = require('mongoose')

const customerSchema = new Schema(
  {
    owner: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    totalBookings: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true },
    lastBookingAt: { type: Date },
  },
  {
    timestamps: true,
  },
)

customerSchema.index({ owner: 1, email: 1 }, { unique: true })
customerSchema.index({ owner: 1, name: 1 })

module.exports = model('Customer', customerSchema)

