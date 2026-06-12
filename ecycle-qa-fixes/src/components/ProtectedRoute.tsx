import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, isLoading, token, refreshAuth } = useAuth();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshDone, setRefreshDone] = useState(false);

  // If we have a token but no user yet, attempt a refresh — inside useEffect, not during render
  useEffect(() => {
    if (token && !user && !isLoading && !isRefreshing && !refreshDone) {
      setIsRefreshing(true);
      refreshAuth().finally(() => {
        setIsRefreshing(false);
        setRefreshDone(true);
      });
    }
  }, [token, user, isLoading, isRefreshing, refreshDone, refreshAuth]);

  // Show spinner while auth is initialising or we're refreshing
  if (isLoading || isRefreshing) {
    return (
      <LoadingSpinner 
        fullScreen 
        text="Checking authentication..." 
        size="lg" 
        color="blue"
      />
    );
  }

  // After a refresh attempt: if still no token → login
  if (!token) {
    if (location.pathname === '/auth/login' || location.pathname === '/login') {
      return <>{children}</>;
    }
    return (
      <Navigate 
        to="/auth/login" 
        state={{ from: location, redirectAfterLogin: location.pathname }} 
        replace 
      />
    );
  }

  // Token present but user still null after refresh attempt → login
  if (!user) {
    return (
      <Navigate 
        to="/auth/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="max-w-md w-full text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-red-200 dark:border-red-800">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Required role: <span className="font-semibold">{allowedRoles.join(' or ')}</span><br />
            Your role: <span className="font-semibold">{user.role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
