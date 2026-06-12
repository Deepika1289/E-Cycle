import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, User, Shield, ArrowRight, RotateCcw, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { useToast } from '../../components/ui/use-toast';
import { authAPI } from '../../services/api';
import { motion } from 'framer-motion';

export const Login = () => {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [formData, setFormData] = useState({
    username: '',
    otp: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { authenticateWithToken } = useAuth();
  const { toast } = useToast();

  // Cooldown timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Step 1: Request OTP with username or email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Check if input is email or username
      const isEmail = formData.username.includes('@');
      
      if (isEmail) {
        await authAPI.requestLoginOtp({ email: formData.username });
      } else {
        await authAPI.requestLoginOtp({ username: formData.username });
      }
      
      setStep('otp');
      setResendCooldown(30);
      toast({
        title: 'OTP Sent!',
        description: 'Please check your email for the verification code.',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if input is email or username
      const isEmail = formData.username.includes('@');
      let response;
      
      // Use the correct login endpoint which handles OTP verification
      if (isEmail) {
        response = await authAPI.login({ email: formData.username, otp: formData.otp });
      } else {
        response = await authAPI.login({ username: formData.username, otp: formData.otp });
      }
      
      // Store token and user data
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // authenticateWithToken will handle the navigation based on user role
        await authenticateWithToken(response.data.token);
        // No need to navigate here as authenticateWithToken already does it
      }
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      if (status === 403 && data?.approvalStatus === 'PENDING') {
        toast({
          title: '⏳ Account Pending Approval',
          description: 'Your manager account is awaiting admin approval. You will receive an email once approved.',
          variant: 'destructive',
        });
      } else if (status === 403 && data?.approvalStatus === 'REJECTED') {
        toast({
          title: '❌ Account Rejected',
          description: 'Your manager account was rejected. Please contact the administrator.',
          variant: 'destructive',
        });
      } else {
        const errorMessage = data?.message || 'Login failed. Please try again.';
        toast({
          title: 'Login failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    try {
      // Check if input is email or username
      const isEmail = formData.username.includes('@');
      
      if (isEmail) {
        await authAPI.requestLoginOtp({ email: formData.username });
      } else {
        await authAPI.requestLoginOtp({ username: formData.username });
      }
      
      setResendCooldown(30);
      toast({
        title: 'OTP Resent',
        description: 'A new OTP has been sent to your email.',
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to resend OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full shadow-xl border-0 bg-white/80 dark:bg-slate-800/90 backdrop-blur-lg rounded-2xl overflow-hidden">
          {/* Header with Back to Home button */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 flex justify-between items-center">
            <Link 
              to="/" 
              className="flex items-center text-white hover:text-purple-200 transition-colors"
            >
              <Home className="h-5 w-5 mr-2" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="text-white font-bold text-lg">
              EcoRide+
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto bg-white/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4"
            >
              {step === 'credentials' ? (
                <User className="h-8 w-8 text-white" />
              ) : (
                <Shield className="h-8 w-8 text-white" />
              )}
            </motion.div>
            <CardTitle className="text-2xl font-bold text-white">
              {step === 'credentials' ? 'Welcome Back' : 'Verify Account'}
            </CardTitle>
            <CardDescription className="text-purple-100 mt-2">
              {step === 'credentials' ? 'Sign in to your account' : 'Enter the code sent to your email'}
            </CardDescription>
          </div>
          
          <CardHeader className="pt-6 pb-2">
            <div className="flex justify-center">
              <div className="flex items-center">
                <motion.div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === 'credentials' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-green-500 text-white'
                  }`}
                  animate={{
                    scale: step === 'credentials' ? [1, 1.1, 1] : 1
                  }}
                  transition={{ repeat: step === 'credentials' ? Infinity : 0, duration: 1 }}
                >
                  1
                </motion.div>
                <div className={`h-1 w-16 ${step === 'otp' ? 'bg-green-500' : 'bg-gray-200'}`} />
                <motion.div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === 'otp' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                  animate={{
                    scale: step === 'otp' ? [1, 1.1, 1] : 1
                  }}
                  transition={{ repeat: step === 'otp' ? Infinity : 0, duration: 1 }}
                >
                  2
                </motion.div>
              </div>
            </div>
          </CardHeader>
          
          {/* Step 1: Username Input */}
          {step === 'credentials' && (
            <motion.form 
              onSubmit={handleRequestOtp}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-5 px-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Username or Email
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="pl-10 py-6"
                      placeholder="Enter your username or email"
                      autoFocus
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <span className="flex items-center gap-2">
                      Send OTP
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
                <div className="text-sm text-center text-gray-600 dark:text-gray-300">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
                    Sign up
                  </Link>
                </div>
              </CardFooter>
            </motion.form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <motion.form 
              onSubmit={handleLogin}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-5 px-6">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={formData.otp}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
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
                    disabled={resendCooldown > 0 || isLoading}
                    className="font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 justify-center"
                  >
                    {isLoading ? (
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
                  disabled={isLoading || formData.otp.length !== 6}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Sign in
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-6 border-2"
                  onClick={() => setStep('credentials')}
                >
                  Back
                </Button>
              </CardFooter>
            </motion.form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;