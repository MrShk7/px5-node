const { Schema, model } = require('mongoose')

const otpTokenSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attemptCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
)

otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = model('OtpToken', otpTokenSchema)

