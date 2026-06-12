import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bike, 
  Battery, 
  MapPin, 
  CreditCard, 
  Wallet,
  QrCode,
  ArrowLeft,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cycleAPI, bookingAPI, paymentAPI, stationAPI, rideAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
// Cycle image URLs - different images for different cycle types
const MOUNTAIN_BIKE_IMAGE = 'https://images.unsplash.com/photo-1486025402772-b75f768b7b4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80';
const ROAD_BIKE_IMAGE = 'https://images.unsplash.com/photo-1571068316344-75bc76d2421a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80';
const HYBRID_BIKE_IMAGE = 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80';
const ELECTRIC_BIKE_IMAGE = 'https://images.unsplash.com/photo-1580347224533-6ae2db8a7e1a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80';
const DEFAULT_BIKE_IMAGE = 'https://images.unsplash.com/photo-1571068316344-75bc76d2421a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80';

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
  qrCodeImage?: string;
  imageUrl?: string;
  totalRides?: number;
  lastMaintenance?: string;
}

interface Station {
  _id: string;
  name: string;
  availableCycles: number;
}

// Function to get cycle image based on model or code
const getCycleImage = (cycle: Cycle): string => {
  // If cycle already has an imageUrl, use it
  if (cycle.imageUrl) {
    return cycle.imageUrl;
  }
  
  // Convert to uppercase for case-insensitive matching
  const model = cycle.model.toUpperCase();
  const code = cycle.code.toUpperCase();
  
  // Check for electric bikes first (more specific)
  if (model.includes('ELECTRIC') || model.includes('E-BIKE') || model.includes('EBIKE') || 
      code.includes('E-') || code.includes('EB-') || code.includes('ELECTRIC')) {
    return ELECTRIC_BIKE_IMAGE;
  }
  
  // Check for mountain bikes
  if (model.includes('MOUNTAIN') || model.includes('MTB') || 
      code.includes('MTB') || code.includes('MOUNTAIN')) {
    return MOUNTAIN_BIKE_IMAGE;
  }
  
  // Check for road bikes
  if (model.includes('ROAD') || model.includes('RACE') || 
      code.includes('ROAD') || code.includes('RACE')) {
    return ROAD_BIKE_IMAGE;
  }
  
  // Check for hybrid/commuter bikes
  if (model.includes('HYBRID') || model.includes('COMMUTER') || model.includes('CITY') ||
      code.includes('HYBRID') || code.includes('COMMUTER') || code.includes('CITY')) {
    return HYBRID_BIKE_IMAGE;
  }
  
  // Return default image if no match found
  return DEFAULT_BIKE_IMAGE;
};

export const BookingPage: React.FC = () => {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const { user, refreshAuth } = useAuth();
  
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [availableCycles, setAvailableCycles] = useState<Cycle[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'UPI' | 'CARD'>('WALLET');
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [paymentQR, setPaymentQR] = useState('');
  const [showAvailableCycles, setShowAvailableCycles] = useState(!cycleId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTimeValue, setStartTimeValue] = useState('');
  const [endTimeValue, setEndTimeValue] = useState('');
  const [duration, setDuration] = useState(30); // Default 30 minutes

  // Calculate duration when start or end time changes
  useEffect(() => {
    if (startDate && startTimeValue && endDate && endTimeValue) {
      const start = new Date(`${startDate}T${startTimeValue}`);
      const end = new Date(`${endDate}T${endTimeValue}`);
      
      if (end > start) {
        const diffInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        setDuration(diffInMinutes);
      }
    }
  }, [startDate, startTimeValue, endDate, endTimeValue]);
  
  useEffect(() => {
    loadData();
  }, [selectedStation, cycleId]);

  useEffect(() => {
    // Set default dates and times
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    setStartDate(now.toISOString().split('T')[0]);
    setStartTimeValue(now.toTimeString().substring(0, 5));
    setEndDate(oneHourLater.toISOString().split('T')[0]);
    setEndTimeValue(oneHourLater.toTimeString().substring(0, 5));
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      
      // Get user location for nearby cycles
      let userLocation: [number, number] = [28.6667, 77.2167]; // Default
      
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
      
      // Load available cycles and stations
      const [cyclesResponse, stationsResponse] = await Promise.all([
        cycleAPI.getAll({
          lat: userLocation[0],
          lng: userLocation[1],
          radius: 10, // 10km radius
          status: 'AVAILABLE',
          ...(selectedStation && { stationId: selectedStation })
        }),
        stationAPI.getAll({
          lat: userLocation[0],
          lng: userLocation[1],
          radius: 10
        })
      ]);
      
      
      const cycles = cyclesResponse.data.cycles || cyclesResponse.data;
      setAvailableCycles(cycles);
      
      // Ensure stations data is properly structured
      let stationsData = [];
      // The API returns paginated data with a 'stations' property
      if (stationsResponse.data?.stations && Array.isArray(stationsResponse.data.stations)) {
        stationsData = stationsResponse.data.stations;
      } else if (Array.isArray(stationsResponse.data)) {
        stationsData = stationsResponse.data;
      } else {
        stationsData = stationsResponse.data || [];
      }
      
      
      // If no stations found, show appropriate message
      if (stationsData.length === 0) {
        console.warn('⚠️ No stations found in API response');
        stationsData = [
          { 
            _id: 'no-stations-found', 
            name: 'No stations found. Please check station configuration.', 
            availableCycles: 0 
          } as Station
        ];
      }
      
      setStations(stationsData);
      
      
      // If a specific cycle is selected, load its details
      if (cycleId) {
        try {
          const response = await cycleAPI.getById(cycleId);
          setCycle(response.data);
        } catch (error) {
          console.error('❌ Error loading cycle details:', error);
          toast.error('Failed to load cycle details');
          navigate('/user/cycles');
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Only show error message if we don't already have stations data
      if (stations.length === 0) {
        setError('Unable to fetch stations. Please check your connection.');
        toast.error('Failed to load cycles and stations');
        
        // Set a placeholder station to indicate the error
        setStations([
          { 
            _id: 'error-loading', 
            name: 'Error loading stations. Please try again.', 
            availableCycles: 0 
          } as Station
        ]);
      } else {
        // If we already have stations data, just show a toast error but keep the existing data
        toast.error('Failed to refresh cycles and stations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectCycle = (selectedCycle: Cycle) => {
    setCycle(selectedCycle);
    setShowAvailableCycles(false);
    navigate(`/user/book/${selectedCycle._id}`);
  };

  // Filter and sort available cycles
  const filteredCycles = availableCycles
    .filter(cycle => {
      const matchesSearch = cycle.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cycle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cycle.station?.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'battery':
          return (b.batteryLevel || 0) - (a.batteryLevel || 0);
        case 'code':
          return a.code.localeCompare(b.code);
        case 'station':
          return (a.station?.name || '').localeCompare(b.station?.name || '');
        default:
          return 0; // Distance sorting would need actual calculation
      }
    });

  const handleBooking = async () => {
    if (!cycle || !user) return;

    // Check if cycle is available
    if (cycle.status !== 'AVAILABLE') {
      toast.error('This cycle is no longer available');
      return;
    }

    // Check wallet balance for wallet payments
    if (paymentMethod === 'WALLET' && user.walletBalance < 10) {
      toast.error('Insufficient wallet balance. Minimum ₹10 required.');
      return;
    }

    // Validate required fields
    if (!startDate || !startTimeValue || !endDate || !endTimeValue) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Construct datetime strings
    const startTime = `${startDate}T${startTimeValue}`;
    const endTime = `${endDate}T${endTimeValue}`;

    // Validate that end time is after start time
    if (new Date(endTime) <= new Date(startTime)) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      setIsBooking(true);

      // Determine station ID: use cycle's station, or the selected station filter, or first available
      const stationId = cycle.station?._id || selectedStation || (stations.length > 0 ? stations[0]._id : '');

      if (!stationId) {
        toast.error('No station available for this cycle. Please contact support.');
        setIsBooking(false);
        return;
      }

      // Create booking - using cycle's current station for both start and end
      const bookingResponse = await bookingAPI.create({
        cycleId: cycle._id,
        startStationId: stationId,
        endStationId: stationId,
        startTime: startTime,
        endTime: endTime,
        duration: duration
      });

      const booking = bookingResponse.data.booking;

      // Create payment
      const paymentResponse = await paymentAPI.create({
        type: 'RIDE',
        method: paymentMethod,
        amount: booking.estimatedCost,
        bookingId: booking._id
      });

      const payment = paymentResponse.data.payment;

      // Handle different payment methods
      if (paymentMethod === 'WALLET') {
        // Wallet payment is confirmed immediately by server on payment.create
        // (server does $inc walletBalance: -amount automatically)
        toast.success('Booking confirmed! Starting your ride...');
        try {
          // Refresh user balance from server, then start ride
          await refreshAuth();
          await startRideDirectly(booking._id);
        } catch (navError) {
          console.error('Ride start failed:', navError);
          toast.error('Failed to start ride. Please try again.');
        }
      
      } else if (paymentMethod === 'UPI') {
        // Show UPI QR code
        setPaymentQR(payment.qrCode);
        setShowPaymentQR(true);
      
        // Poll for payment confirmation (in real app, this would be handled by webhooks)
        const pollPayment = async () => {
          try {
            const confirmResponse = await paymentAPI.confirm(payment._id);
            if (confirmResponse.data.payment.status === 'COMPLETED') {
              toast.success('Payment successful! Starting your ride...');
              try {
                // Instead of going to scan page, directly start the ride
                await startRideDirectly(booking._id);
              } catch (navError) {
                console.error('Ride start failed:', navError);
                toast.error('Failed to start ride. Please try again.');
              }
            }
          } catch (error) {
            console.error('Payment confirmation failed:', error);
            toast.error('Payment failed. Please try again.');
          }
        };
      
        // Simulate payment confirmation after 3 seconds (for demo)
        setTimeout(pollPayment, 3000);
      
      } else {
        // Card payment simulation
        setTimeout(async () => {
          try {
            await paymentAPI.confirm(payment._id);
            toast.success('Payment successful! Starting your ride...');
            try {
              // Instead of going to scan page, directly start the ride
              await startRideDirectly(booking._id);
            } catch (navError) {
              console.error('Ride start failed:', navError);
              toast.error('Failed to start ride. Please try again.');
            }
          } catch (error) {
            console.error('Payment confirmation failed:', error);
            toast.error('Payment failed. Please try again.');
          }
        }, 2000);
      }

    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cycles...</p>
        </div>
      </div>
    );
  }

  // Show available cycles if no specific cycle is selected or if user wants to browse
  if (showAvailableCycles || !cycle) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book a Ride</h1>
            <p className="text-gray-600 dark:text-gray-300">Select an available cycle to book</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search cycles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Station Filter */}
            <div>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Stations</option>
                {stations.map((station) => (
                  <option key={station._id} value={station._id}>
                    {station.name} ({station.availableCycles} available)
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="distance">Distance</option>
                <option value="battery">Battery Level</option>
                <option value="code">Cycle Code</option>
                <option value="station">Station Name</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStation('');
                setSortBy('distance');
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300">
            Showing {filteredCycles.length} available cycle{filteredCycles.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Available Cycles Grid */}
        {filteredCycles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCycles.map((availableCycle) => (
              <div key={availableCycle._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden">
                {/* Image */}
                <div className="relative">
                  <img 
                    src={getCycleImage(availableCycle)} 
                    alt={`${availableCycle.model} ${availableCycle.code}`} 
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      // Fallback to default image if the image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_BIKE_IMAGE;
                    }}
                  />
                  {/* Model badge */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {availableCycle.model}
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="p-4 pb-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      AVAILABLE
                    </span>
                    
                    {availableCycle.batteryLevel && (
                      <div className="flex items-center space-x-1">
                        <Battery className={`h-4 w-4 ${
                          availableCycle.batteryLevel > 50 ? 'text-green-500' : 
                          availableCycle.batteryLevel > 20 ? 'text-orange-500' : 'text-red-500'
                        }`} />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{availableCycle.batteryLevel}%</span>
                      </div>
                    )}
                  </div>

                  {/* Cycle Info */}
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{availableCycle.code}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{availableCycle.model}</p>
                  </div>

                  {/* Location */}
                  {availableCycle.station && (
                    <div className="flex items-center space-x-2 mb-3">
                      <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{availableCycle.station.name}</span>
                    </div>
                  )}

                  {/* Stats */}
                  {availableCycle.totalRides && (
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span>{availableCycle.totalRides} rides</span>
                      {availableCycle.lastMaintenance && (
                        <span>Last serviced: {new Date(availableCycle.lastMaintenance).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Select Button */}
                <div className="p-4 pt-0">
                  <button
                    onClick={() => selectCycle(availableCycle)}
                    className="w-full bg-blue-600 dark:bg-blue-500 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Select This Cycle
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bike className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No cycles available</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm || selectedStation
                ? 'Try adjusting your filters'
                : 'No cycles available in this area'
              }
            </p>
            
            {(searchTerm || selectedStation) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStation('');
                  setSortBy('distance');
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Booking form for selected cycle
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back button and header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => {
            setCycle(null);
            setShowAvailableCycles(true);
            navigate('/book');
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book Your Ride</h1>
          <p className="text-gray-600 dark:text-gray-300">Complete your booking details</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Book Your Ride</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Select your preferred cycle and schedule your ride
          </p>
        </div>
        {cycle && (
          <button
            onClick={() => {
              setCycle(null);
              setShowAvailableCycles(true);
              navigate('/book');
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Change Cycle
          </button>
        )}
      </div>

      {/* Booking Details Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-purple border dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Booking Details</h3>
        
        <div className="space-y-4">
          {/* Start Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Start Date and Time *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <input
                  type="time"
                  value={startTimeValue}
                  onChange={(e) => setStartTimeValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* End Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              End Date and Time *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <input
                  type="time"
                  value={endTimeValue}
                  onChange={(e) => setEndTimeValue(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Duration Display */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Duration:</span>
              <span className="font-medium text-gray-900 dark:text-white">{duration} minutes</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600 dark:text-gray-300">Estimated Cost:</span>
              <span className="font-medium text-gray-900 dark:text-white">₹{(duration * 2).toFixed(2)}</span>
            </div>
          </div>
          
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('WALLET')}
                className={`p-3 rounded-lg border ${
                  paymentMethod === 'WALLET'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Wallet className="h-5 w-5 mx-auto mb-1" />
                <span className="text-xs">Wallet</span>
                {user && (
                  <div className="text-xs mt-1">
                    ₹{user.walletBalance?.toFixed(2) || '0.00'}
                  </div>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-lg border ${
                  paymentMethod === 'UPI'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <QrCode className="h-5 w-5 mx-auto mb-1" />
                <span className="text-xs">UPI</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-lg border ${
                  paymentMethod === 'CARD'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <CreditCard className="h-5 w-5 mx-auto mb-1" />
                <span className="text-xs">Card</span>
              </button>
            </div>
          </div>
          
          {/* Book Button */}
          <button
            onClick={handleBooking}
            disabled={isBooking}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBooking ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Book Cycle'
            )}
          </button>
        </div>
      </div>
      
      {/* Payment QR Modal */}
      {showPaymentQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Complete Payment</h3>
              <button
                onClick={() => setShowPaymentQR(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Scan this QR code to complete your payment via UPI
              </p>
              {paymentQR && (
                <div className="flex justify-center mb-4">
                  <img src={paymentQR} alt="Payment QR Code" className="w-48 h-48" />
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Payment will be confirmed automatically
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Function to start ride directly without QR code scanning
  const startRideDirectly = async (bookingId: string) => {
    try {
      // Get user location for ride start
      let latitude = 28.6667; // Default location
      let longitude = 77.2167;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
              timeout: 10000,
              enableHighAccuracy: true
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (geoError) {
          console.warn('Could not get precise location, using default:', geoError);
          toast.success('Using default location for ride start');
        }
      }
      
      // Start the ride using the rideAPI
      const response = await rideAPI.start({
        bookingId: bookingId,
        latitude: latitude,
        longitude: longitude
      });
      
      toast.success('Ride started successfully!');
      
      // Navigate to the ride tracking page
      navigate(`/user/ride/${response.data.ride._id}`);
    } catch (error: any) {
      console.error('Error starting ride:', error);
      console.error('Error response:', error.response);
      console.error('Error config:', error.config);
      console.error('Error request:', error.request);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please log in again.');
        // Clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        // Navigate to login page directly
        window.location.href = '/auth/login';
        return;
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please contact support.');
        // Navigate to dashboard for forbidden errors
        navigate('/user/dashboard');
        return;
      } else {
        toast.error(error.response?.data?.message || 'Failed to start ride. Please contact support.');
      }
      // Fallback to dashboard if ride start fails
      navigate('/user/dashboard');
    }
  };
};