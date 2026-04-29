import { generateNumericOtp, hashOtp, verifyOtpHash } from '../src/utils/otp';

describe('OTP utilities', () => {
  test('generateNumericOtp produces correct length and digits only', () => {
    const otp = generateNumericOtp(6);
    expect(otp).toHaveLength(6);
    expect(/^[0-9]{6}$/.test(otp)).toBe(true);
  });

  test('hashOtp and verifyOtpHash work together', async () => {
    const otp = generateNumericOtp(6);
    const hashed = await hashOtp(otp);
    expect(typeof hashed).toBe('string');
    const ok = await verifyOtpHash(otp, hashed);
    expect(ok).toBe(true);
    const wrong = await verifyOtpHash('000000', hashed);
    expect(wrong).toBe(false);
  });
});
