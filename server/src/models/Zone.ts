import mongoose, { Schema } from 'mongoose';
import { IZone } from '../types/index.js';

const ZoneSchema = new Schema<IZone>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true,
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]],
      required: true,
      validate: {
        validator: function(v: number[][][]) {
          return v.length > 0 && v[0].length >= 3;
        },
        message: 'Polygon must have at least 3 points'
      }
    }
  },
  center: {
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
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  cycleCapacity: {
    type: Number,
    required: true,
    min: 1
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
ZoneSchema.index({ boundary: '2dsphere' });
ZoneSchema.index({ center: '2dsphere' });
ZoneSchema.index({ status: 1 });

export const Zone = mongoose.model<IZone>('Zone', ZoneSchema);