import mongoose, { Schema } from 'mongoose';
import { IBooking } from '../types/index.js';

const BookingSchema = new Schema<IBooking>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cycle: {
    type: Schema.Types.ObjectId,
    ref: 'Cycle',
    required: true
  },
  startStation: {
    type: Schema.Types.ObjectId,
    ref: 'Station',
    required: true
  },
  endStation: {
    type: Schema.Types.ObjectId,
    ref: 'Station',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
    default: 'PENDING'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  estimatedCost: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

BookingSchema.index({ user: 1 });
BookingSchema.index({ cycle: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ createdAt: -1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);