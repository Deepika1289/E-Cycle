import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Cycle, Ride, Station, Issue, PaginatedResponse } from '../types/management';
import { cyclesApi, ridesApi, stationsApi, issuesApi } from '../services/managementApi';

interface ManagementContextType {
  // Cycles
  cycles: Cycle[];
  loadingCycles: boolean;
  fetchCycles: () => Promise<void>;
  createCycle: (data: Partial<Cycle>) => Promise<Cycle>;
  updateCycle: (id: string, data: Partial<Cycle>) => Promise<Cycle>;
  deleteCycle: (id: string) => Promise<void>;
  
  // Rides
  rides: Ride[];
  loadingRides: boolean;
  fetchRides: () => Promise<void>;
  updateRideStatus: (id: string, status: string) => Promise<void>;
  
  // Stations
  stations: Station[];
  loadingStations: boolean;
  fetchStations: () => Promise<void>;
  updateStationSettings: (id: string, settings: any) => Promise<Station>;
  
  // Issues
  issues: Issue[];
  loadingIssues: boolean;
  fetchIssues: () => Promise<void>;
  createIssue: (data: Partial<Issue>) => Promise<Issue>;
  updateIssueStatus: (id: string, status: string) => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const ManagementContext = createContext<ManagementContextType | undefined>(undefined);

export const ManagementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [loadingRides, setLoadingRides] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Cycles
  const fetchCycles = async () => {
    try {
      setLoadingCycles(true);
      const data = await cyclesApi.getAll();
      setCycles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cycles');
    } finally {
      setLoadingCycles(false);
    }
  };

  const createCycle = async (data: Partial<Cycle>): Promise<Cycle> => {
    try {
      const newCycle = await cyclesApi.create(data);
      await fetchCycles();
      return newCycle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cycle');
      throw err;
    }
  };

  const updateCycle = async (id: string, data: Partial<Cycle>): Promise<Cycle> => {
    try {
      const updatedCycle = await cyclesApi.update(id, data);
      await fetchCycles();
      return updatedCycle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cycle');
      throw err;
    }
  };

  const deleteCycle = async (id: string): Promise<void> => {
    try {
      await cyclesApi.delete(id);
      await fetchCycles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cycle');
      throw err;
    }
  };

  // Rides
  const fetchRides = async () => {
    try {
      setLoadingRides(true);
      const data = await ridesApi.getAll();
      setRides(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rides');
    } finally {
      setLoadingRides(false);
    }
  };

  const updateRideStatus = async (id: string, status: string): Promise<void> => {
    try {
      await ridesApi.updateStatus(id, status);
      await fetchRides();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ride status');
      throw err;
    }
  };

  // Stations
  const fetchStations = async () => {
    try {
      setLoadingStations(true);
      const data = await stationsApi.getAll();
      setStations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
    } finally {
      setLoadingStations(false);
    }
  };

  const updateStationSettings = async (id: string, settings: any): Promise<Station> => {
    try {
      const updatedStation = await stationsApi.updateSettings(id, settings);
      await fetchStations();
      return updatedStation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update station settings');
      throw err;
    }
  };

  // Issues
  const fetchIssues = async () => {
    try {
      setLoadingIssues(true);
      const data = await issuesApi.getAll();
      setIssues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues');
    } finally {
      setLoadingIssues(false);
    }
  };

  const createIssue = async (data: Partial<Issue>): Promise<Issue> => {
    try {
      const newIssue = await issuesApi.create(data);
      await fetchIssues();
      return newIssue;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
      throw err;
    }
  };

  const updateIssueStatus = async (id: string, status: string): Promise<void> => {
    try {
      await issuesApi.updateStatus(id, status);
      await fetchIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update issue status');
      throw err;
    }
  };

  // Error handling
  const clearError = () => setError(null);

  // Initial data loading
  useEffect(() => {
    fetchCycles();
    fetchRides();
    fetchStations();
    fetchIssues();
  }, []);

  return (
    <ManagementContext.Provider
      value={{
        // Cycles
        cycles,
        loadingCycles,
        fetchCycles,
        createCycle,
        updateCycle,
        deleteCycle,
        
        // Rides
        rides,
        loadingRides,
        fetchRides,
        updateRideStatus,
        
        // Stations
        stations,
        loadingStations,
        fetchStations,
        updateStationSettings,
        
        // Issues
        issues,
        loadingIssues,
        fetchIssues,
        createIssue,
        updateIssueStatus,
        
        // Error handling
        error,
        clearError,
      }}
    >
      {children}
    </ManagementContext.Provider>
  );
};

export const useManagement = (): ManagementContextType => {
  const context = useContext(ManagementContext);
  if (context === undefined) {
    throw new Error('useManagement must be used within a ManagementProvider');
  }
  return context;
};

export default ManagementContext;
