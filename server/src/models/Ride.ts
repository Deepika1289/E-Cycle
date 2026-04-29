import mongoose, { Schema } from 'mongoose';
import { IRide } from '../types/index.js';

const LocationPointSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    required: true
  }
}, { _id: false });

const RoutePointSchema = new Schema({
  location: LocationPointSchema,
  timestamp: {
    type: Date,
    required: true
  }
}, { _id: false });

const RideSchema = new Schema<IRide>({
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
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
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  startLocation: LocationPointSchema,
  endLocation: LocationPointSchema,
  route: [RoutePointSchema],
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  distance: {
    type: Number,
    default: 0,
    min: 0
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  cancellation: {
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    cancelTime: Date,
    refundStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'DECLINED'],
      default: 'PENDING'
    }
  },
  scheduledEndTime: Date
}, {
  timestamps: true
});

RideSchema.index({ user: 1 });
RideSchema.index({ cycle: 1 });
RideSchema.index({ status: 1 });
RideSchema.index({ startTime: -1 });

export const Ride = mongoose.model<IRide>('Ride', RideSchema);