import bcrypt from 'bcryptjs';
import otpGenerator from 'otp-generator';

// OTP metrics tracking
interface OtpMetrics {
  generationCount: number;
  verificationCount: number;
  successfulVerifications: number;
  failedVerifications: number;
  averageVerificationTimeMs: number;
  totalVerificationTimeMs: number;
}

// Initialize metrics
export const otpMetrics: OtpMetrics = {
  generationCount: 0,
  verificationCount: 0,
  successfulVerifications: 0,
  failedVerifications: 0,
  averageVerificationTimeMs: 0,
  totalVerificationTimeMs: 0
};

/**
 * Generate a secure 6-digit numeric OTP using otp-generator library
 * @param digits - Number of digits for OTP (default: 6)
 * @returns String containing numeric OTP
 */
export const generateNumericOtp = (digits = 6): string => {
  const startTime = Date.now();
  
  // Generate OTP
  const otp = otpGenerator.generate(digits, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true
  });
  
  // Update metrics
  otpMetrics.generationCount++;
  
  const endTime = Date.now();
  console.log(`📊 OTP generated in ${endTime - startTime}ms`);
  
  return otp;
};

/**
 * Hash OTP for secure storage using bcrypt
 * @param otp - Plain text OTP
 * @returns Hashed OTP string
 */
export const hashOtp = async (otp: string): Promise<string> => {
  const startTime = Date.now();
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(otp, salt);
  
  const endTime = Date.now();
  console.log(`📊 OTP hashed in ${endTime - startTime}ms`);
  
  return hash;
};

/**
 * Verify OTP against stored hash
 * @param otp - Plain text OTP to verify
 * @param hash - Stored hash to compare against
 * @returns Boolean indicating if OTP matches
 */
export const verifyOtpHash = async (otp: string, hash: string): Promise<boolean> => {
  const startTime = Date.now();
  
  // Track verification attempt
  otpMetrics.verificationCount++;
  
  // Verify OTP
  const isValid = await bcrypt.compare(otp, hash);
  
  // Update metrics
  if (isValid) {
    otpMetrics.successfulVerifications++;
  } else {
    otpMetrics.failedVerifications++;
  }
  
  const endTime = Date.now();
  const verificationTime = endTime - startTime;
  
  // Update timing metrics
  otpMetrics.totalVerificationTimeMs += verificationTime;
  otpMetrics.averageVerificationTimeMs = 
    otpMetrics.totalVerificationTimeMs / otpMetrics.verificationCount;
  
  console.log(`📊 OTP verification completed in ${verificationTime}ms (Result: ${isValid ? 'Valid ✅' : 'Invalid ❌'})`);
  
  return isValid;
};

/**
 * Get current OTP metrics
 * @returns Current OTP metrics
 */
export const getOtpMetrics = (): OtpMetrics & { successRate: number } => {
  return {
    ...otpMetrics,
    successRate: otpMetrics.verificationCount > 0 
      ? (otpMetrics.successfulVerifications / otpMetrics.verificationCount) * 100 
      : 0
  } as OtpMetrics & { successRate: number };
};
