import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/use-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { authAPI } from '../../services/api';
import { User, Mail, Phone, Lock, Shield, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export const Register = () => {
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'USER' as 'USER' | 'MANAGER' | 'ADMIN',
  });
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [registeredUsername, setRegisteredUsername] = useState<string>('');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const { authenticateWithToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Cooldown timer for resend OTP
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
    if (validationError) setValidationError('');
  };

  const handleRoleChange = (value: 'USER' | 'MANAGER' | 'ADMIN') => {
    setFormData(prev => ({
      ...prev,
      role: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    
    // Validate name
    if (!formData.name || formData.name.trim().length < 2) {
      const errorMsg = 'Please enter your full name';
      setValidationError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }
    
    // Validate phone
    if (!formData.phone || formData.phone.length < 10) {
      const errorMsg = 'Please enter a valid phone number';
      setValidationError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authAPI.register(formData);
      
      console.log('✅ Registration response:', response.data);
      console.log('📧 Email registered:', formData.email);
      console.log('👤 Name:', formData.name);
      console.log('📱 Phone:', formData.phone);
      console.log('🔑 Username generated:', response.data.username);
      
      // Store email and username
      setRegisteredEmail(formData.email);
      setRegisteredUsername(response.data.username);
      
      // Move to OTP verification step
      setStep('otp');
      setResendCooldown(30);
      
      toast({
        title: '✅ Registration Successful!',
        description: (
          <div className="space-y-2">
            <p className="font-bold">Check your email for:</p>
            <p className="text-sm">1. Your username: {response.data.username}</p>
            <p className="text-sm">2. OTP verification code</p>
          </div>
        ),
        duration: 8000,
      });
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setValidationError(errorMessage);
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and complete registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
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
      const response = await authAPI.verifyOtp({ email: formData.email, otp });
      
      // Store token and authenticate
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        await authenticateWithToken(response.data.token);
      }
      
      toast({
        title: '✅ Verification Successful!',
        description: `Welcome, ${registeredUsername}! Redirecting to home page...`,
      });
      
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'OTP verification failed. Please try again.';
      toast({
        title: 'Verification failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    try {
      await authAPI.requestRegistrationOtp({ email: formData.email });
      setResendCooldown(30);
      toast({
        title: 'OTP Resent',
        description: 'A new OTP has been sent to your email.',
      });
    } catch (error: any) {
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
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto bg-white/20 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4"
            >
              {step === 'register' ? (
                <User className="h-8 w-8 text-white" />
              ) : (
                <Shield className="h-8 w-8 text-white" />
              )}
            </motion.div>
            <CardTitle className="text-2xl font-bold text-white">
              {step === 'register' ? 'Create Account' : 'Verify Email'}
            </CardTitle>
            <CardDescription className="text-purple-100 mt-2">
              {step === 'register' 
                ? 'Join our cycling community today' 
                : 'Enter the code sent to your email'}
            </CardDescription>
          </div>
          
          <CardHeader className="pt-6 pb-2">
            <div className="flex justify-center">
              <div className="flex items-center">
                <motion.div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === 'register' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-green-500 text-white'
                  }`}
                  animate={{
                    scale: step === 'register' ? [1, 1.1, 1] : 1
                  }}
                  transition={{ repeat: step === 'register' ? Infinity : 0, duration: 1 }}
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
          
          {/* Step 1: Registration Form */}
          {step === 'register' && (
            <motion.form 
              onSubmit={handleRegister}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-5 px-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="pl-10 py-5"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="pl-10 py-5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1234567890"
                      className="pl-10 py-5"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Role
                  </Label>
                  <Select onValueChange={handleRoleChange} defaultValue="USER">
                    <SelectTrigger className="py-5">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">🚴 User</SelectItem>
                      <SelectItem value="MANAGER">🏢 Manager</SelectItem>
                      <SelectItem value="ADMIN">👑 Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {validationError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
                  </motion.div>
                )}
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
                      Continue
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
                <div className="text-sm text-center text-gray-600 dark:text-gray-300">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </motion.form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <motion.form 
              onSubmit={handleVerifyOtp}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-5 px-6">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4"
                >
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                    <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>
                      We've sent a verification code to <strong>{formData.email}</strong>
                    </span>
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-2 flex items-start gap-2">
                    <User className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>
                      Your username <strong>{registeredUsername}</strong> has also been sent to your email.
                    </span>
                  </p>
                </motion.div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Verification Code
                  </Label>
                  <div className="relative">
                    <Input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="text-center text-2xl tracking-widest py-6 font-mono"
                      autoFocus
                    />
                  </div>
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
                      Verify & Complete Registration
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-6 border-2"
                  onClick={() => setStep('register')}
                >
                  Back to Registration
                </Button>
              </CardFooter>
            </motion.form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};