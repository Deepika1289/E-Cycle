import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  Bike, 
  CreditCard, 
  Filter,
  Calendar,
  Route,
  CheckCircle,
  XCircle,
  PlayCircle,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { rideAPI, paymentAPI, bookingAPI } from '../services/api';
import toast from 'react-hot-toast';

interface RideHistory {
  _id: string;
  cycle: {
    code: string;
    model: string;
  };
  status: string;
  startTime: string;
  endTime?: string;
  distance: number;
  duration: number;
  cost: number;
}

interface PaymentHistory {
  _id: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  createdAt: string;
  booking?: {
    cycle: {
      code: string;
    };
  };
}

interface BookingHistory {
  _id: string;
  cycle: {
    code: string;
    model: string;
  };
  status: string;
  startTime: string;
  estimatedCost: number;
  paymentStatus: string;
  createdAt: string;
}

export const HistoryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'rides' | 'payments' | 'bookings'>('rides');
  
  // Replace mock data with state variables
  const [rides, setRides] = useState<RideHistory[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [bookings, setBookings] = useState<BookingHistory[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Check if there's a ride summary from ride completion
  const rideSummary = location.state?.rideSummary;

  // Load data from APIs
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load rides
      const ridesResponse = await rideAPI.getAll({});
      setRides(ridesResponse.data?.rides || ridesResponse.data || []);
      
      // Load payments
      const paymentsResponse = await paymentAPI.getAll({});
      setPayments(paymentsResponse.data?.payments || paymentsResponse.data || []);
      
      // Load bookings
      const bookingsResponse = await bookingAPI.getAll({});
      setBookings(bookingsResponse.data?.bookings || bookingsResponse.data || []);
    } catch (error: any) {
      console.error('Error loading history data:', error);
      toast.error('Failed to load history data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ACTIVE':
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-orange-100 text-orange-800';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'ACTIVE':
      case 'CONFIRMED':
        return <PlayCircle className="h-4 w-4" />;
      case 'CANCELLED':
      case 'FAILED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Functions that redirect to respective pages instead of performing API operations
  const handleEndRide = (rideId: string) => {
    // Redirect to ride ending page or home
    navigate('/user/dashboard');
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      // Cancel the booking via API
      await bookingAPI.cancel(bookingId);
      toast.success('Booking cancelled successfully!');
      // Reload data to reflect changes
      loadData();
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handleStartRide = (bookingId: string) => {
    // Redirect to ride start page
    navigate(`/user/ride/${bookingId}`);
  };

  const renderRideItem = (ride: RideHistory) => (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-full ${getStatusColor(ride.status)}`}>
          {getStatusIcon(ride.status)}
        </div>
        <div>
          <p className="font-semibold">Ride on {new Date(ride.startTime).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500">
            {formatDuration(ride.duration)} - {getStatusText(ride.status)}
          </p>
        </div>
      </div>
      <div>
        {ride.status.toUpperCase() === 'ACTIVE' && (
          <button
            onClick={() => handleEndRide(ride._id)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            End Ride
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Ride Summary Modal (if just completed a ride) */}
      {rideSummary && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-green-900 dark:text-green-300 mb-4">Ride Completed!</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-green-700 dark:text-green-400">Cycle</p>
              <p className="font-bold text-green-900 dark:text-green-300">{rideSummary.cycle}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-700 dark:text-green-400">Distance</p>
              <p className="font-bold text-green-900 dark:text-green-300">{rideSummary.distance.toFixed(2)}km</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-700 dark:text-green-400">Duration</p>
              <p className="font-bold text-green-900 dark:text-green-300">{formatDuration(rideSummary.duration)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-700 dark:text-green-400">Total Cost</p>
              <p className="font-bold text-green-900 dark:text-green-300">₹{rideSummary.cost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">History</h1>
        <p className="text-gray-600 dark:text-gray-300">View your rides, payments, and bookings</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'rides', label: 'Rides', icon: Bike },
              { key: 'payments', label: 'Payments', icon: CreditCard },
              { key: 'bookings', label: 'Bookings', icon: Calendar },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              {activeTab === 'rides' && (
                <>
                  <option value="COMPLETED">Completed</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CANCELLED">Cancelled</option>
                </>
              )}
              {activeTab === 'payments' && (
                <>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </>
              )}
              {activeTab === 'bookings' && (
                <>
                  <option value="COMPLETED">Completed</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                </>
              )}
            </select>
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />

          {(statusFilter || dateFilter) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setDateFilter('');
              }}
              className="px-3 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Rides Tab */}
        {activeTab === 'rides' && (
          <>
            {rides.length > 0 ? (
              rides.map((ride) => (
                <div key={ride._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Bike className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{ride.cycle.code}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{ride.cycle.model}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(ride.status)} dark:bg-opacity-20`}>
                        {getStatusIcon(ride.status)}
                        <span>{ride.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Start Time</p>
                      <p className="font-medium text-gray-900 dark:text-white">{format(new Date(ride.startTime), 'MMM dd, HH:mm')}</p>
                    </div>
                    
                    {ride.endTime && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">End Time</p>
                        <p className="font-medium text-gray-900 dark:text-white">{format(new Date(ride.endTime), 'MMM dd, HH:mm')}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Distance</p>
                      <div className="flex items-center space-x-1">
                        <Route className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{ride.distance.toFixed(2)}km</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{formatDuration(ride.duration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">₹{ride.cost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bike className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No rides yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Start your first ride to see it here</p>
                <Link
                  to="/user/cycles"
                  className="inline-block bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Find Cycles
                </Link>
              </div>
            )}
          </>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <>
            {payments.length > 0 ? (
              payments.map((payment) => (
                <div key={payment._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {payment.type.replace('_', ' ')} - {payment.method}
                        </h3>
                        {payment.booking && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">Cycle: {payment.booking.cycle.code}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(payment.status)} dark:bg-opacity-20`}>
                        {getStatusIcon(payment.status)}
                        <span>{payment.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        payment.type === 'WALLET_TOPUP' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        {payment.type === 'WALLET_TOPUP' ? '+' : ''}₹{payment.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No payments yet</h3>
                <p className="text-gray-600 dark:text-gray-300">Your payment history will appear here</p>
              </div>
            )}
          </>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                        <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{booking.cycle.code}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{booking.cycle.model}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(booking.status)} dark:bg-opacity-20`}>
                        {getStatusIcon(booking.status)}
                        <span>{booking.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Booking Time</p>
                      <p className="font-medium text-gray-900 dark:text-white">{format(new Date(booking.createdAt), 'MMM dd, HH:mm')}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Start Time</p>
                      <p className="font-medium text-gray-900 dark:text-white">{format(new Date(booking.startTime), 'MMM dd, HH:mm')}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.paymentStatus)} dark:bg-opacity-20`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                    <div>
                      {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 text-sm font-medium"
                          >
                            Cancel Booking
                          </button>
                          
                          {/* Add Start Ride button for confirmed bookings */}
                          {booking.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleStartRide(booking._id)}
                              className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 text-sm font-medium flex items-center"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start Ride
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Cost</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">₹{booking.estimatedCost.toFixed(2)}</p>
                    </div>
                  </div>

                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bookings yet</h3>
                <p className="text-gray-600 dark:text-gray-300">Your booking history will appear here</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};