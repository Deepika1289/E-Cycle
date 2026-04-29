import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/ui/use-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { authAPI } from '../../services/api';
import { Mail, Shield, CheckCircle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }

    // Start the cooldown timer
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.verifyOtp({ email, otp });
      
      // Store token and user data
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      toast({
        title: 'Success! ✅',
        description: 'Your account has been verified. Logging you in...',
      });
      
      // Auto-login: redirect to dashboard/home
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Verification failed. Please try again.';
      toast({
        title: 'Verification failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      // Use the sendOtp function which works for both registration and login
      await authAPI.sendOtp({ email });
      setResendCooldown(30);
      toast({
        title: 'OTP resent',
        description: 'A new OTP has been sent to your email.',
      });
    } catch (error) {
      toast({
        title: 'Failed to resend OTP',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full shadow-xl border-0 bg-white/80 dark:bg-slate-800/90 backdrop-blur-lg rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto bg-white/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4"
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-white">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-purple-100 mt-2">
              Enter the code sent to your email
            </CardDescription>
          </div>
          
          <form onSubmit={handleVerify}>
            <CardContent className="space-y-5 px-6 pt-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4"
              >
                <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                  <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>
                    We've sent a verification code to <strong>{email}</strong>
                  </span>
                </p>
              </motion.div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="text-center text-2xl tracking-widest py-6 font-mono"
                  autoFocus
                />
              </div>
              <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                Didn't receive a code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending}
                  className="font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 justify-center"
                >
                  {isResending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"
                    />
                  ) : resendCooldown > 0 ? (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Resend code
                    </>
                  )}
                </button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
              <Button 
                type="submit" 
                className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Verify & Login
                  </span>
                )}
              </Button>
              <div className="text-sm text-center">
                <Link to="/login" className="font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
                  Back to login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyOtp;