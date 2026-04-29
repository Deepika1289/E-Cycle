import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bike, Battery, MapPin, Search } from 'lucide-react';
import { cycleAPI, stationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { CYCLE_STATUS } from '../constants/status';

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
  totalRides: number;
  lastMaintenance: string;
  imageUrl?: string;
}

interface Station {
  _id: string;
  name: string;
  availableCycles: number;
}

export const CyclesPage: React.FC = () => {
  const { refreshAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState(searchParams.get('station') || '');
  const [statusFilter, setStatusFilter] = useState('AVAILABLE');
  const [sortBy, setSortBy] = useState('distance');

  useEffect(() => {
    // Refresh authentication when page loads
    refreshAuth().then(() => {
      loadData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedStation, statusFilter]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Load cycles and stations
      const [cyclesResponse, stationsResponse] = await Promise.all([
        cycleAPI.getAll({
          ...(selectedStation && { stationId: selectedStation }),
          ...(statusFilter && { status: statusFilter })
        }),
        stationAPI.getAll()
      ]);

      // Ensure we have arrays (server may return { cycles, pagination })
      const cyclesData = Array.isArray(cyclesResponse.data)
        ? cyclesResponse.data
        : (cyclesResponse.data?.cycles || cyclesResponse.data || []);
      const stationsData = Array.isArray(stationsResponse.data)
        ? stationsResponse.data
        : (stationsResponse.data?.stations || stationsResponse.data || []);

      setCycles(cyclesData);
      setStations(stationsData);
    } catch (error: any) {
      toast.error('Failed to load cycles. Please try again.');
      // Set empty arrays to prevent undefined errors
      setCycles([]);
      setStations([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStation, statusFilter]);

  const filteredCycles = useMemo(() => {
    const search = searchTerm.toLowerCase();
    const base = cycles.filter((cycle) => {
      const codeMatch = cycle.code.toLowerCase().includes(search);
      const modelMatch = cycle.model.toLowerCase().includes(search);
      const stationMatch = (cycle.station?.name || '').toLowerCase().includes(search);
      return codeMatch || modelMatch || stationMatch;
    });

    const sorted = [...base].sort((a, b) => {
      switch (sortBy) {
        case 'battery':
          return (b.batteryLevel || 0) - (a.batteryLevel || 0);
        case 'code':
          return a.code.localeCompare(b.code);
        case 'station':
          return (a.station?.name || '').localeCompare(b.station?.name || '');
        default:
          return 0;
      }
    });
    return sorted;
  }, [cycles, searchTerm, sortBy]);

  console.log('Filtered cycles:', filteredCycles.length);

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Available Cycles</h1>
          <p className="text-gray-600 dark:text-gray-300">Find and book cycles near you</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cycles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Station Filter */}
          <div>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Stations</option>
              {stations.map((station) => (
                <option key={station._id} value={station._id}>
                  {station.name} ({station.availableCycles} available)
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="BOOKED">Booked</option>
              <option value="IN_USE">In Use</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="distance">Distance</option>
              <option value="battery">Battery Level</option>
              <option value="code">Cycle Code</option>
              <option value="station">Station Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-300">
          Showing {filteredCycles.length} cycle{filteredCycles.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Cycles Grid */}
      {filteredCycles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCycles.map((cycle) => (
            <div key={cycle._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden">
              {/* Image */}
              {cycle.imageUrl ? (
                <img src={cycle.imageUrl} alt={cycle.model} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 flex items-center justify-center">
                  <Bike className="h-8 w-8 text-blue-500 dark:text-blue-300" />
                </div>
              )}
              {/* Status Badge */}
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cycle.status === 'AVAILABLE' 
                      ? 'bg-green-100 text-green-800'
                      : cycle.status === 'BOOKED'
                      ? 'bg-orange-100 text-orange-800'
                      : cycle.status === 'IN_USE'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {cycle.status.replace('_', ' ')}
                  </span>
                  
                  {typeof cycle.batteryLevel === 'number' && (
                    <div className="flex items-center space-x-1">
                      <Battery className={`h-4 w-4 ${
                        cycle.batteryLevel > 50 ? 'text-green-500' : 
                        cycle.batteryLevel > 20 ? 'text-orange-500' : 'text-red-500'
                      }`} />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{cycle.batteryLevel}%</span>
                    </div>
                  )}
                </div>

                {/* Cycle Info */}
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{cycle.code}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{cycle.model}</p>
                </div>

                {/* Location */}
                {cycle.station && (
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{cycle.station.name}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>{cycle.totalRides} rides</span>
                  <span>Last serviced: {new Date(cycle.lastMaintenance).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 pt-0">
                {cycle.status === CYCLE_STATUS.AVAILABLE ? (
                  <Link
                    to={`/user/book/${cycle._id}`}
                    className="block w-full bg-blue-600 dark:bg-blue-500 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Book Now
                  </Link>
                ) : cycle.status === CYCLE_STATUS.BOOKED ? (
                  <Link
                    to="/user/scan"
                    className="block w-full bg-orange-600 dark:bg-orange-500 text-white text-center py-3 px-4 rounded-lg font-medium hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
                  >
                    Scan to Unlock
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-center py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                  >
                    {cycle.status === CYCLE_STATUS.IN_USE ? 'In Use' : 'Under Maintenance'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bike className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No cycles found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {searchTerm || selectedStation || statusFilter !== 'AVAILABLE'
              ? 'Try adjusting your filters'
              : 'No cycles available in this area'
            }
          </p>
          
          {(searchTerm || selectedStation || statusFilter !== 'AVAILABLE') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStation('');
                setStatusFilter('AVAILABLE');
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
};