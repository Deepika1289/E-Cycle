import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp_code: { type: String, required: true }, // Plain OTP for development visibility
  hash: { type: String, required: true }, // Hashed OTP for verification
  attempts: { type: Number, default: 0 },
  is_verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, required: true, index: true },
  expiry_time: { type: Date, required: true }, // Alias for expiresAt
}, {
  timestamps: true
});

// TTL index on expiresAt will delete expired OTP documents
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if OTP is expired
OtpSchema.virtual('isExpired').get(function() {
  return Date.now() > this.expiresAt.getTime();
});

export const OtpModel = mongoose.model('Otp', OtpSchema);
