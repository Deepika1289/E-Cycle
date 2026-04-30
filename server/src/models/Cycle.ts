import mongoose, { Schema } from 'mongoose';
import { ICycle } from '../types/index.js';

const CycleSchema = new Schema<ICycle>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Note: Using 'cycleModel' internally to avoid Mongoose reserved word 'model'
  // API will still use 'model' for backward compatibility
  cycleModel: {
    type: String,
    required: true,
    trim: true
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BOOKED', 'IN_USE', 'MAINTENANCE', 'INACTIVE'],
    default: 'AVAILABLE'
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
  station: {
    type: Schema.Types.ObjectId,
    ref: 'Station'
  },
  zone: {
    type: Schema.Types.ObjectId,
    ref: 'Zone'
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  lastMaintenance: {
    type: Date,
    default: Date.now
  },
  totalRides: {
    type: Number,
    default: 0
  },
  totalDistance: {
    type: Number,
    default: 0
  }
  ,
  imageUrl: {
    type: String,
    required: false,
    trim: true
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
CycleSchema.index({ location: '2dsphere' });
CycleSchema.index({ status: 1 });
CycleSchema.index({ station: 1 });

// Add virtual property to map 'cycleModel' to 'model' for API compatibility
CycleSchema.virtual('model').get(function() {
  return this.cycleModel;
});

CycleSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.model = ret.cycleModel;
    delete ret.cycleModel;
    return ret;
  }
});

export const Cycle = mongoose.model<ICycle>('Cycle', CycleSchema);