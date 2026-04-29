import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bike, 
  Clock, 
  MapPin, 
  CreditCard, 
  TrendingUp, 
  Battery,
  Plus,
  ArrowRight,
  Square,
  XCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { rideAPI, aiAPI, paymentAPI, bookingAPI, cycleAPI } from '../services/api';
import toast from 'react-hot-toast';
import { AIRecommendations } from '../components/AIRecommendations';

interface DashboardStats {
  totalRides: number;
  totalDistance: number;
  totalSpent: number;
  activeBookings: number;
  availableCycles: number;
}

interface RecentActivity {
  id: string;
  type: 'ride' | 'payment' | 'booking';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

// Add this new interface for active rides
interface ActiveRide {
  _id: string;
  cycle: {
    code: string;
    model: string;
    batteryLevel?: number;
  };
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  startTime: string;
  distance: number;
  duration: number;
  cost: number;
}

export const DashboardPage: React.FC = () => {
  const { user, updateUser, refreshAuth } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRides: 0,
    totalDistance: 0,
    totalSpent: 0,
    activeBookings: 0,
    availableCycles: 0
  });
  // Add activeRide state
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEndingRide, setIsEndingRide] = useState(false);
  const [isCancellingRide, setIsCancellingRide] = useState(false); // Add this state
  const [topupAmount, setTopupAmount] = useState(100);
  const [isTopingUp, setIsTopingUp] = useState(false);

  useEffect(() => {
    // Refresh authentication when dashboard loads
    refreshAuth().then(() => {
      loadDashboardData();
    });
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get user location for fetching nearby available cycles
      let userLocation: [number, number] = [28.6667, 77.2167]; // Default location
      
      // Try to get actual user location
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          userLocation = [position.coords.latitude, position.coords.longitude];
        } catch (error) {
          console.warn('Could not get user location:', error);
        }
      }

      // Load user stats and recent activity
      const [ridesResponse, paymentsResponse, bookingsResponse, cyclesResponse] = await Promise.all([
        rideAPI.getAll({ limit: 10 }),
        paymentAPI.getAll({ limit: 5 }),
        bookingAPI.getAll({ limit: 5 }),
        cycleAPI.getAll({ 
          lat: userLocation[0], 
          lng: userLocation[1], 
          radius: 5, 
          status: 'AVAILABLE' 
        })
      ]);

      const rides = ridesResponse.data.rides;
      const payments = paymentsResponse.data.payments;
      const bookings = bookingsResponse.data.bookings;
      const availableCycles = Array.isArray(cyclesResponse.data) ? cyclesResponse.data.length : 
                             cyclesResponse.data.cycles ? cyclesResponse.data.cycles.length : 0;

      // Find active ride
      const activeRide = rides.find((ride: any) => ride.status === 'ACTIVE');
      setActiveRide(activeRide || null);

      // Calculate stats
      const completedRides = rides.filter((ride: any) => ride.status === 'COMPLETED');
      setStats({
        totalRides: completedRides.length,
        totalDistance: completedRides.reduce((acc: number, ride: any) => acc + ride.distance, 0),
        totalSpent: payments.filter((p: any) => p.type === 'RIDE' && p.status === 'COMPLETED')
          .reduce((acc: number, payment: any) => acc + payment.amount, 0),
        activeBookings: bookings.filter((b: any) => ['PENDING', 'CONFIRMED'].includes(b.status)).length,
        availableCycles: availableCycles
      });

      // Prepare recent activity
      const activities: RecentActivity[] = [
        ...rides.slice(0, 3).map((ride: any) => ({
          id: ride._id,
          type: 'ride' as const,
          title: ride.status === 'COMPLETED' ? 'Ride Completed' : 'Ride in Progress',
          description: `${ride.cycle.code} • ${ride.distance.toFixed(1)}km`,
          timestamp: ride.createdAt,
          amount: ride.cost
        })),
        ...payments.slice(0, 2).map((payment: any) => ({
          id: payment._id,
          type: 'payment' as const,
          title: payment.type === 'WALLET_TOPUP' ? 'Wallet Topped Up' : 'Payment Made',
          description: `${payment.method} • ${payment.status}`,
          timestamp: payment.createdAt,
          amount: payment.amount
        }))
      ];

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 5));

      // AI recommendations are now handled by the AIRecommendations component

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndRide = async () => {
    if (!activeRide) {
      toast.error('No active ride found');
      return;
    }

    const confirmEnd = window.confirm('Are you sure you want to end this ride?');
    if (!confirmEnd) {
      return;
    }

    try {
      setIsEndingRide(true);
      
      // Get current location required by end ride API
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      // End the ride
      await rideAPI.end(activeRide._id, { latitude, longitude });
      
      toast.success('Ride ended successfully!');
      
      // Refresh dashboard data
      loadDashboardData();
    } catch (error: any) {
      console.error('Error ending ride:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.log('handleEndRide - Authentication error detected');
        toast.error('Authentication expired. Please log in again.');
        // The auth interceptor should handle token removal and redirect
        return;
      }
      
      toast.error(error?.response?.data?.message || error?.message || 'Failed to end ride');
    } finally {
      setIsEndingRide(false);
    }
  };

  // Add the handleCancelRide function
  const handleCancelRide = async () => {
    if (!activeRide) {
      toast.error('No active ride found');
      return;
    }

    const reason = window.prompt('Please provide a reason for cancellation:');
    if (!reason) {
      toast.error('Cancellation reason is required');
      return;
    }

    try {
      setIsCancellingRide(true);
      
      // Cancel the ride using the actual API
      await rideAPI.cancel(activeRide._id, { reason });
      
      toast.success('Ride cancelled successfully!');
      
      // Refresh dashboard data
      loadDashboardData();
    } catch (error: any) {
      console.error('Error cancelling ride:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.log('handleCancelRide - Authentication error detected');
        toast.error('Authentication expired. Please log in again.');
        // The auth interceptor should handle token removal and redirect
        return;
      }
      
      toast.error(error?.response?.data?.message || error?.message || 'Failed to cancel ride');
    } finally {
      setIsCancellingRide(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleWalletTopup = async () => {
    if (topupAmount < 10 || topupAmount > 10000) {
      toast.error('Amount must be between ₹10 and ₹10,000');
      return;
    }

    try {
      setIsTopingUp(true);
      
      const response = await paymentAPI.create({
        type: 'WALLET_TOPUP',
        method: 'UPI',
        amount: topupAmount
      });

      // Simulate payment confirmation (in real app, user would pay via UPI)
      await paymentAPI.confirm(response.data.payment._id);

      // Update user wallet balance
      if (user) {
        updateUser({
          ...user,
          walletBalance: user.walletBalance + topupAmount
        });
      }

      toast.success(`Wallet topped up with ₹${topupAmount}!`);
      setTopupAmount(100);
      loadDashboardData(); // Refresh dashboard
    } catch (error) {
      toast.error('Failed to top up wallet');
    } finally {
      setIsTopingUp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-sky-600 dark:from-purple-600 dark:to-indigo-600 rounded-xl p-6 text-white shadow-lg dark:shadow-glow">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-blue-100 dark:text-purple-200">Ready for your next ride? Check out personalized recommendations below.</p>
      </div>

      {/* Active Ride Alert */}
      {activeRide && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Bike className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900 dark:text-red-300">Active Ride in Progress</h3>
                <p className="text-red-700 dark:text-red-300">
                  Cycle: {activeRide.cycle.code} • Distance: {activeRide.distance.toFixed(2)}km • Duration: {formatDuration(activeRide.duration)}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCancelRide}
                disabled={isCancellingRide}
                className="px-4 py-3 bg-gray-600 dark:bg-gray-500 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 flex items-center gap-2"
              >
                <XCircle size={20} />
                {isCancellingRide ? 'Cancelling...' : 'Cancel Ride'}
              </button>
              <button
                onClick={handleEndRide}
                disabled={isEndingRide}
                className="px-6 py-3 bg-red-600 dark:bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-red-400 dark:disabled:bg-red-700 flex items-center gap-2"
              >
                <Square size={20} />
                {isEndingRide ? 'Ending Ride...' : 'End Ride'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-indigo-200">Total Rides</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRides}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Bike className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-indigo-200">Distance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDistance.toFixed(1)}km</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-indigo-200">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalSpent.toFixed(0)}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-indigo-200">Active Bookings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeBookings}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-indigo-200">Available Cycles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.availableCycles}</p>
            </div>
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-full">
              <Bike className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Wallet Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wallet Balance</h3>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-green-600 dark:text-green-300">₹{user?.walletBalance.toFixed(2)}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Top-up Amount
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter amount"
                  />
                  <button
                    onClick={handleWalletTopup}
                    disabled={isTopingUp}
                    className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-green-400 dark:disabled:bg-green-700 transition-colors"
                  >
                    {isTopingUp ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/user/scan"
                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-200 dark:hover:text-blue-200 transition-colors"
              >
                <span className="font-medium">Scan QR Code</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <Link
                to="/user/cycles"
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <span className="font-medium">Find Cycles</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <Link
                to="/user/history"
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="font-medium">View History</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 border border-purple-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">AI Recommendations</h3>
                  <p className="text-sm text-slate-600 dark:text-indigo-200">Smart suggestions based on your location</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="p-2 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-gray-700 dark:to-gray-800 text-purple-600 dark:text-purple-300 rounded-lg hover:from-purple-200 hover:to-indigo-200 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-200"
              >
                <Zap className="h-4 w-4" />
              </button>
            </div>
            
            <AIRecommendations />
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'ride' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : activity.type === 'payment'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                    }`}>
                      {activity.type === 'ride' && <Bike className="h-4 w-4" />}
                      {activity.type === 'payment' && <CreditCard className="h-4 w-4" />}
                      {activity.type === 'booking' && <Clock className="h-4 w-4" />}
                    </div>
                  
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{activity.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>

                    {activity.amount && (
                      <div className="text-right">
                        <p className={`font-medium ${
                          activity.type === 'payment' && activity.title.includes('Topped Up')
                            ? 'text-green-600 dark:text-green-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {activity.type === 'payment' && activity.title.includes('Topped Up') ? '+' : ''}₹{activity.amount.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
                <Link
                  to="/user/cycles"
                  className="inline-block mt-2 text-blue-600 dark:text-purple-400 hover:text-blue-700 dark:hover:text-purple-300 font-medium"
                >
                  Book your first ride
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};