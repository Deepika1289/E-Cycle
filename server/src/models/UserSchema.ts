import { Schema } from 'mongoose';
import { IUser } from '../types';

export const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['USER', 'MANAGER', 'ADMIN'],
    default: 'USER',
    index: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED'],
    default: 'ACTIVE',
    index: true
  },
  externalId: {
    type: String,
    unique: true,
    sparse: true
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otpCode: { type: String, select: false },
  otpExpiresAt: { type: Date, select: false },
  avatar: String,
  preferences: {
    favoriteStations: [{
      type: Schema.Types.ObjectId,
      ref: 'Station'
    }],
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});
