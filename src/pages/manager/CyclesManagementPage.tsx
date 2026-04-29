import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  Plus,
  Edit,
  Settings
} from 'lucide-react';
import { cycleAPI, stationAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Cycle {
  _id: string;
  code: string;
  model: string;
  status: string;
  batteryLevel?: number;
  station?: {
    _id: string;
    name: string;
  };
  totalRides: number;
  imageUrl?: string;
}

interface Station {
  _id: string;
  name: string;
  capacity: number;
  availableCycles: number;
  status: string;
  facilities?: string[];
}

const CyclesManagementPage: React.FC = () => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cycle modals and state
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [showEditCycle, setShowEditCycle] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [newCycle, setNewCycle] = useState({
    code: '',
    model: '',
    latitude: '',
    longitude: '',
    stationId: '',
    batteryLevel: '',
    imageUrl: ''
  });
  
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadCycles();
    loadStations();
  }, []);

  const loadCycles = async () => {
    try {
      setIsLoading(true);
      const response = await cycleAPI.getAll();
      console.log('Cycles response:', response);
      setCycles(response.data?.cycles || response.data || []);
    } catch (error: any) {
      console.error('Error loading cycles:', error);
      toast.error('Failed to load cycles: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      setCycles([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const loadStations = async () => {
    try {
      const response = await stationAPI.getAll();
      console.log('Stations response:', response);
      setStations(response.data?.stations || response.data || []);
    } catch (error: any) {
      console.error('Error loading stations:', error);
      toast.error('Failed to load stations: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      setStations([]); // Set to empty array on error
    }
  };

  const handleCycleStatusUpdate = async (cycleId: string, newStatus: string) => {
    try {
      await cycleAPI.updateStatus(cycleId, newStatus);
      toast.success('Cycle status updated successfully');
      loadCycles();
    } catch (error: any) {
      console.error('Error updating cycle status:', error);
      toast.error(error.response?.data?.message || 'Failed to update cycle status');
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycle.code || !newCycle.model || !newCycle.latitude || !newCycle.longitude) {
      toast.error('Please fill code, model, latitude and longitude');
      return;
    }
    try {
      setIsCreating(true);
      await cycleAPI.create({
        code: newCycle.code.trim(),
        model: newCycle.model.trim(),
        latitude: parseFloat(newCycle.latitude),
        longitude: parseFloat(newCycle.longitude),
        stationId: newCycle.stationId || undefined,
        batteryLevel: newCycle.batteryLevel ? parseInt(newCycle.batteryLevel) : undefined,
        imageUrl: newCycle.imageUrl || undefined,
      });
      toast.success('Cycle created successfully');
      setShowAddCycle(false);
      setNewCycle({ code: '', model: '', latitude: '', longitude: '', stationId: '', batteryLevel: '', imageUrl: '' });
      loadCycles();
    } catch (error: any) {
      const zodMessage = error?.response?.data?.errors?.[0]?.message;
      toast.error(zodMessage || error?.response?.data?.message || 'Failed to create cycle');
    }
    finally {
      setIsCreating(false);
    }
  };

  const handleEditCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCycle) return;
    
    try {
      setIsCreating(true);
      await cycleAPI.update(editingCycle._id, {
        code: newCycle.code.trim(),
        model: newCycle.model.trim(),
        latitude: newCycle.latitude ? parseFloat(newCycle.latitude) : undefined,
        longitude: newCycle.longitude ? parseFloat(newCycle.longitude) : undefined,
        stationId: newCycle.stationId || undefined,
        batteryLevel: newCycle.batteryLevel ? parseInt(newCycle.batteryLevel) : undefined,
        imageUrl: newCycle.imageUrl || undefined,
      });
      toast.success('Cycle updated successfully');
      setShowEditCycle(false);
      setEditingCycle(null);
      setNewCycle({ code: '', model: '', latitude: '', longitude: '', stationId: '', batteryLevel: '', imageUrl: '' });
      loadCycles();
    } catch (error: any) {
      const zodMessage = error?.response?.data?.errors?.[0]?.message;
      toast.error(zodMessage || error?.response?.data?.message || 'Failed to update cycle');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditCycle = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setNewCycle({
      code: cycle.code,
      model: cycle.model,
      latitude: '',
      longitude: '',
      stationId: cycle.station?._id || '',
      batteryLevel: cycle.batteryLevel?.toString() || '',
      imageUrl: cycle.imageUrl || ''
    });
    setShowEditCycle(true);
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

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Loading cycles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Cycle Management</h2>
        <button
          onClick={() => setShowAddCycle(true)}
          className="flex items-center space-x-2 bg-blue-600 dark:bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Cycle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cycles.map((cycle) => (
          <div key={cycle._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{cycle.code}</h3>
                <p className="text-slate-600 dark:text-gray-300">{cycle.model}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}>
                {cycle.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {cycle.batteryLevel && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-gray-400">Battery:</span>
                  <span className="font-medium text-slate-800 dark:text-gray-200">{cycle.batteryLevel}%</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">Total Rides:</span>
                <span className="font-medium text-slate-800 dark:text-gray-200">{cycle.totalRides}</span>
              </div>
              
              {cycle.station && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-gray-400">Station:</span>
                  <span className="font-medium text-slate-800 dark:text-gray-200">{cycle.station.name}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <select
                value={cycle.status}
                onChange={(e) => handleCycleStatusUpdate(cycle._id, e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 bg-white dark:bg-gray-700 text-slate-800 dark:text-white"
              >
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              
              <button 
                onClick={() => openEditCycle(cycle)}
                className="p-2 text-blue-600 dark:text-purple-400 hover:text-blue-800 dark:hover:text-purple-300 rounded-lg hover:bg-blue-50 dark:hover:bg-purple-900/20"
                title="Edit cycle"
              >
                <Edit className="h-4 w-4" />
              </button>

              <button
                onClick={() => window.location.hash = '/manager/zones'}
                className="p-2 text-purple-600 hover:text-purple-800 rounded-lg hover:bg-purple-50"
                title="Assign to zone"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Cycle Modal */}
      {showAddCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Add New Cycle</h3>
              <button onClick={() => setShowAddCycle(false)} className="text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Code</label>
                  <input value={newCycle.code} onChange={(e) => setNewCycle({ ...newCycle, code: e.target.value })} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Model</label>
                  <input value={newCycle.model} onChange={(e) => setNewCycle({ ...newCycle, model: e.target.value })} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Latitude</label>
                  <input type="number" step="any" value={newCycle.latitude} onChange={(e) => setNewCycle({ ...newCycle, latitude: e.target.value })} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Longitude</label>
                  <input type="number" step="any" value={newCycle.longitude} onChange={(e) => setNewCycle({ ...newCycle, longitude: e.target.value })} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Station (optional)</label>
                  <select
                    value={newCycle.stationId}
                    onChange={(e) => setNewCycle({ ...newCycle, stationId: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500"
                  >
                    <option value="">Unassigned</option>
                    {stations.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Battery % (optional)</label>
                  <input type="number" min={0} max={100} value={newCycle.batteryLevel} onChange={(e) => setNewCycle({ ...newCycle, batteryLevel: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Image URL (optional)</label>
                  <input value={newCycle.imageUrl} onChange={(e) => setNewCycle({ ...newCycle, imageUrl: e.target.value })} placeholder="https://..." className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddCycle(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-blue-600 dark:bg-purple-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cycle Modal */}
      {showEditCycle && editingCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Edit Cycle: {editingCycle.code}</h3>
              <button onClick={() => { setShowEditCycle(false); setEditingCycle(null); }} className="text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleEditCycle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Code</label>
                  <input value={newCycle.code} onChange={(e) => setNewCycle({ ...newCycle, code: e.target.value })} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Model</label>
                  <input value={newCycle.model} onChange={(e) => setNewCycle({ ...newCycle, model: e.target.value })} required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Latitude (optional)</label>
                  <input type="number" step="any" value={newCycle.latitude} onChange={(e) => setNewCycle({ ...newCycle, latitude: e.target.value })} placeholder="Leave blank to keep current" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Longitude (optional)</label>
                  <input type="number" step="any" value={newCycle.longitude} onChange={(e) => setNewCycle({ ...newCycle, longitude: e.target.value })} placeholder="Leave blank to keep current" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Station</label>
                  <select
                    value={newCycle.stationId}
                    onChange={(e) => setNewCycle({ ...newCycle, stationId: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500"
                  >
                    <option value="">Unassigned</option>
                    {stations.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Battery %</label>
                  <input type="number" min={0} max={100} value={newCycle.batteryLevel} onChange={(e) => setNewCycle({ ...newCycle, batteryLevel: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Image URL</label>
                  <input value={newCycle.imageUrl} onChange={(e) => setNewCycle({ ...newCycle, imageUrl: e.target.value })} placeholder="https://..." className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => { setShowEditCycle(false); setEditingCycle(null); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-blue-600 dark:bg-purple-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isCreating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CyclesManagementPage;