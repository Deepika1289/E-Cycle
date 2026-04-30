import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
let redis: any = null;

if (REDIS_URL) {
  try {
    redis = new Redis(REDIS_URL, {
      retryStrategy: () => null, // Don't retry connection
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true
    });
    
    // Try to connect
    redis.connect().then(() => {
      console.log('✅ Redis connected successfully');
    }).catch((err: any) => {
      console.warn('⚠️  Redis connection failed, using MongoDB fallback');
      redis = null;
    });
    
    // Suppress error events to avoid unhandled errors
    redis.on('error', (err: any) => {
      // Silently ignore Redis errors - we'll use MongoDB fallback
    });
  } catch (err) {
    console.warn('⚠️  Redis initialization failed, using MongoDB fallback');
    redis = null;
  }
} else {
  console.log('ℹ️  No REDIS_URL configured, using MongoDB for OTP storage');
}

export const isRedisAvailable = () => !!redis;

export const storeOtp = async (email: string, hashedOtp: string, expirySec: number, meta: any = {}) => {
  if (!redis) return false;
  const key = `otp:${email}`;
  const payload = JSON.stringify({ hash: hashedOtp, attempts: 0, meta });
  await redis.set(key, payload, 'EX', expirySec);
  return true;
};

export const getOtpRecord = async (email: string) => {
  if (!redis) return null;
  const key = `otp:${email}`;
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw);
};

export const incrementAttempts = async (email: string) => {
  if (!redis) return;
  const key = `otp:${email}`;
  const raw = await redis.get(key);
  if (!raw) return;
  const obj = JSON.parse(raw);
  obj.attempts = (obj.attempts || 0) + 1;
  await redis.set(key, JSON.stringify(obj));
};

export const deleteOtp = async (email: string) => {
  if (!redis) return;
  const key = `otp:${email}`;
  await redis.del(key);
};
