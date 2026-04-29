import mongoose, { Schema } from 'mongoose';
import { IPayment } from '../types/index.js';

const PaymentSchema = new Schema<IPayment>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  type: {
    type: String,
    enum: ['RIDE', 'WALLET_TOPUP', 'REFUND'],
    required: true
  },
  method: {
    type: String,
    enum: ['CARD', 'UPI', 'WALLET'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  transactionId: String,
  gatewayResponse: Schema.Types.Mixed,
  qrCode: String
}, {
  timestamps: true
});

PaymentSchema.index({ user: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);