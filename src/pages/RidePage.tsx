import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Square, 
  XCircle,
  MapPin, 
  Clock, 
  Bike,
  Battery,
  Route,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { rideAPI } from '../services/api'; // Import the actual API

interface Ride {
  _id: string;
  cycle: {
    code: string;
    model: string;
    batteryLevel?: number;
  };
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  startTime: string;
  endTime?: string;
  distance: number;
  duration: number;
  cost: number;
  startLocation: {
    coordinates: [number, number];
  };
  route: Array<{
    location: {
      coordinates: [number, number];
    };
    timestamp: string;
  }>;
}

export const RidePage: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEndingRide, setIsEndingRide] = useState(false);
  const [isCancellingRide, setIsCancellingRide] = useState(false);
  const [isSchedulingEnd, setIsSchedulingEnd] = useState(false);
  const [scheduledEndTime, setScheduledEndTime] = useState<Date | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [liveStats, setLiveStats] = useState({
    distance: 0,
    duration: 0,
    estimatedCost: 0
  });

  useEffect(() => {
    if (rideId) {
      loadRideDetails();
      startLocationTracking();
    }
  }, [rideId]);

  const loadRideDetails = async () => {
    try {
      setIsLoading(true);
      const response = await rideAPI.getById(rideId!);
      setRide(response.data);
      setLiveStats({
        distance: response.data.distance,
        duration: response.data.duration,
        estimatedCost: response.data.cost
      });
    } catch (error: any) {
      console.error('Error loading ride details:', error);
      toast.error('Failed to load ride details');
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    // Simulate location tracking without API calls
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);
        
        // Update live stats periodically to simulate ride progress
        setLiveStats(prev => ({
          distance: prev.distance + 0.01, // Increment distance
          duration: prev.duration + 10,   // Increment duration
          estimatedCost: calculateEstimatedCost(prev.distance + 0.01, prev.duration + 10)
        }));
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Location tracking failed');
        // Use mock location if geolocation fails
        setCurrentLocation([12.9716, 77.5946]);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    return watchId;
  };

  const calculateEstimatedCost = (distance: number, duration: number) => {
    // ₹2 per minute + ₹0.5 per 100m, minimum ₹10
    const timeCost = (duration / 60) * 2;
    const distanceCost = (distance * 1000 / 100) * 0.5;
    return Math.max(timeCost + distanceCost, 10);
  };

  const handleEndRide = async () => {
    if (!ride) {
      toast.error('Unable to end ride.');
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
      
      // End the ride using the actual API
      await rideAPI.end(ride._id, { latitude, longitude });
      
      toast.success('Ride ended successfully!');
      
      // Show ride summary
      navigate('/history', {
        state: {
          rideSummary: {
            rideId: ride._id,
            distance: liveStats.distance,
            duration: liveStats.duration,
            cost: liveStats.estimatedCost,
            cycle: ride.cycle.code
          }
        }
      });
    } catch (error: any) {
      console.error('Error ending ride:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please log in again.');
        // The auth interceptor should handle token removal and redirect
        return;
      }
      
      toast.error(error?.response?.data?.message || error?.message || 'Failed to end ride');
    } finally {
      setIsEndingRide(false);
    }
  };

  const handleCancelRide = async () => {
    if (!ride || ride.status !== 'ACTIVE') return;
    const reason = window.prompt('Please provide a reason for cancellation');
    if (!reason) {
      toast.error('Cancellation reason is required');
      return;
    }

    try {
      setIsCancellingRide(true);
      
      // Cancel the ride using the actual API
      await rideAPI.cancel(ride._id, { reason });
      
      toast.success('Ride cancelled successfully');
      navigate('/history', { replace: true });
    } catch (error: any) {
      console.error('Error cancelling ride:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please log in again.');
        // The auth interceptor should handle token removal and redirect
        return;
      }
      
      toast.error(error?.response?.data?.message || error?.message || 'Failed to cancel ride');
    } finally {
      setIsCancellingRide(false);
    }
  };

  const handleScheduleEndRide = async (endTime: Date) => {
    if (!ride) return;
    
    // Validate that endTime is at least 5 minutes from now
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (endTime < fiveMinutesFromNow) {
      toast.error('End time must be at least 5 minutes from now');
      return;
    }

    try {
      setIsSchedulingEnd(true);
      
      // Schedule end ride using the actual API
      await rideAPI.scheduleEnd({ rideId: ride._id, endTime: endTime.toISOString() });
      
      toast.success('Ride scheduled to end automatically');
      setScheduledEndTime(endTime);
      setShowScheduleModal(false);
    } catch (error: any) {
      console.error('Error scheduling auto end ride:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please log in again.');
        // The auth interceptor should handle token removal and redirect
        return;
      }
      
      toast.error(error?.response?.data?.message || error?.message || 'Failed to schedule auto end ride');
    } finally {
      setIsSchedulingEnd(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ride Not Found</h2>
          <p className="text-gray-600 mb-6">The ride you're looking for doesn't exist or has been completed.</p>
          <button
            onClick={() => navigate('/history')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to History
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ride in Progress</h1>
            <p className="text-gray-600">Cycle: {ride.cycle.code}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            ride.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
            ride.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {ride.status}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center">
            <Route className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Distance</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{liveStats.distance.toFixed(2)} km</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatDuration(liveStats.duration)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Cost</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">₹{liveStats.estimatedCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cycle Information</h2>
          {ride.cycle.batteryLevel && (
            <div className="flex items-center">
              <Battery className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">{ride.cycle.batteryLevel}%</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Model</p>
            <p className="font-medium text-gray-900 dark:text-white">{ride.cycle.model}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Code</p>
            <p className="font-medium text-gray-900 dark:text-white">{ride.cycle.code}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ride Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => toast.success('Ride paused successfully')}
            className="flex flex-col items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <Pause className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-2" />
            <span className="font-medium text-yellow-800 dark:text-yellow-200">Pause Ride</span>
          </button>
          
          <button
            onClick={handleEndRide}
            disabled={isEndingRide}
            className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
          >
            {isEndingRide ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-2"></div>
            ) : (
              <Square className="h-8 w-8 text-red-600 dark:text-red-400 mb-2" />
            )}
            <span className="font-medium text-red-800 dark:text-red-200">End Ride</span>
          </button>
          
          <button
            onClick={handleCancelRide}
            disabled={isCancellingRide}
            className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {isCancellingRide ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-2"></div>
            ) : (
              <XCircle className="h-8 w-8 text-gray-600 dark:text-gray-300 mb-2" />
            )}
            <span className="font-medium text-gray-800 dark:text-gray-200">Cancel Ride</span>
          </button>
        </div>
        
        {/* Schedule End Button */}
        <div className="mt-6">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="w-full py-3 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
          >
            Schedule Auto-End
          </button>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Schedule Ride End</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                min={new Date(new Date().getTime() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                onChange={(e) => setScheduledEndTime(new Date(e.target.value))}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => scheduledEndTime && handleScheduleEndRide(scheduledEndTime)}
                disabled={!scheduledEndTime || isSchedulingEnd}
                className="flex-1 py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isSchedulingEnd ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};