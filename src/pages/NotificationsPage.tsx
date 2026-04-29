import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, Bike, MapPin, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  type: 'RIDE' | 'BOOKING' | 'PAYMENT' | 'SYSTEM' | 'ISSUE';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      _id: '1',
      type: 'RIDE',
      title: 'Ride Completed',
      message: 'Your ride has been completed successfully. Total duration: 45 minutes.',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: '2',
      type: 'PAYMENT',
      title: 'Payment Successful',
      message: 'Your payment of ₹50.00 has been processed successfully.',
      read: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      _id: '3',
      type: 'BOOKING',
      title: 'Booking Confirmed',
      message: 'Your cycle booking has been confirmed. Cycle Code: CYC-001',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: '4',
      type: 'SYSTEM',
      title: 'New Feature Available',
      message: 'Check out our new AI-powered cycle recommendations!',
      read: true,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' ? true : !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, read: true } : n)
    );
    toast.success('Marked as read');
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    toast.success('Notification deleted');
  };

  const handleDeleteAll = () => {
    setNotifications([]);
    toast.success('All notifications deleted');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'RIDE':
        return <Bike className="h-5 w-5" />;
      case 'BOOKING':
        return <MapPin className="h-5 w-5" />;
      case 'PAYMENT':
        return <Info className="h-5 w-5" />;
      case 'ISSUE':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'RIDE':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'BOOKING':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'PAYMENT':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'ISSUE':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="relative">
            <Bell className="h-8 w-8 text-blue-600 dark:text-purple-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 dark:bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 dark:bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
            >
              <Check className="h-4 w-4" />
              <span>Mark all as read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <Bell className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'unread' ? 'All caught up!' : 'You have no notifications at the moment'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border transition-all ${
                notification.read
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-blue-200 dark:border-purple-500 bg-blue-50/50 dark:bg-purple-900/10'
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`p-3 rounded-full ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="ml-2 w-2 h-2 bg-blue-600 dark:bg-purple-500 rounded-full flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                    <span>{formatTime(notification.createdAt)}</span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      {notification.type}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
