import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types/index.js';
import { UserSchema } from './UserSchema.js';

// Remove sensitive fields from JSON output
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.otpCode;
  delete user.otpExpiresAt;
  return user;
};

export const User = mongoose.model<IUser>('User', UserSchema);
