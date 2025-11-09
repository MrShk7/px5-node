const { Schema, model, Types } = require('mongoose')

const bookingSchema = new Schema(
  {
    owner: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customer: {
      type: Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    service: {
      type: Types.ObjectId,
      ref: 'Service',
    },
    serviceName: { type: String, trim: true },
    customerName: { type: String, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    scheduledDate: { type: Date, required: true },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
)

bookingSchema.index({ owner: 1, scheduledDate: -1 })
bookingSchema.index({ owner: 1, status: 1 })

module.exports = model('Booking', bookingSchema)

