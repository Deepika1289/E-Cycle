import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bike, 
  MapPin, 
  AlertCircle, 
  Route,
  Home,
  X,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isActive = (path: string) => {
    // For manager routes, we need to check if the current path starts with the manager base path
    if (path.startsWith('/manager')) {
      return location.pathname.startsWith(path);
    }
    return location.pathname.includes(path);
  };

  const navSections = [
    {
      id: 'rides',
      title: 'Rides Tracking',
      icon: <Route size={20} />,
      path: '/manager/rides-tracking'
    },
    {
      id: 'stations',
      title: 'Stations Monitoring',
      icon: <MapPin size={20} />,
      path: '/manager/stations-monitoring'
    },
    {
      id: 'cycles',
      title: 'Cycles Management',
      icon: <Bike size={20} />,
      path: '/manager/cycles-management',
      exact: true
    },
    {
      id: 'issues',
      title: 'Issues Reporting',
      icon: <AlertCircle size={20} />,
      path: '/manager/issues-reporting'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Expand button shown when sidebar is collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed left-0 top-16 z-40 p-2 rounded-r-lg bg-[var(--surface)] dark:bg-[var(--surface)] border-r border-b border-t border-purple-200 dark:border-sky-400/30 backdrop-blur-xl md:flex hidden"
          aria-label="Expand sidebar"
        >
          <X size={20} className="rotate-180" />
        </button>
      )}
      
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 
          bg-[var(--surface)] dark:bg-[var(--surface)] 
          backdrop-blur-xl border-r border-purple-200 dark:border-sky-400/30 
          transform transition-transform duration-300 ease-in-out ${isCollapsed ? '-translate-x-full' : 'translate-x-0'} lg:relative lg:translate-x-0 flex-col shadow-lg hidden md:flex`}
        role="navigation"
        aria-label="Main Navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-purple-200 dark:border-sky-400/30 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500 p-2 rounded-xl shadow-lg glow-effect">
                <Bike className="h-6 w-6 text-white" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 dark:from-sky-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  EcoRide+
                </span>
              )}
            </div>
            <button 
              onClick={() => setIsCollapsed(true)} 
              className="p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-purple-100 dark:text-sky-300 dark:hover:text-white dark:hover:bg-sky-500/20 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="mb-4">
              <h3 className="px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-sky-300">
                Management Tools
              </h3>
            </div>
            <ul className="space-y-2">
              {navSections.map((section) => (
                <li key={section.id}>
                  <Link
                    to={section.path}
                    className={`flex items-center p-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive(section.path) && (section.exact ? location.pathname === section.path : true)
                        ? 'bg-purple-500/10 text-slate-800 border border-purple-200 shadow-sm dark:bg-gradient-to-r dark:from-sky-500/20 dark:to-cyan-500/20 dark:text-white dark:border-sky-400/30'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-purple-100 dark:text-sky-200 dark:hover:text-white dark:hover:bg-sky-500/10'
                    }`}
                    aria-current={
                      isActive(section.path) && (section.exact ? location.pathname === section.path : true)
                        ? 'page'
                        : undefined
                    }
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${section.id === 'dashboard' ? 'from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500' : section.id === 'cycles' ? 'from-green-500 to-green-600 dark:from-green-400 dark:to-green-500' : section.id === 'rides' ? 'from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500' : section.id === 'stations' ? 'from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500' : section.id === 'issues' ? 'from-red-500 to-red-600 dark:from-red-400 dark:to-red-500' : 'from-sky-500 to-sky-600 dark:from-sky-400 dark:to-sky-500'} shadow-lg group-hover:shadow-xl transition-all duration-300 glow-effect flex-shrink-0`}>
                      {section.icon}
                    </div>
                    {!isCollapsed && <span className="ml-3 text-slate-800">{section.title}</span>}
                    {!isCollapsed && isActive(section.path) && (
                      <div className="ml-auto w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-sky-400 dark:to-cyan-400 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-purple-200 dark:border-sky-400/30 flex-shrink-0">
            <div className="rounded-xl p-4 border bg-[var(--surface)] border-purple-200 dark:bg-gradient-to-r dark:from-sky-500/10 dark:to-cyan-500/10 dark:border-sky-400/20">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <Bike className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                    {user?.name || 'Manager'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-sky-300 capitalize">
                    {user?.role?.toLowerCase() || 'manager'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Link to="/profile" className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-purple-500/10 text-slate-800 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-all duration-200 border border-purple-200 dark:bg-gradient-to-r dark:from-sky-500/10 dark:to-sky-600/10 dark:text-sky-300 dark:hover:from-sky-500/20 dark:hover:to-sky-600/20 dark:border-sky-400/20">
                  <Bike className="h-3 w-3" />
                  <span>Profile</span>
                </Link>
              </div>
              
              <div className="flex space-x-2 mt-2">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-red-500/10 text-slate-800 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-all duration-200 border border-red-200 dark:bg-gradient-to-r dark:from-red-500/20 dark:to-red-600/20 dark:text-red-200 dark:hover:from-red-500/30 dark:hover:to-red-600/30 dark:border-red-400/30"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;