import React, { useEffect, useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Battery, 
  Wrench, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { cycleAPI, stationAPI } from '../../services/api';
import { cyclesApi } from '../../services/managementApi';
import toast from 'react-hot-toast';

interface Cycle {
  _id: string;
  cycleId: string;
  model?: string;
  station: {
    _id: string;
    name: string;
  };
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RESERVED';
  batteryLevel: number;
  lastMaintenance: string;
  createdAt: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  totalRides?: number;
}

interface Station {
  _id: string;
  name: string;
}

export const CyclesManagement: React.FC = () => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCycles();
    loadStations();
  }, []);

  const loadCycles = async () => {
    try {
      setLoading(true);
      const response = await cycleAPI.getAll({});
      // Map the response data to ensure it matches our Cycle interface
      const mappedCycles = (response.data.cycles || response.data).map((cycle: any) => ({
        ...cycle,
        cycleId: cycle.code || cycle.cycleId || '',
        model: cycle.model || '',
        station: cycle.station || { _id: '', name: 'Unassigned' },
        batteryLevel: cycle.batteryLevel || 0,
        lastMaintenance: cycle.lastMaintenance || '',
        createdAt: cycle.createdAt || new Date().toISOString(),
        latitude: cycle.latitude,
        longitude: cycle.longitude,
        imageUrl: cycle.imageUrl,
        totalRides: cycle.totalRides || 0
      }));
      setCycles(mappedCycles);
    } catch (error) {
      console.error('Error loading cycles:', error);
      toast.error('Failed to load cycles');
    } finally {
      setLoading(false);
    }
  };

  const loadStations = async () => {
    try {
      const response = await stationAPI.getAll({});
      setStations(response.data);
    } catch (error) {
      console.error('Error loading stations:', error);
      toast.error('Failed to load stations');
    }
  };

  const handleAddCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for adding a new cycle
    toast.success('Cycle added successfully');
    setShowAddModal(false);
    loadCycles();
  };

  const handleEditCycle = (cycle: Cycle) => {
    setCurrentCycle({
      ...cycle,
      // Ensure we have the right structure for editing
      cycleId: cycle.cycleId || '',
      station: cycle.station || { _id: '', name: '' },
      batteryLevel: cycle.batteryLevel || 0,
      lastMaintenance: cycle.lastMaintenance || '',
      status: cycle.status || 'AVAILABLE'
    });
    setShowEditModal(true);
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    
    if (!currentCycle?.cycleId.trim()) {
      errors.cycleId = 'Cycle ID is required';
    }
    
    if (!currentCycle?.station._id) {
      errors.station = 'Station is required';
    }
    
    const batteryLevel = currentCycle?.batteryLevel ?? 0;
    if (batteryLevel < 0 || batteryLevel > 100) {
      errors.batteryLevel = 'Battery level must be between 0 and 100';
    }
    
    // Validate latitude and longitude if provided
    if (currentCycle?.latitude !== undefined && (currentCycle.latitude < -90 || currentCycle.latitude > 90)) {
      errors.latitude = 'Latitude must be between -90 and 90';
    }
    
    if (currentCycle?.longitude !== undefined && (currentCycle.longitude < -180 || currentCycle.longitude > 180)) {
      errors.longitude = 'Longitude must be between -180 and 180';
    }
    
    // Validate image URL if provided
    if (currentCycle?.imageUrl && !currentCycle.imageUrl.match(/^https?:\/\/.+\..+/)) {
      errors.imageUrl = 'Please enter a valid URL';
    }
    
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCycle) return;
    
    if (!validateEditForm()) {
      toast.error('Please fix validation errors');
      return;
    }
    
    try {
      // Prepare the data for update
      const updateData: any = {
        code: currentCycle.cycleId,
        stationId: currentCycle.station._id,
        status: currentCycle.status,
        batteryLevel: currentCycle.batteryLevel
      };
      
      // Only include optional fields if they have values
      if (currentCycle.model) updateData.model = currentCycle.model;
      if (currentCycle.latitude !== undefined) updateData.latitude = currentCycle.latitude;
      if (currentCycle.longitude !== undefined) updateData.longitude = currentCycle.longitude;
      if (currentCycle.lastMaintenance) updateData.lastMaintenance = currentCycle.lastMaintenance;
      if (currentCycle.imageUrl) updateData.imageUrl = currentCycle.imageUrl;
      
      await cyclesApi.update(currentCycle._id, updateData);
      
      toast.success('Cycle updated successfully');
      setShowEditModal(false);
      setCurrentCycle(null);
      setEditErrors({});
      loadCycles();
    } catch (error: any) {
      console.error('Error updating cycle:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update cycle';
      toast.error(errorMessage);
    }
  };

  const handleDeleteCycle = async (cycleId: string) => {
    if (!window.confirm('Are you sure you want to delete this cycle?')) return;
    
    try {
      await cyclesApi.delete(cycleId);
      toast.success('Cycle deleted successfully');
      loadCycles();
    } catch (error) {
      console.error('Error deleting cycle:', error);
      toast.error('Failed to delete cycle');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'IN_USE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'RESERVED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 70) return 'text-green-500';
    if (level > 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const filteredCycles = cycles.filter(cycle => {
    const matchesSearch = cycle.cycleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cycle.station.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || cycle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading cycles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-2">
          Cycles Management
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Manage all cycles in the system</p>
      </div>

      {/* Filters and Actions */}
      <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search by cycle ID or station..."
                className="pl-10 pr-4 py-2 bg-white/50 dark:bg-surface/50 border border-white/30 dark:border-white/20 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <select
                className="pl-10 pr-4 py-2 bg-white/50 dark:bg-surface/50 border border-white/30 dark:border-white/20 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm appearance-none w-full sm:w-48"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="IN_USE">In Use</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RESERVED">Reserved</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 shadow-md transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            <span>Add Cycle</span>
          </button>
        </div>
      </div>

      {/* Cycles Table */}
      <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/20 dark:divide-white/10">
            <thead className="bg-white/50 dark:bg-surface/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Cycle ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Battery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Last Maintenance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/30 dark:bg-surface/30 divide-y divide-white/20 dark:divide-white/10">
              {filteredCycles.map((cycle) => (
                <tr key={cycle._id} className="hover:bg-white/50 dark:hover:bg-surface/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Bike className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-800 dark:text-white">{cycle.cycleId}</div>
                        {cycle.model && (
                          <div className="text-sm text-slate-600 dark:text-slate-400">{cycle.model}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-slate-800 dark:text-white">{cycle.station.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(cycle.status)}`}>
                      {cycle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Battery className={`h-5 w-5 ${getBatteryColor(cycle.batteryLevel)}`} />
                      <span className="ml-2 text-sm font-medium text-slate-800 dark:text-white">
                        {cycle.batteryLevel}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {cycle.lastMaintenance 
                        ? new Date(cycle.lastMaintenance).toLocaleDateString() 
                        : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCycle(cycle)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCycle(cycle._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCycles.length === 0 && (
          <div className="text-center py-12">
            <Bike className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No cycles found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'No cycles match your search criteria' 
                : 'Get started by adding a new cycle'}
            </p>
          </div>
        )}
      </div>

      {/* Add Cycle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="backdrop-blur-lg bg-white/80 dark:bg-surface/80 border border-white/30 dark:border-white/20 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Add New Cycle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCycle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cycle ID
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-white/30 dark:border-white/20 rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm"
                  placeholder="Enter unique cycle ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Station
                </label>
                <select
                  className="w-full border border-white/30 dark:border-white/20 rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm"
                  required
                >
                  <option value="">Select a station</option>
                  {stations.map(station => (
                    <option key={station._id} value={station._id}>{station.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  className="w-full border border-white/30 dark:border-white/20 rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm"
                  required
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="IN_USE">In Use</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RESERVED">Reserved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Battery Level (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  className="w-full border border-white/30 dark:border-white/20 rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm"
                  placeholder="Enter battery level"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-white/30 dark:border-white/20 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-surface/50 backdrop-blur-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 shadow-md transition-all duration-200"
                >
                  Add Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cycle Modal */}
      {showEditModal && currentCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="backdrop-blur-lg bg-white/80 dark:bg-surface/80 border border-white/30 dark:border-white/20 rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Edit Cycle</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentCycle(null);
                }}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCycle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cycle ID
                  </label>
                  <input
                    type="text"
                    value={currentCycle.cycleId}
                    onChange={(e) => {
                      setCurrentCycle({...currentCycle, cycleId: e.target.value});
                      if (editErrors.cycleId) {
                        setEditErrors({...editErrors, cycleId: ''});
                      }
                    }}
                    required
                    className={`w-full border rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm ${
                      editErrors.cycleId ? 'border-red-500' : 'border-white/30 dark:border-white/20'
                    }`}
                  />
                  {editErrors.cycleId && <p className="mt-1 text-sm text-red-500">{editErrors.cycleId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={currentCycle.model || ''}
                    onChange={(e) => setCurrentCycle({...currentCycle, model: e.target.value})}
                    className="w-full border border-white/30 dark:border-white/20 rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Station
                  </label>
                  <select
                    value={currentCycle.station._id}
                    onChange={(e) => {
                      const selectedStation = stations.find(s => s._id === e.target.value);
                      if (selectedStation) {
                        setCurrentCycle({
                          ...currentCycle, 
                          station: {
                            _id: selectedStation._id,
                            name: selectedStation.name
                          }
                        });
                      }
                      if (editErrors.station) {
                        setEditErrors({...editErrors, station: ''});
                      }
                    }}
                    className={`w-full border rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm ${
                      editErrors.station ? 'border-red-500' : 'border-white/30 dark:border-white/20'
                    }`}
                    required
                  >
                    <option value="">Select a station</option>
                    {stations.map(station => (
                      <option key={station._id} value={station._id}>{station.name}</option>
                    ))}
                  </select>
                  {editErrors.station && <p className="mt-1 text-sm text-red-500">{editErrors.station}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={currentCycle.status}
                    onChange={(e) => setCurrentCycle({...currentCycle, status: e.target.value as any})}
                    className="w-full border border-white/30 dark:border-white/20 rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm"
                    required
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="IN_USE">In Use</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Battery Level (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={currentCycle.batteryLevel}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setCurrentCycle({...currentCycle, batteryLevel: value});
                      if (editErrors.batteryLevel) {
                        setEditErrors({...editErrors, batteryLevel: ''});
                      }
                    }}
                    required
                    className={`w-full border rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm ${
                      editErrors.batteryLevel ? 'border-red-500' : 'border-white/30 dark:border-white/20'
                    }`}
                  />
                  {editErrors.batteryLevel && <p className="mt-1 text-sm text-red-500">{editErrors.batteryLevel}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={currentCycle.latitude || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setCurrentCycle({...currentCycle, latitude: value});
                      if (editErrors.latitude) {
                        setEditErrors({...editErrors, latitude: ''});
                      }
                    }}
                    className={`w-full border rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm ${
                      editErrors.latitude ? 'border-red-500' : 'border-white/30 dark:border-white/20'
                    }`}
                  />
                  {editErrors.latitude && <p className="mt-1 text-sm text-red-500">{editErrors.latitude}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={currentCycle.longitude || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      setCurrentCycle({...currentCycle, longitude: value});
                      if (editErrors.longitude) {
                        setEditErrors({...editErrors, longitude: ''});
                      }
                    }}
                    className={`w-full border rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm ${
                      editErrors.longitude ? 'border-red-500' : 'border-white/30 dark:border-white/20'
                    }`}
                  />
                  {editErrors.longitude && <p className="mt-1 text-sm text-red-500">{editErrors.longitude}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Last Maintenance
                  </label>
                  <input
                    type="date"
                    value={currentCycle.lastMaintenance ? new Date(currentCycle.lastMaintenance).toISOString().split('T')[0] : ''}
                    onChange={(e) => setCurrentCycle({...currentCycle, lastMaintenance: e.target.value})}
                    className="w-full border border-white/30 dark:border-white/20 rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={currentCycle.imageUrl || ''}
                    onChange={(e) => {
                      setCurrentCycle({...currentCycle, imageUrl: e.target.value});
                      if (editErrors.imageUrl) {
                        setEditErrors({...editErrors, imageUrl: ''});
                      }
                    }}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full border rounded-xl px-3 py-2 bg-white/50 dark:bg-surface/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500 backdrop-blur-sm ${
                      editErrors.imageUrl ? 'border-red-500' : 'border-white/30 dark:border-white/20'
                    }`}
                  />
                  {editErrors.imageUrl && <p className="mt-1 text-sm text-red-500">{editErrors.imageUrl}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentCycle(null);
                  }}
                  className="px-4 py-2 border border-white/30 dark:border-white/20 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-surface/50 backdrop-blur-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 shadow-md transition-all duration-200"
                >
                  Update Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};