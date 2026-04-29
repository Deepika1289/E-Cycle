import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bike, MapPin, Battery, Users, RefreshCw, TrendingUp, Clock, Star, Sparkles } from 'lucide-react';
import { stationAPI, cycleAPI } from '../services/api';
import { socket } from '../services/socket';
import toast from 'react-hot-toast';
import { AIRecommendations } from '../components/AIRecommendations';

interface Station {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
  capacity: number;
  availableCycles: number;
  status: string;
  facilities: string[];
}

interface Cycle {
  _id: string;
  code: string;
  model: string;
  status: string;
  batteryLevel?: number;
  location: {
    coordinates: [number, number];
  };
  station?: {
    _id: string;
    name: string;
  };
}

export const HomePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect role-based users to their dashboards
  useEffect(() => {
    if (authLoading) return; // wait for auth initialization
    if (!user) return; // not logged in

    // Show a brief toast so the user knows they're being forwarded
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (user.role === 'ADMIN') {
      const id = toast.loading('Redirecting to admin dashboard...');
      timeout = setTimeout(() => {
        toast.success('Redirected to admin dashboard', { id });
        navigate('/admin');
      }, 900);
    } else if (user.role === 'MANAGER') {
      const id = toast.loading('Redirecting to manager dashboard...');
      timeout = setTimeout(() => {
        toast.success('Redirected to manager dashboard', { id });
        navigate('/manager');
      }, 900);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [user, authLoading, navigate]);


  const [stations, setStations] = useState<Station[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>([0, 0]); // Will be updated with actual user location
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('HomePage mounted');
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          loadNearbyData(latitude, longitude);
        },
        (error) => {
          console.warn('Could not get location:', error);
          loadNearbyData(userLocation[0], userLocation[1]);
        }
      );
    } else {
      loadNearbyData(userLocation[0], userLocation[1]);
    }
    // Subscribe to realtime updates
    const onCycleChanged = () => loadNearbyData(userLocation[0], userLocation[1]);
    const onLocationUpdate = () => loadNearbyData(userLocation[0], userLocation[1]);
    socket.on('cycleStatusChanged', onCycleChanged);
    socket.on('locationUpdate', onLocationUpdate);
    return () => {
      socket.off('cycleStatusChanged', onCycleChanged);
      socket.off('locationUpdate', onLocationUpdate);
    };
  }, []);

  const loadNearbyData = async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      
      // Load stations and cycles in parallel
      const [stationsResponse, cyclesResponse] = await Promise.all([
        stationAPI.getAll({ lat, lng, radius: 5 }), // 5km radius
        cycleAPI.getAll({ lat, lng, radius: 2, status: 'AVAILABLE' }) // 2km radius for available cycles
      ]);

      // Ensure arrays regardless of paginated or plain responses
      const stationsData = Array.isArray(stationsResponse.data)
        ? stationsResponse.data
        : (stationsResponse.data?.stations || stationsResponse.data || []);
      const cyclesData = Array.isArray(cyclesResponse.data)
        ? cyclesResponse.data
        : (cyclesResponse.data?.cycles || cyclesResponse.data || []);

      setStations(stationsData);
      setCycles(cyclesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 animated-bg">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-6"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 gradient-text">Loading...</h2>
          <p className="text-sky-200">Please wait... ✨</p>
        </div>
      </div>
    );
  }

  // const avgBattery = Math.round(cycles.reduce((acc, cycle) => acc + (cycle.batteryLevel || 0), 0) / cycles.length || 0);

  return (
    <div className="bg-gradient-to-br from-white-900 via-blue-900 to-cyan-900 animated-bg relative overflow-hidden p-6">
      {/* Welcome Header */}
      <div className="mb-8 relative z-10">
        <div className="bg-gradient-to-r from-sky-600/80 via-blue-600/80 to-cyan-600/80 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden glow-effect backdrop-blur-sm border border-sky-400/30">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-12 left-12 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-28 left-28 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="h-6 w-6 text-sky-300 animate-pulse" />
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full text-white">Welcome Back!</span>
              </div>
              <h1 className="text-4xl font-bold mb-2 gradient-text-yellow">EcoRide+ Campus! 🚴‍♂️</h1>
              <p className="text-sky-100 dark:text-sky-50 text-lg">Explore your campus with smart, sustainable transportation</p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative glow-effect">
                <Bike className="h-12 w-12 text-white icon-bounce" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-sky-400 to-cyan-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-xs font-bold text-white">✨</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
        <div className="bg-gradient-to-br from-pink-500/20 to-sky-600/20 rounded-3xl p-6 shadow-xl border border-sky-400/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group card-hover backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-sky-100 dark:text-sky-50 mb-1">Nearby Stations</p>
              <p className="text-3xl font-bold text-sky-400">10</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 glow-effect">
              <MapPin className="h-6 w-6 text-white icon-bounce" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-sky-200 dark:text-sky-100">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>All Active</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl p-6 shadow-xl border border-blue-400/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group card-hover backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100 dark:text-blue-50 mb-1">Available Cycles</p>
              <p className="text-3xl font-bold text-blue-400">23</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 glow-effect">
              <Bike className="h-6 w-6 text-white icon-bounce" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-200 dark:text-blue-100">
            <Clock className="h-4 w-4 mr-1" />
            <span>Ready to Ride</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-3xl p-6 shadow-xl border border-cyan-400/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group card-hover backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-100 dark:text-cyan-50 mb-1">Avg. Battery</p>
              <p className="text-3xl font-bold text-cyan-400">{cycles.length > 0 ? Math.round(cycles.reduce((acc, cycle) => acc + (cycle.batteryLevel || 0), 0) / cycles.length) : 0}%</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 glow-effect">
              <Battery className="h-6 w-6 text-white icon-bounce" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-cyan-200 dark:text-cyan-100">
            <Star className="h-4 w-4 mr-1" />
            <span>Well Maintained</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-3xl p-6 shadow-xl border border-teal-400/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group card-hover backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-teal-100 dark:text-teal-50 mb-1">Your Location</p>
              <p className="text-lg font-semibold text-teal-300">📍 Current</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 glow-effect">
              <Users className="h-6 w-6 text-white icon-bounce" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-teal-200 dark:text-teal-100">
            <MapPin className="h-4 w-4 mr-1" />
            <span>GPS Active</span>
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div className="mb-8 relative z-10">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 border border-purple-200 dark:border-gray-700 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">🤖 AI Recommendations</h2>
              <p className="text-slate-600 dark:text-slate-300">Smart suggestions based on your location and preferences</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 rounded-xl text-white font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 flex items-center space-x-2 glow-effect"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          <div className="rounded-2xl overflow-hidden shadow-xl border border-purple-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
            <AIRecommendations />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
        <Link
          to="/user/cycles"
          className="bg-gradient-to-br from-sky-500/20 to-sky-600/20 rounded-3xl p-6 shadow-xl border border-sky-400/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-center group card-hover backdrop-blur-sm"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-sky-500 group-hover:to-sky-700 transition-all duration-300 glow-effect">
            <Bike className="h-8 w-8 text-white icon-bounce" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Browse All Cycles</h3>
          <p className="text-slate-600 dark:text-slate-300">View all available cycles and their details</p>
        </Link>
        
        <Link
          to="/user/scan"
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-3xl p-6 shadow-xl border border-blue-400/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-center group card-hover backdrop-blur-sm"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-500 group-hover:to-blue-700 transition-all duration-300 glow-effect">
            <svg className="h-8 w-8 text-white icon-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Scan QR Code</h3>
          <p className="text-slate-600 dark:text-slate-300">Quickly unlock cycles with QR scanning</p>
        </Link>
        
        <Link
          to="/user/history"
          className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-3xl p-6 shadow-xl border border-cyan-400/30 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-center group card-hover backdrop-blur-sm"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-cyan-500 group-hover:to-cyan-700 transition-all duration-300 glow-effect">
            <Clock className="h-8 w-8 text-white icon-bounce" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Ride History</h3>
          <p className="text-slate-600 dark:text-slate-300">View your past rides and statistics</p>
        </Link>
      </div>

      {/* Recent Activity & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-blue-800/90 to-slate-900/90 rounded-3xl p-6 shadow-2xl border border-sky-400/30 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl flex items-center justify-center glow-effect">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Recent Activity</h3>
              <p className="text-slate-200 dark:text-slate-100 text-sm">Your latest rides and actions</p>
            </div>
          </div>
          <div className="text-center py-12">
            <p className="text-slate-200 dark:text-slate-100">No recent activity yet.</p>
          </div>
        </div>

        {/* Tips & Features */}
        <div className="bg-gradient-to-br from-blue-800/50 to-yellow-300/10 rounded-3xl p-6 shadow-2xl border border-sky-400/30 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center glow-effect">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Smart Tips</h3>
              <p className="text-slate-200 dark:text-slate-100 text-sm">Make the most of EcoRide+</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-sky-500/10 to-cyan-500/10 rounded-2xl border border-sky-400/20">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-sky-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Find Nearest Station</h4>
                  <p className="text-slate-200 dark:text-slate-100 text-sm">Use the map to locate the closest station with available cycles</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-blue-100/10 to-indigo-100/10 rounded-2xl border border-blue-400/20">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">2</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Check Battery Level</h4>
                  <p className="text-slate-200 dark:text-slate-100 text-sm">Always check the battery before starting your ride</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-400/20">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Report Issues</h4>
                  <p className="text-slate-200 dark:text-slate-100 text-sm">Found a damaged cycle? Report it immediately for quick resolution</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-400/20">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">4</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Eco-Friendly Travel</h4>
                  <p className="text-slate-200 dark:text-slate-100 text-sm">Reduce your carbon footprint with sustainable campus transportation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};