import React, { useState } from 'react';
import { X, Bike, Hash, Tag, Battery, MapPin } from 'lucide-react';

interface Station {
  _id: string;
  name: string;
}

interface CycleForm {
  _id: string;
  code: string;
  model: string;
  status: string;
  batteryLevel: number;
  stationId: string;
  latitude: number;
  longitude: number;
}

interface CycleModalProps {
  cycle: CycleForm;
  stations: Station[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onChange: (field: string, value: string | number) => void;
}

const CycleModal: React.FC<CycleModalProps> = ({ cycle, stations, onClose, onSave, onChange }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!cycle.code.trim()) {
      newErrors.code = 'Cycle code is required';
    }
    
    if (!cycle.model.trim()) {
      newErrors.model = 'Model is required';
    }
    
    if (cycle.batteryLevel < 0 || cycle.batteryLevel > 100) {
      newErrors.batteryLevel = 'Battery level must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-white/10">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            {cycle._id ? 'Edit Cycle' : 'Add New Cycle'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cycle Code
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={cycle.code}
                onChange={(e) => onChange('code', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white ${
                  errors.code ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter cycle code"
              />
            </div>
            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Model
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={cycle.model}
                onChange={(e) => onChange('model', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white ${
                  errors.model ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter model"
              />
            </div>
            {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={cycle.status}
              onChange={(e) => onChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
              <option value="AVAILABLE">Available</option>
              <option value="IN_USE">In Use</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Battery Level
            </label>
            <div className="relative">
              <Battery className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="number"
                min="0"
                max="100"
                value={cycle.batteryLevel}
                onChange={(e) => onChange('batteryLevel', parseInt(e.target.value) || 0)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white ${
                  errors.batteryLevel ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter battery level"
              />
            </div>
            {errors.batteryLevel && <p className="mt-1 text-sm text-red-600">{errors.batteryLevel}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Station
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={cycle.stationId}
                onChange={(e) => onChange('stationId', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                <option value="">Select a station</option>
                {stations.map((station) => (
                  <option key={station._id} value={station._id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              {cycle._id ? 'Update Cycle' : 'Add Cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CycleModal;