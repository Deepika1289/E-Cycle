import mongoose, { Schema } from 'mongoose';
import { IStation } from '../types/index.js';

const StationSchema = new Schema<IStation>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v: number[]) {
          return v.length === 2;
        },
        message: 'Coordinates must be [longitude, latitude]'
      }
    }
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  availableCycles: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  facilities: [{
    type: String,
    enum: ['REPAIR_STATION', 'CHARGING_POINT', 'COVERED_PARKING', 'SECURITY_CAMERA']
  }]
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
StationSchema.index({ location: '2dsphere' });

export const Station = mongoose.model<IStation>('Station', StationSchema);