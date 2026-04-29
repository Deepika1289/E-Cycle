import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  walletBalance: number;
  isVerified: boolean;
  username: string;
  preferences: {
    favoriteStations: string[];
    notifications: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithOtp: (email: string, otp: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ message: string }>;
  logout: () => void;
  authenticateWithToken: (token: string) => Promise<void>;
  updateUser: (user: User) => void;
  refreshAuth: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  console.log('AuthContext - Initial state:', { user: !!user, token: !!token, isLoading });

  // Function to refresh authentication
  const refreshAuth = async () => {
    const currentToken = localStorage.getItem('token');
    console.log('AuthContext - Refreshing auth with token:', !!currentToken);
    if (currentToken) {
      try {
        const response = await authAPI.getCurrentUser();
        console.log('AuthContext - Current user fetched:', response.data.user);
        setUser(response.data.user);
      } catch (error: any) {
        console.error('Auth refresh failed:', error);
        // Only remove tokens if it's a 401 error (unauthorized)
        if (error.response?.status === 401) {
          console.log('AuthContext - Token expired during refresh');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setToken(null);
          setUser(null);
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      await refreshAuth();
    };

    initializeAuth();
  }, [token]);

  // Separate useEffect for event listener to avoid dependency issues
  useEffect(() => {
    // Listen for auth expiration events
    const handleAuthExpired = () => {
      console.log('AuthContext - Auth expired event received');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
      console.log('AuthContext - Tokens removed, navigating to login');
      // Add a small delay to ensure navigation happens after current call stack
      setTimeout(() => {
        navigate('/auth/login');
      }, 0);
    };

    console.log('AuthContext - Adding authExpired event listener');
    window.addEventListener('authExpired', handleAuthExpired);
    
    return () => {
      console.log('AuthContext - Removing authExpired event listener');
      window.removeEventListener('authExpired', handleAuthExpired);
    };
  }, [navigate]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.loginWithPassword(username, password);
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      console.log('AuthContext - Login successful:', { user: !!userData, token: !!newToken });

      // Redirect based on user role
      if (userData.role === 'USER') {
        navigate('/user/dashboard');
      } else if (userData.role === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Remove any invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
      throw error; // Re-throw the error to be caught in LoginPage
    }
  };

  const loginWithOtp = async (identifier: string, otp: string) => {
    try {
      // Check if identifier is email or username
      const isEmail = identifier.includes('@');
      let response;
      
      if (isEmail) {
        response = await authAPI.login({ email: identifier, otp });
      } else {
        response = await authAPI.login({ username: identifier, otp });
      }
      
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      console.log('AuthContext - OTP Login successful:', { user: !!userData, token: !!newToken });
      
      // Redirect based on user role
      if (userData.role === 'USER') {
        navigate('/user/dashboard');
      } else if (userData.role === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login with OTP failed:', error);
      // Remove any invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
      throw error;
    }
  };
  
  const authenticateWithToken = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
      console.log('AuthContext - Authenticate with token successful:', { user: !!response.data.user, token: !!newToken });
      
      // Redirect based on user role
      if (response.data.user.role === 'USER') {
        navigate('/user/dashboard');
      } else if (response.data.user.role === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error('Failed to fetch user after token set', err);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
      
      // Provide more specific error messages
      if (err.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        throw new Error('Access denied. Please contact support.');
      } else {
        throw new Error('Failed to authenticate. Please try again.');
      }
    }
  };
  
  const logout = () => {
    console.log('AuthContext - Logout called');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
    // Only navigate if we're not already on the login page
    if (window.location.pathname !== '/auth/login' && window.location.pathname !== '/login') {
      navigate('/auth/login');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);
      // Backend returns a success message and expects OTP verification before login
      return { message: response.data.message };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    console.log('AuthContext - Updating user:', { user: !!updatedUser });
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    loginWithOtp,
    register,
    logout,
    authenticateWithToken,
    updateUser,
    refreshAuth
  };

  console.log('AuthContext - Rendering with state:', { user: !!user, token: !!token, isLoading });
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};