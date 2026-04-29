import React, { useEffect, useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Users,
  Bike
} from 'lucide-react';
import { stationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Station {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
  capacity: number;
  availableCycles: number;
  facilities: string[];
}

export const StationsManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [newStation, setNewStation] = useState({
    name: '',
    latitude: 28.6667,
    longitude: 77.2167,
    capacity: 20,
    facilities: [] as string[]
  });

  const facilityOptions = [
    'CHARGING_POINT',
    'SECURITY_CAMERA', 
    'COVERED_PARKING',
    'REPAIR_STATION'
  ];

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setIsLoading(true);
      const response = await stationAPI.getAll();
      setStations(response.data || []);
    } catch (error: any) {
      console.error('Error loading stations:', error);
      toast.error('Failed to load stations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStation = async () => {
    try {
      await stationAPI.create(newStation);
      toast.success('Station created successfully');
      setShowAddModal(false);
      setNewStation({
        name: '',
        latitude: 28.6667,
        longitude: 77.2167,
        capacity: 20,
        facilities: []
      });
      loadStations();
    } catch (error: any) {
      console.error('Error creating station:', error);
      toast.error(error.response?.data?.message || 'Failed to create station');
    }
  };

  const handleUpdateStation = async () => {
    if (!editingStation) return;
    
    try {
      await stationAPI.update(editingStation._id, {
        name: editingStation.name,
        latitude: editingStation.location.coordinates[1],
        longitude: editingStation.location.coordinates[0],
        capacity: editingStation.capacity,
        facilities: editingStation.facilities
      });
      toast.success('Station updated successfully');
      setEditingStation(null);
      loadStations();
    } catch (error: any) {
      console.error('Error updating station:', error);
      toast.error(error.response?.data?.message || 'Failed to update station');
    }
  };

  const handleDeleteStation = async (stationId: string) => {
    if (!confirm('Are you sure you want to delete this station?')) return;
    
    try {
      await stationAPI.delete(stationId);
      toast.success('Station deleted successfully');
      loadStations();
    } catch (error: any) {
      console.error('Error deleting station:', error);
      toast.error(error.response?.data?.message || 'Failed to delete station');
    }
  };

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading stations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Stations</h1>
          <p className="text-slate-600">Add, edit, and manage cycle stations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Station</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search stations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStations.map((station) => (
          <div key={station._id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{station.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">
                    {station.location.coordinates[1].toFixed(4)}, {station.location.coordinates[0].toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingStation(station)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDeleteStation(station._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Capacity:</span>
                <span className="font-medium text-slate-800">{station.capacity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Available Cycles:</span>
                <span className="font-medium text-green-600">{station.availableCycles}</span>
              </div>
              
              {station.facilities.length > 0 && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">Facilities:</p>
                  <div className="flex flex-wrap gap-1">
                    {station.facilities.map((facility) => (
                      <span
                        key={facility}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {facility.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Station Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Add New Station</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  placeholder="Station name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newStation.latitude}
                    onChange={(e) => setNewStation({ ...newStation, latitude: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newStation.longitude}
                    onChange={(e) => setNewStation({ ...newStation, longitude: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={newStation.capacity}
                  onChange={(e) => setNewStation({ ...newStation, capacity: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Facilities</label>
                <div className="space-y-2">
                  {facilityOptions.map((facility) => (
                    <label key={facility} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newStation.facilities.includes(facility)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewStation({
                              ...newStation,
                              facilities: [...newStation.facilities, facility]
                            });
                          } else {
                            setNewStation({
                              ...newStation,
                              facilities: newStation.facilities.filter(f => f !== facility)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-slate-700">{facility.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Station
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Station Modal */}
      {editingStation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Edit Station</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingStation.name}
                  onChange={(e) => setEditingStation({ ...editingStation, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editingStation.location.coordinates[1]}
                    onChange={(e) => setEditingStation({
                      ...editingStation,
                      location: {
                        ...editingStation.location,
                        coordinates: [editingStation.location.coordinates[0], parseFloat(e.target.value)]
                      }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editingStation.location.coordinates[0]}
                    onChange={(e) => setEditingStation({
                      ...editingStation,
                      location: {
                        ...editingStation.location,
                        coordinates: [parseFloat(e.target.value), editingStation.location.coordinates[1]]
                      }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={editingStation.capacity}
                  onChange={(e) => setEditingStation({ ...editingStation, capacity: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Facilities</label>
                <div className="space-y-2">
                  {facilityOptions.map((facility) => (
                    <label key={facility} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingStation.facilities.includes(facility)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingStation({
                              ...editingStation,
                              facilities: [...editingStation.facilities, facility]
                            });
                          } else {
                            setEditingStation({
                              ...editingStation,
                              facilities: editingStation.facilities.filter(f => f !== facility)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-slate-700">{facility.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setEditingStation(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Station
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
