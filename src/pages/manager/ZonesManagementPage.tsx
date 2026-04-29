import React from 'react';
import ZoneManagement from './ZoneManagement';

const ZonesManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Zone Management</h2>
      </div>
      <ZoneManagement />
    </div>
  );
};

export default ZonesManagementPage;