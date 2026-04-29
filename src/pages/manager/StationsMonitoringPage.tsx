import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus,
  Edit
} from 'lucide-react';
import { stationAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Station {
  _id: string;
  name: string;
  capacity: number;
  availableCycles: number;
  status: string;
  facilities?: string[];
}

const StationsMonitoringPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Station modals and state
  const [showAddStation, setShowAddStation] = useState(false);
  const [showEditStation, setShowEditStation] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [newStation, setNewStation] = useState({
    name: '',
    latitude: '',
    longitude: '',
    capacity: '',
    facilities: [] as string[]
  });
  
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setIsLoading(true);
      const response = await stationAPI.getAll();
      console.log('Stations response:', response);
      setStations(response.data?.stations || response.data || []);
    } catch (error: any) {
      console.error('Error loading stations:', error);
      toast.error('Failed to load stations: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      setStations([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'BOOKED':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'IN_USE':
        return 'bg-orange-100 text-orange-800';
      case 'MAINTENANCE':
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'INACTIVE':
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.name || !newStation.latitude || !newStation.longitude || !newStation.capacity) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      setIsCreating(true);
      await stationAPI.create({
        name: newStation.name.trim(),
        latitude: parseFloat(newStation.latitude),
        longitude: parseFloat(newStation.longitude),
        capacity: parseInt(newStation.capacity),
        facilities: newStation.facilities
      });
      toast.success('Station created successfully');
      setShowAddStation(false);
      setNewStation({ name: '', latitude: '', longitude: '', capacity: '', facilities: [] });
      loadStations();
    } catch (error: any) {
      const zodMessage = error?.response?.data?.errors?.[0]?.message;
      toast.error(zodMessage || error?.response?.data?.message || 'Failed to create station');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    
    try {
      setIsCreating(true);
      await stationAPI.update(editingStation._id, {
        name: newStation.name.trim(),
        latitude: newStation.latitude ? parseFloat(newStation.latitude) : undefined,
        longitude: newStation.longitude ? parseFloat(newStation.longitude) : undefined,
        capacity: newStation.capacity ? parseInt(newStation.capacity) : undefined,
        facilities: newStation.facilities
      });
      toast.success('Station updated successfully');
      setShowEditStation(false);
      setEditingStation(null);
      setNewStation({ name: '', latitude: '', longitude: '', capacity: '', facilities: [] });
      loadStations();
    } catch (error: any) {
      const zodMessage = error?.response?.data?.errors?.[0]?.message;
      toast.error(zodMessage || error?.response?.data?.message || 'Failed to update station');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditStation = (station: Station) => {
    setEditingStation(station);
    setNewStation({
      name: station.name,
      latitude: '',
      longitude: '',
      capacity: station.capacity.toString(),
      facilities: station.facilities || []
    });
    setShowEditStation(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Loading stations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Station Management</h2>
        <button 
          onClick={() => setShowAddStation(true)}
          className="flex items-center space-x-2 bg-blue-600 dark:bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Station</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations.map((station) => (
          <div key={station._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{station.name}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(station.status)}`}>
                {station.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">Capacity:</span>
                <span className="font-medium text-slate-800 dark:text-white">{station.capacity}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">Available:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{station.availableCycles}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">Occupancy:</span>
                <span className="font-medium text-slate-800 dark:text-white">
                  {station.capacity > 0 ? Math.round((station.availableCycles / station.capacity) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 text-sm bg-blue-600 dark:bg-purple-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-purple-700 transition-colors">
                View Details
              </button>
              
              <button 
                onClick={() => openEditStation(station)}
                className="p-2 text-blue-600 dark:text-purple-400 hover:text-blue-800 dark:hover:text-purple-300 rounded-lg hover:bg-blue-50 dark:hover:bg-purple-900/20"
                title="Edit station"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Station Modal */}
      {showAddStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Add New Station</h3>
              <button onClick={() => setShowAddStation(false)} className="text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateStation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Station Name</label>
                  <input 
                    value={newStation.name} 
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })} 
                    required 
                    placeholder="e.g., Central Station"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Latitude</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={newStation.latitude} 
                    onChange={(e) => setNewStation({ ...newStation, latitude: e.target.value })} 
                    required 
                    placeholder="e.g., 12.9716"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Longitude</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={newStation.longitude} 
                    onChange={(e) => setNewStation({ ...newStation, longitude: e.target.value })} 
                    required 
                    placeholder="e.g., 77.5946"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Capacity</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={newStation.capacity} 
                    onChange={(e) => setNewStation({ ...newStation, capacity: e.target.value })} 
                    required 
                    placeholder="e.g., 20"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Facilities (optional)</label>
                  <div className="space-y-2">
                    {['REPAIR_STATION', 'CHARGING_POINT', 'COVERED_PARKING', 'SECURITY_CAMERA'].map((facility) => (
                      <label key={facility} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newStation.facilities.includes(facility)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewStation({ ...newStation, facilities: [...newStation.facilities, facility] });
                            } else {
                              setNewStation({ ...newStation, facilities: newStation.facilities.filter(f => f !== facility) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-slate-700 dark:text-gray-300">{facility.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddStation(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-blue-600 dark:bg-purple-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isCreating ? 'Creating...' : 'Create Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Station Modal */}
      {showEditStation && editingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Edit Station: {editingStation.name}</h3>
              <button onClick={() => { setShowEditStation(false); setEditingStation(null); }} className="text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleEditStation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Station Name</label>
                  <input 
                    value={newStation.name} 
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })} 
                    required 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Latitude (optional)</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={newStation.latitude} 
                    onChange={(e) => setNewStation({ ...newStation, latitude: e.target.value })} 
                    placeholder="Leave blank to keep current"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Longitude (optional)</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={newStation.longitude} 
                    onChange={(e) => setNewStation({ ...newStation, longitude: e.target.value })} 
                    placeholder="Leave blank to keep current"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Capacity</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={newStation.capacity} 
                    onChange={(e) => setNewStation({ ...newStation, capacity: e.target.value })} 
                    required 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white" 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Facilities</label>
                  <div className="space-y-2">
                    {['REPAIR_STATION', 'CHARGING_POINT', 'COVERED_PARKING', 'SECURITY_CAMERA'].map((facility) => (
                      <label key={facility} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newStation.facilities.includes(facility)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewStation({ ...newStation, facilities: [...newStation.facilities, facility] });
                            } else {
                              setNewStation({ ...newStation, facilities: newStation.facilities.filter(f => f !== facility) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-slate-700 dark:text-gray-300">{facility.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => { setShowEditStation(false); setEditingStation(null); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-blue-600 dark:bg-purple-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isCreating ? 'Updating...' : 'Update Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationsMonitoringPage;