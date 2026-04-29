import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings, HelpCircle, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const notificationsMock = [
  { id: 1, message: 'New ride completed at Station Alpha', read: false, time: '5 min ago', type: 'ride' },
  { id: 2, message: 'Cycle #B2045 maintenance due', read: false, time: '30 min ago', type: 'maintenance' },
  { id: 3, message: 'Station Gamma offline alert', read: true, time: '2 hours ago', type: 'station' },
  { id: 4, message: 'New issue reported: Broken lock', read: true, time: '1 day ago', type: 'issue' },
];

interface TopBarProps {
}

const TopBar: React.FC<TopBarProps> = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(notificationsMock);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const { theme, toggleTheme } = useTheme();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'ride': return <Bell className="text-blue-500" size={16} />;
      case 'maintenance': return <Settings className="text-yellow-500" size={16} />;
      case 'station': return <Bell className="text-red-500" size={16} />;
      case 'issue': return <HelpCircle className="text-purple-500" size={16} />;
      default: return <Bell className="text-gray-500" size={16} />;
    }
  };

  return (
    <header className="flex justify-between items-center bg-white p-4 shadow" role="banner">
      <div></div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-slate-800"
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            aria-haspopup="true"
            aria-expanded={showNotifications}
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full" aria-hidden="true">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded shadow-lg z-50"
              role="menu"
              aria-orientation="vertical"
            >
              <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                    aria-label="Mark all as read"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-600">No notifications</div>
                ) : (
                  <ul>
                    {notifications.map(notification => (
                      <li key={notification.id}>
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 flex items-start ${!notification.read ? 'bg-blue-50' : ''}`}
                          aria-label={`${notification.message}${!notification.read ? ', unread' : ''}`}
                        >
                          <div className="mr-3 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">{notification.time}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="p-2 border-t border-gray-200 text-center">
                <Link 
                  to="/manager?tab=notifications" 
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button - Moved to be beside notifications */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-[var(--color-bg-sidebar-light)] dark:bg-[var(--color-bg-sidebar-dark)] text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)] hover:bg-[var(--color-bg-hover-light)] dark:hover:bg-[var(--color-bg-hover-dark)] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

export default TopBar;