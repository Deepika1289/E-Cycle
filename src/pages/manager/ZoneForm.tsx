import React, { useState, useEffect } from 'react';

interface ZoneFormProps {
  zone?: any;
  onSave: (zoneData: any) => void;
  onCancel: () => void;
}

const ZoneForm: React.FC<ZoneFormProps> = ({ zone, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    cycleCapacity: 10,
    center: {
      type: 'Point',
      coordinates: [0, 0]
    },
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [0, 0],
          [0, 0],
          [0, 0],
          [0, 0]
        ]
      ]
    }
  });

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name || '',
        description: zone.description || '',
        status: zone.status || 'ACTIVE',
        cycleCapacity: zone.cycleCapacity || 10,
        center: zone.center || {
          type: 'Point',
          coordinates: [0, 0]
        },
        boundary: zone.boundary || {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [0, 0],
              [0, 0],
              [0, 0],
              [0, 0]
            ]
          ]
        }
      });
    }
  }, [zone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cycleCapacity' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          Zone Name*
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div>
        <label htmlFor="cycleCapacity" className="block text-sm font-medium text-slate-700 mb-1">
          Cycle Capacity
        </label>
        <input
          type="number"
          id="cycleCapacity"
          name="cycleCapacity"
          value={formData.cycleCapacity}
          onChange={handleChange}
          min={1}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
        />
      </div>

      <div className="pt-2 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-slate-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          {zone ? 'Update Zone' : 'Create Zone'}
        </button>
      </div>
    </form>
  );
};

export default ZoneForm;