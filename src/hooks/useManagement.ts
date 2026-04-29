import { useState, useCallback } from 'react';
import { Cycle, Ride, Station, Issue } from '../types/management';
import { cyclesApi, ridesApi, stationsApi, issuesApi } from '../services/managementApi';

export const useCycles = () => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCycles = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const data = await cyclesApi.getAll(params);
      setCycles(Array.isArray(data) ? data : data.data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cycles');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCycle = useCallback(async (cycleData: Partial<Cycle>) => {
    try {
      setLoading(true);
      const newCycle = await cyclesApi.create(cycleData);
      setCycles(prev => [...prev, newCycle]);
      return newCycle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cycle');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCycle = useCallback(async (id: string, cycleData: Partial<Cycle>) => {
    try {
      setLoading(true);
      const updatedCycle = await cyclesApi.update(id, cycleData);
      setCycles(prev => prev.map(cycle => 
        cycle._id === id ? updatedCycle : cycle
      ));
      return updatedCycle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cycle');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCycle = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await cyclesApi.delete(id);
      setCycles(prev => prev.filter(cycle => cycle._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cycle');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cycles,
    loading,
    error,
    fetchCycles,
    createCycle,
    updateCycle,
    deleteCycle,
  };
};

export const useRides = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRides = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const data = await ridesApi.getAll(params);
      setRides(Array.isArray(data) ? data : data.data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rides');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRideStatus = useCallback(async (id: string, status: string) => {
    try {
      setLoading(true);
      const updatedRide = await ridesApi.updateStatus(id, status);
      setRides(prev => prev.map(ride => 
        ride._id === id ? { ...ride, status: updatedRide.status } : ride
      ));
      return updatedRide;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ride status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    rides,
    loading,
    error,
    fetchRides,
    updateRideStatus,
  };
};

export const useStations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await stationsApi.getAll();
      setStations(Array.isArray(data) ? data : data.data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStationSettings = useCallback(async (id: string, settings: any) => {
    try {
      setLoading(true);
      const updatedStation = await stationsApi.updateSettings(id, settings);
      setStations(prev => prev.map(station => 
        station._id === id ? { ...station, settings: updatedStation.settings } : station
      ));
      return updatedStation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update station settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stations,
    loading,
    error,
    fetchStations,
    updateStationSettings,
  };
};

export const useIssues = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const data = await issuesApi.getAll();
      setIssues(Array.isArray(data) ? data : data.data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createIssue = useCallback(async (issueData: Partial<Issue>) => {
    try {
      setLoading(true);
      const newIssue = await issuesApi.create(issueData);
      setIssues(prev => [...prev, newIssue]);
      return newIssue;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateIssueStatus = useCallback(async (id: string, status: string) => {
    try {
      setLoading(true);
      const updatedIssue = await issuesApi.updateStatus(id, status);
      setIssues(prev => prev.map(issue => 
        issue._id === id ? { ...issue, status: updatedIssue.status } : issue
      ));
      return updatedIssue;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update issue status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    issues,
    loading,
    error,
    fetchIssues,
    createIssue,
    updateIssueStatus,
  };
};
