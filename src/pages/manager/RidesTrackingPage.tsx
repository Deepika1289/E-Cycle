import React, { useState, useEffect } from 'react';
import { Route, RefreshCw } from 'lucide-react';
import { rideAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Ride {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  cycle: {
    _id: string;
    code: string;
    model: string;
  };
  startStation: {
    _id: string;
    name: string;
  };
  endStation?: {
    _id: string;
    name: string;
  };
  startTime: string;
  endTime?: string;
  duration?: number;
  distance?: number;
  fare?: number;
  status: string;
}

const RidesTrackingPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([
    // Active rides
    {
      _id: 'ride_001',
      user: {
        _id: 'user_001',
        name: 'Abhi ',
        email: 'abhi.patel@example.com'
      },
      cycle: {
        _id: 'cycle_001',
        code: 'CYC 001',
        model: 'Model X-200'
      },
      startStation: {
        _id: 'station_001',
        name: 'Main Gate'
      },
      startTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      status: 'ACTIVE'
    },
    {
      _id: 'ride_002',
      user: {
        _id: 'user_002',
        name: 'Harini',
        email: 'harini.s@example.com'
      },
      cycle: {
        _id: 'cycle_002',
        code: 'CYC 002',
        model: 'Model Y-150'
      },
      startStation: {
        _id: 'station_002',
        name: 'Library'
      },
      startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      status: 'ACTIVE'
    },
    // Recently completed rides
    {
      _id: 'ride_003',
      user: {
        _id: 'user_003',
        name: 'Sai ',
        email: 'sai.kumar@example.com'
      },
      cycle: {
        _id: 'cycle_003',
        code: 'CYC 003',
        model: 'Model Z-300'
      },
      startStation: {
        _id: 'station_003',
        name: 'Canteen'
      },
      endStation: {
        _id: 'station_004',
        name: 'Main Gate'
      },
      startTime: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
      endTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      duration: 30,
      distance: 4.2,
      fare: 25.50,
      status: 'COMPLETED'
    },
    {
      _id: 'ride_004',
      user: {
        _id: 'user_004',
        name: 'Mahesh',
        email: 'mahesh.r@example.com'
      },
      cycle: {
        _id: 'cycle_004',
        code: 'CYC 004',
        model: 'Model X-200'
      },
      startStation: {
        _id: 'station_005',
        name: 'Library'
      },
      endStation: {
        _id: 'station_006',
        name: 'Canteen'
      },
      startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      endTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      duration: 60,
      distance: 8.7,
      fare: 42.00,
      status: 'COMPLETED'
    },
    // Morning rides
    {
      _id: 'ride_005',
      user: {
        _id: 'user_005',
        name: 'Priya ',
        email: 'priya.i@example.com'
      },
      cycle: {
        _id: 'cycle_005',
        code: 'CYC 005',
        model: 'Model Y-150'
      },
      startStation: {
        _id: 'station_007',
        name: 'Main Gate'
      },
      endStation: {
        _id: 'station_008',
        name: 'Library'
      },
      startTime: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      endTime: new Date(Date.now() - 8100000).toISOString(), // 2.25 hours ago
      duration: 25,
      distance: 3.8,
      fare: 19.75,
      status: 'COMPLETED'
    },
    // Longer rides
    {
      _id: 'ride_006',
      user: {
        _id: 'user_006',
        name: 'Rohan ',
        email: 'rohan.m@example.com'
      },
      cycle: {
        _id: 'cycle_006',
        code: 'CYC 006',
        model: 'Model Z-300'
      },
      startStation: {
        _id: 'station_009',
        name: 'Canteen'
      },
      endStation: {
        _id: 'station_010',
        name: 'Main Gate'
      },
      startTime: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
      endTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      duration: 120,
      distance: 15.3,
      fare: 76.50,
      status: 'COMPLETED'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setIsLoading(true);
      const response = await rideAPI.getAll({ limit: 100 });
      console.log('Rides response:', response);
      // Only update if we have real data, otherwise keep demo data
      const ridesData = response.data?.rides || response.data || [];
      if (ridesData.length > 0) {
        setRides(ridesData);
      }
    } catch (error: any) {
      console.error('Error loading rides:', error);
      toast.error('Failed to load rides: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      // Keep demo data on error
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'BOOKED':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'IN_USE':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'MAINTENANCE':
      case 'OPEN':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'INACTIVE':
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Loading rides...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Rides</h2>
        <button
          onClick={loadRides}
          className="flex items-center space-x-2 bg-blue-600 dark:bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-purple-700 transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="text-left text-xs font-medium text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              <th className="px-3 py-2">Ride ID</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Cycle</th>
              <th className="px-3 py-2">Start</th>
              <th className="px-3 py-2">End</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Start Time</th>
              <th className="px-3 py-2">End Time</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">Distance</th>
              <th className="px-3 py-2">Fare</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rides.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-sm text-slate-600 dark:text-gray-400">No rides found</td>
              </tr>
            ) : (
              rides.map((ride) => (
                <tr key={ride._id} className="text-sm">
                  <td className="px-3 py-2 text-slate-800 dark:text-white">{ride._id}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{ride.user?.name || ride.user?._id}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{ride.cycle?.code} ({ride.cycle?.model})</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{ride.startStation?.name}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{ride.endStation?.name || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>{ride.status}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{new Date(ride.startTime).toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{ride.endTime ? new Date(ride.endTime).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{ride.duration ? `${ride.duration} min` : '-'}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{ride.distance ? `${ride.distance} km` : '-'}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{ride.fare ? `₹${ride.fare}` : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RidesTrackingPage;