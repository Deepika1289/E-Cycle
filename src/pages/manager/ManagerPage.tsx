import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CyclesManagementPage from './CyclesManagementPage';
import RidesTrackingPage from './RidesTrackingPage';
import StationsMonitoringPage from './StationsMonitoringPage';
import IssuesReportingPage from './IssuesReportingPage';
import DashboardPage from './DashboardPage';

// Public version of other manager pages would follow a similar pattern...

export const ManagerPage: React.FC = () => {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cycles-management" element={<CyclesManagementPage />} />
          <Route path="rides-tracking" element={<RidesTrackingPage />} />
          <Route path="stations-monitoring" element={<StationsMonitoringPage />} />
          <Route path="issues-reporting" element={<IssuesReportingPage />} />
          <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};