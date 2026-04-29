import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bike, 
  Home, 
  MapPin, 
  Clock, 
  LogOut, 
  Menu, 
  X, 
  User, 
  Wallet,
  Bell,
  Search,
  ChevronDown,
  Shield,
  Users,
  BarChart3,
  AlertCircle,
  Sun,
  Moon,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { AIChat } from './AIChat';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import { useTheme } from '../contexts/ThemeContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notificationCount, setNotificationCount] = useState(3); // Mock notification count

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    connectSocket(token);
    if (user?._id) {
      socket.emit('join', user._id);
    }
    return () => {
      disconnectSocket();
    };
  }, [user?._id]);

  const handleLogout = async () => {
    try {
      // Clear token from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Call logout from AuthContext
      await logout();
      
      // Disconnect socket
      disconnectSocket();
      
      toast.success('Logged out successfully');
      
      // Redirect to login page
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if logout fails, clear local data and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      toast.error('Logged out');
      navigate('/auth/login', { replace: true });
    }
  };

  // Build navigation based on user role
  const navigation = [];

  // USER role - Full navigation
  if (user?.role === 'USER') {
    navigation.push(
      { name: 'Home', href: '/user/dashboard', icon: Home, color: 'from-sky-500 to-sky-600 dark:from-sky-400 dark:to-sky-500' },
      { name: 'Cycles', href: '/user/cycles', icon: Bike, color: 'from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500' },
      { name: 'Scan QR', href: '/user/scan', icon: MapPin, color: 'from-cyan-500 to-cyan-600 dark:from-cyan-400 dark:to-cyan-500' },
      { name: 'History', href: '/user/history', icon: Clock, color: 'from-teal-500 to-teal-600 dark:from-teal-400 dark:to-teal-500' },
      { name: 'Issues', href: '/user/issues', icon: AlertCircle, color: 'from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500' }
    );
  }

  // MANAGER role - Only management pages
  if (user?.role === 'MANAGER') {
    navigation.push(
      { name: 'Dashboard', href: '/manager/dashboard', icon: Home, color: 'from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500' },
      { name: 'Cycles Management', href: '/manager/cycles-management', icon: Bike, color: 'from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500' },
      { name: 'Stations', href: '/manager/stations-monitoring', icon: MapPin, color: 'from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500' },
      { name: 'Rides Tracking', href: '/manager/rides-tracking', icon: Clock, color: 'from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500' },
      { name: 'Issues Reporting', href: '/manager/issues-reporting', icon: AlertCircle, color: 'from-rose-500 to-rose-600 dark:from-rose-400 dark:to-rose-500' }
    );
  }

  // ADMIN role - Full access with proper routing
  if (user?.role === 'ADMIN') {
    navigation.push(
      { name: 'Dashboard', href: '/admin', icon: Home, color: 'from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500' },
      { name: 'Cycles', href: '/admin/cycles', icon: Bike, color: 'from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500' },
      { name: 'Rides', href: '/admin/rides', icon: Clock, color: 'from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500' },
      { name: 'Users', href: '/admin/users', icon: Users, color: 'from-violet-500 to-purple-600 dark:from-violet-400 dark:to-purple-500' },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, color: 'from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500' }
    );
  }

  const isActive = (href: string) => {
    // Special handling for admin routes
    if (user?.role === 'ADMIN') {
      // For the main dashboard route, match exactly
      if (href === '/admin') {
        return location.pathname === '/admin' || location.pathname === '/admin/';
      }
      // For other admin routes, check if the current path starts with the href
      return location.pathname.startsWith(href);
    }
    
    // Special handling for manager routes
    if (user?.role === 'MANAGER') {
      return location.pathname.startsWith(href);
    }
    
    // For other roles, use the original logic
    return location.pathname === href || location.pathname.startsWith(href);
  };

  // Determine profile route based on user role
  const getProfileRoute = () => {
    if (user?.role === 'ADMIN') {
      return '/admin/profile';
    } else if (user?.role === 'MANAGER') {
      return '/manager/profile';
    } else {
      return '/user/profile';
    }
  };
  
  // Determine notifications route based on user role
  const getNotificationsRoute = () => {
    if (user?.role === 'ADMIN') {
      return '/admin/notifications';
    } else if (user?.role === 'MANAGER') {
      return '/manager/notifications';
    } else {
      return '/user/notifications';
    }
  };

  return (
    // Theme-aware app container
    <div className="h-screen lg:flex bg-app text-primary backdrop-blur-2xl theme-transition">

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 
        admin-glass-sidebar
        transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-purple-200 dark:border-sky-400/30 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500 p-2 rounded-xl shadow-lg glow-effect">
                <Bike className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 dark:from-sky-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                EcoRide+
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-purple-100 dark:text-sky-300 dark:hover:text-white dark:hover:bg-sky-500/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="mb-4">
              <h3 className="px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-sky-300">
                {user?.role === 'ADMIN' ? 'Admin Tools' : user?.role === 'MANAGER' ? 'Management Tools' : 'Main Menu'}
              </h3>
            </div>
            {navigation.map((item, index) => {
              const Icon = item.icon;
              
              return (
                <React.Fragment key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive(item.href)
                        ? 'bg-purple-500/10 text-slate-800 border border-purple-200 shadow-sm dark:bg-gradient-to-r dark:from-sky-500/20 dark:to-cyan-500/20 dark:text-white dark:border-sky-400/30'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-purple-100 dark:text-sky-200 dark:hover:text-white dark:hover:bg-sky-500/10'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.color} shadow-lg group-hover:shadow-xl transition-all duration-300 glow-effect flex-shrink-0`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-800">{item.name}</span>
                    {isActive(item.href) && (
                      <div className="ml-auto w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-sky-400 dark:to-cyan-400 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                </React.Fragment>
              );
            })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-purple-200 dark:border-sky-400/30 flex-shrink-0">
          <div className="rounded-xl p-4 admin-glass border border-purple-200 dark:border-sky-400/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-600 dark:text-sky-300 capitalize">
                  {user?.role?.toLowerCase() || 'user'}
                </p>
              </div>
            </div>
            
            {user?.role !== 'MANAGER' && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center justify-between text-xs bg-purple-50 dark:bg-sky-500/5 p-2 rounded-lg border border-purple-100 dark:border-sky-400/10">
                  <div className="flex items-center space-x-1">
                    <Wallet className="h-3 w-3 text-purple-500 dark:text-sky-400" />
                    <span className="text-slate-600 dark:text-sky-300">Wallet</span>
                  </div>
                  <span className="font-medium text-slate-800 dark:text-sky-200">₹{(user?.walletBalance ?? 0).toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs bg-green-50 dark:bg-green-500/5 p-2 rounded-lg border border-green-100 dark:border-green-400/10">
                  <div className="flex items-center space-x-1">
                    <Bike className="h-3 w-3 text-green-500 dark:text-green-400" />
                    <span className="text-slate-600 dark:text-green-300">Rides</span>
                  </div>
                  <span className="font-medium text-slate-800 dark:text-green-200">{0}</span>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2 mb-3">
              <Link to={getProfileRoute()} className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-purple-500/10 text-slate-800 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-all duration-200 border border-purple-200 dark:bg-gradient-to-r dark:from-sky-500/10 dark:to-sky-600/10 dark:text-sky-300 dark:hover:from-sky-500/20 dark:hover:to-sky-600/20 dark:border-sky-400/20">
                <User className="h-3 w-3" />
                <span>Profile</span>
              </Link>
                
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-500/10 text-slate-800 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all duration-200 border border-red-200 dark:bg-gradient-to-r dark:from-red-500/20 dark:to-red-600/20 dark:text-red-200 dark:hover:from-red-500/30 dark:hover:to-red-600/30 dark:border-red-400/30"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <div className="relative z-10 admin-glass-navbar text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-purple-100 dark:text-sky-300 dark:hover:text-white dark:hover:bg-sky-500/20 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="hidden sm:flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-600 dark:text-sky-400" />
                  <input
                    type="text"
                    placeholder="Search cycles, stations..."
                    className="pl-10 pr-4 py-2 bg-[var(--surface-strong)] border border-purple-200 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[color:rgba(108,99,255,0.4)] focus:border-purple-300 w-64 dark:bg-sky-500/10 dark:border-sky-400/30 dark:text-sky-200 dark:placeholder-sky-400 dark:focus:ring-sky-400/50 dark:focus:border-sky-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-[var(--color-text-primary-light)] hover:bg-[var(--color-bg-hover-light)] dark:text-[var(--color-text-primary-dark)] dark:hover:text-white dark:hover:bg-sky-500/20 transition-colors"
                aria-label="Toggle theme"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notifications */}
              <Link
                to={getNotificationsRoute()}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-purple-100 dark:text-sky-300 dark:hover:text-white dark:hover:bg-sky-500/20 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-400 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-purple-100 dark:text-sky-300 dark:hover:text-white dark:hover:bg-sky-500/20 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-800">{user?.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 
          admin-glass-strong m-6">
          {children}
        </main>

      </div>

      {/* AI Chat Component */}
      <AIChat />
    </div>
  );
};