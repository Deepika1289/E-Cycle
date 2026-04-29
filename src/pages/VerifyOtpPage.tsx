import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticateWithToken } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ otp?: string }>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Get email from query string
  const params = new URLSearchParams(location.search);
  const email = params.get('email') || '';

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      toast.error('No email provided. Please request OTP first.');
      navigate('/auth/request-otp');
    }
  }, [email, navigate]);

  // Focus OTP input on mount
  useEffect(() => {
    otpInputRef.current?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // OTP validation
  const validateOtp = (value: string): boolean => {
    if (!value.trim()) {
      setErrors({ otp: 'OTP is required' });
      return false;
    }
    
    if (value.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' });
      return false;
    }
    
    if (!/^\d{6}$/.test(value)) {
      setErrors({ otp: 'OTP must contain only numbers' });
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate OTP
    if (!validateOtp(otp)) {
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const startTime = performance.now();
      const res = await authAPI.verifyOtp({ email, otp: otp.trim() });
      const verificationTime = performance.now() - startTime;
      console.log(`OTP verification completed in ${Math.round(verificationTime)}ms`);
      
      toast.success(
        res.data.message || 'OTP verified successfully!',
        { duration: 3000 }
      );
      
      // Store JWT token in localStorage
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        
        // Authenticate with token using AuthContext
        await authenticateWithToken(res.data.token);
        
        toast.success('You are now logged in. Redirecting...', { duration: 2000 });
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        // Fallback: redirect to login if no token
        toast.success('Verification complete. Please login.');
        navigate('/auth/login');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = error.response?.data?.message || 'OTP verification failed. Please try again.';
      
      setErrorMsg(errorMessage);
      toast.error(errorMessage);
      
      // Enhanced error handling with attempt tracking
      if (error.response?.data?.attemptsRemaining !== undefined) {
        setAttemptsRemaining(error.response.data.attemptsRemaining);
        
        if (error.response.data.attemptsRemaining === 0) {
          toast.error('Maximum attempts exceeded. Please request a new OTP.');
          setTimeout(() => {
            navigate('/auth/request-otp');
          }, 2000);
        }
      } else if (error.response?.status === 429) {
        // Handle rate limiting
        toast.error('Too many attempts. Please wait before trying again.');
        setResendCooldown(120); // 2 minutes cooldown
      } else if (error.response?.status === 400) {
        // Handle invalid OTP
        toast.error('Invalid OTP. Please check the code and try again.');
      }
      
      // Clear OTP input on error
      setOtp('');
      otpInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    setErrorMsg(null);
    
    try {
      // Use the sendOtp function which works for both registration and login
      const response = await authAPI.sendOtp({ email });
      
      toast.success(
        response.data.message || 'New OTP sent successfully!',
        { duration: 4000 }
      );
      
      // Reset state
      setOtp('');
      setAttemptsRemaining(null);
      setResendCooldown(60); // 60 seconds cooldown
      otpInputRef.current?.focus();
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait before trying again.';
        setResendCooldown(120); // 2 minutes for rate limiting
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    
    if (value.length <= 6) {
      setOtp(value);
      
      // Clear errors when user starts typing
      if (errors.otp || errorMsg) {
        setErrors({});
        setErrorMsg(null);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back button */}
        <Link
          to="/auth/request-otp"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Change email
        </Link>

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Enter the 6-digit code sent to
          </p>
          <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">
            {email}
          </p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Verification Code
            </label>
            <input
              ref={otpInputRef}
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={otp}
              onChange={handleOtpChange}
              onBlur={() => otp && validateOtp(otp)}
              className={`block w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                errors.otp || errorMsg
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-green-500 focus:ring-green-500'
              } dark:bg-gray-800 dark:border-gray-700 dark:text-white`}
              placeholder="000000"
              disabled={isSubmitting}
            />
            {errors.otp && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.otp}
              </p>
            )}
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3">
              <div className="flex items-start">
                <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-medium">{errorMsg}</p>
                  {attemptsRemaining !== null && attemptsRemaining > 0 && (
                    <p className="text-sm mt-1">
                      {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="w-full py-3 px-4 font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" color="blue" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify OTP</span>
            )}
          </button>

          {/* Resend OTP */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending || resendCooldown > 0}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isResending ? 'animate-spin' : ''}`} />
              {isResending
                ? 'Resending...'
                : resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : 'Resend OTP'}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                Didn't receive the code?
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your spam folder</li>
                <li>Wait a few moments for the email</li>
                <li>Click "Resend OTP" above</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
