import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cycles';

const check = async () => {
  try {
    console.log('Connecting to', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected');

    const username = process.env.CHECK_USERNAME || 'user01';
    const plain = process.env.CHECK_PASSWORD || 'user123';

    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      console.error('User not found for username', username);
      process.exit(2);
    }

    console.log('Found user:', { username: user.username, email: user.email, isVerified: user.isVerified });
    console.log('Password hash (stored):', (user as any).password);

    const ok = await bcrypt.compare(plain, (user as any).password);
    console.log(`bcrypt.compare('${plain}', stored) =>`, ok);
    process.exit(ok ? 0 : 3);
  } catch (err) {
    console.error('Error during check:', err);
    process.exit(1);
  }
};

check();
