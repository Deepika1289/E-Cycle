import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, MapPin, Bike } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { zoneAPI } from '../../services/api/zone';
import { cycleAPI } from '../../services/api';
import ZoneForm from './ZoneForm';

interface Zone {
  _id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  cycleCapacity: number;
  cycleCount?: number;
}

interface Cycle {
  _id: string;
  code: string;
  model: string;
  status: string;
}

const ZoneManagement: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showEditZoneModal, setShowEditZoneModal] = useState(false);
  const [showAssignCyclesModal, setShowAssignCyclesModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedCycles, setSelectedCycles] = useState<string[]>([]);

  useEffect(() => {
    loadZones();
    loadCycles();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const response = await zoneAPI.getAll();
      setZones(response.data?.zones || response.zones || response.data || []);
    } catch (error) {
      console.error('Error loading zones:', error);
      toast.error('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const loadCycles = async () => {
    try {
      const response = await cycleAPI.getAll();
      setCycles(response.data?.cycles || response.cycles || response.data || []);
    } catch (error) {
      console.error('Error loading cycles:', error);
      toast.error('Failed to load cycles');
    }
  };

  const handleAddZone = () => {
    setSelectedZone(null);
    setShowAddZoneModal(true);
  };

  const handleEditZone = (zone: Zone) => {
    setSelectedZone(zone);
    setShowEditZoneModal(true);
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (window.confirm('Are you sure you want to delete this zone?')) {
      try {
        await zoneAPI.delete(zoneId);
        toast.success('Zone deleted successfully');
        loadZones();
      } catch (error) {
        console.error('Error deleting zone:', error);
        toast.error('Failed to delete zone');
      }
    }
  };

  const handleAssignCycles = (zone: Zone) => {
    setSelectedZone(zone);
    setSelectedCycles([]);
    setShowAssignCyclesModal(true);
  };

  const handleSaveZone = async (zoneData: any) => {
    try {
      if (selectedZone) {
        await zoneAPI.update(selectedZone._id, zoneData);
        toast.success('Zone updated successfully');
      } else {
        await zoneAPI.create(zoneData);
        toast.success('Zone created successfully');
      }
      setShowAddZoneModal(false);
      setShowEditZoneModal(false);
      loadZones();
    } catch (error) {
      console.error('Error saving zone:', error);
      toast.error('Failed to save zone');
    }
  };

  const handleAssignCyclesSubmit = async () => {
    if (!selectedZone || selectedCycles.length === 0) return;
    
    try {
      await zoneAPI.assignCycles(selectedZone._id, { cycleIds: selectedCycles });
      toast.success(`${selectedCycles.length} cycles assigned to zone`);
      setShowAssignCyclesModal(false);
      loadZones();
      loadCycles();
    } catch (error) {
      console.error('Error assigning cycles:', error);
      toast.error('Failed to assign cycles to zone');
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Zone Management</h2>
        <button
          onClick={handleAddZone}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          <PlusCircle size={18} />
          <span>Add Zone</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <div key={zone._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-slate-800">{zone.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditZone(zone)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteZone(zone._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <p className="text-slate-600 mb-4">{zone.description || 'No description'}</p>
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-slate-700">
                  <MapPin size={16} className="mr-2" />
                  <span>Status: <span className={zone.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}>{zone.status}</span></span>
                </div>
                <div className="flex items-center text-slate-700">
                  <Bike size={16} className="mr-2" />
                  <span>Capacity: {zone.cycleCapacity}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleAssignCycles(zone)}
                className="w-full mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                Assign Cycles
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Zone Modal would go here */}
      {(showAddZoneModal || showEditZoneModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-slate-800">
              {showAddZoneModal ? 'Add New Zone' : 'Edit Zone'}
            </h3>
            <ZoneForm
              zone={selectedZone}
              onSave={handleSaveZone}
              onCancel={() => {
                setShowAddZoneModal(false);
                setShowEditZoneModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Assign Cycles Modal */}
      {showAssignCyclesModal && selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-slate-800">
              Assign Cycles to {selectedZone.name}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">Select cycles to assign to this zone:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {cycles
                  .filter(cycle => cycle.status !== 'IN_USE')
                  .map(cycle => (
                    <div key={cycle._id} className="flex items-center p-2 border rounded">
                      <input
                        type="checkbox"
                        id={`cycle-${cycle._id}`}
                        checked={selectedCycles.includes(cycle._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCycles([...selectedCycles, cycle._id]);
                          } else {
                            setSelectedCycles(selectedCycles.filter(id => id !== cycle._id));
                          }
                        }}
                        className="mr-2"
                      />
                      <label htmlFor={`cycle-${cycle._id}`} className="flex-1">
                        <span className="font-medium text-slate-800">{cycle.code}</span>
                        <span className="text-sm text-slate-600 ml-2">({cycle.model})</span>
                      </label>
                      <span className={`text-xs px-2 py-1 rounded ${
                        cycle.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                        cycle.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cycle.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAssignCyclesModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-slate-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCyclesSubmit}
                disabled={selectedCycles.length === 0}
                className={`px-4 py-2 rounded-md text-white ${
                  selectedCycles.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Assign {selectedCycles.length} Cycles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneManagement;