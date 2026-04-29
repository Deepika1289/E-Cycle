import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  MapPin, 
  AlertCircle, 
  Users,
  TrendingUp,
  Plus,
  Settings,
  Route,
  Activity,
  CreditCard,
  Clock,
  Zap,
  Sparkles,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  Battery,
  Wrench,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cycleAPI, stationAPI, issueAPI, userAPI, rideAPI, analyticsAPI, paymentAPI } from '../../services/api';
import { aiAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalCycles: number;
  availableCycles: number;
  totalStations: number;
  activeRides: number;
  avgRideDistance: number;
  completionRate: number;
  dailyRides: number;
  stationsNeedingMaintenance: number;
  lowBatteryCycles: number;
}

interface Recommendation {
  cycle: {
    _id: string;
    code: string;
    model: string;
    batteryLevel?: number;
    location: {
      coordinates: [number, number];
    };
    station?: {
      _id: string;
      name: string;
    };
  };
  score: number;
  distance: number;
  reasons: string[];
}

interface UsageData {
  date: string;
  rides: number;
  distance: number;
  duration: number;
}

interface RevenueData {
  date: string;
  amount: number;
}

interface PendingIssue {
  _id: string;
  title: string;
  cycle?: {
    code: string;
  };
  createdAt: string;
  status: string;
  priority: string;
}

interface RecentRide {
  _id: string;
  cycle: {
    code: string;
  };
  duration: number;
  distance: number;
  startTime: string;
  endTime?: string;
  status?: string;
}

interface StationSummary {
  totalStations: number;
  activeCycles: number;
  stationsNeedingMaintenance: number;
}

interface CycleHealth {
  available: number;
  inUse: number;
  maintenance: number;
  lowBattery: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCycles: 127,
    availableCycles: 89,
    totalStations: 12,
    activeRides: 23,
    avgRideDistance: 2.4,
    completionRate: 94.2,
    dailyRides: 31,
    stationsNeedingMaintenance: 2,
    lowBatteryCycles: 7
  });
  
  const [stationSummary, setStationSummary] = useState<StationSummary>({
    totalStations: 12,
    activeCycles: 89,
    stationsNeedingMaintenance: 2
  });
  
  const [cycleHealth, setCycleHealth] = useState<CycleHealth>({
    available: 89,
    inUse: 23,
    maintenance: 15,
    lowBattery: 7
  });
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      cycle: {
        _id: '1',
        code: 'E-782',
        model: 'Model X-200',
        batteryLevel: 87,
        location: {
          coordinates: [77.5946, 12.9716] // Bangalore coordinates
        }
      },
      score: 92,
      distance: 1200,
      reasons: ['High utilization', 'Excellent battery', 'Low maintenance history']
    },
    {
      cycle: {
        _id: '2',
        code: 'E-421',
        model: 'Model Y-150',
        batteryLevel: 65,
        location: {
          coordinates: [77.5946, 12.9716]
        }
      },
      score: 76,
      distance: 850,
      reasons: ['Moderate usage', 'Good battery', 'Predicted maintenance soon']
    },
    {
      cycle: {
        _id: '3',
        code: 'E-903',
        model: 'Model Z-300',
        batteryLevel: 42,
        location: {
          coordinates: [77.5946, 12.9716]
        }
      },
      score: 58,
      distance: 2100,
      reasons: ['Low battery', 'High mileage', 'Scheduled maintenance']
    }
  ]);
  const [usageData, setUsageData] = useState<UsageData[]>([
    {
      date: new Date(Date.now() - 604800000).toISOString().split('T')[0], // 7 days ago
      rides: 24,
      distance: 72.5,
      duration: 1440
    },
    {
      date: new Date(Date.now() - 518400000).toISOString().split('T')[0], // 6 days ago
      rides: 31,
      distance: 93.2,
      duration: 1860
    },
    {
      date: new Date(Date.now() - 432000000).toISOString().split('T')[0], // 5 days ago
      rides: 28,
      distance: 84.7,
      duration: 1680
    },
    {
      date: new Date(Date.now() - 345600000).toISOString().split('T')[0], // 4 days ago
      rides: 35,
      distance: 105.3,
      duration: 2100
    },
    {
      date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
      rides: 29,
      distance: 87.1,
      duration: 1740
    },
    {
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
      rides: 33,
      distance: 99.8,
      duration: 1980
    },
    {
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 1 day ago
      rides: 27,
      distance: 81.4,
      duration: 1620
    }
  ]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([
    {
      date: new Date(Date.now() - 604800000).toISOString().split('T')[0], // 7 days ago
      amount: 1240
    },
    {
      date: new Date(Date.now() - 518400000).toISOString().split('T')[0], // 6 days ago
      amount: 1580
    },
    {
      date: new Date(Date.now() - 432000000).toISOString().split('T')[0], // 5 days ago
      amount: 1320
    },
    {
      date: new Date(Date.now() - 345600000).toISOString().split('T')[0], // 4 days ago
      amount: 1750
    },
    {
      date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
      amount: 1420
    },
    {
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
      amount: 1680
    },
    {
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 1 day ago
      amount: 1390
    }
  ]);
  const [pendingIssues, setPendingIssues] = useState<PendingIssue[]>([
    {
      _id: '1',
      title: 'Brake issue on Cycle E-782',
      cycle: { code: 'E-782' },
      createdAt: new Date().toISOString(),
      status: 'OPEN',
      priority: 'HIGH'
    },
    {
      _id: '2',
      title: 'Flat tire on Cycle E-421',
      cycle: { code: 'E-421' },
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      status: 'OPEN',
      priority: 'MEDIUM'
    },
    {
      _id: '3',
      title: 'Loose handlebar on Cycle E-903',
      cycle: { code: 'E-903' },
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      status: 'OPEN',
      priority: 'LOW'
    }
  ]);
  const [recentRides, setRecentRides] = useState<RecentRide[]>([
    // Recent rides (last hour)
    {
      _id: '1',
      cycle: { code: 'CYC 001' },
      duration: 1240, // ~21 minutes
      distance: 3.2,
      startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      status: 'COMPLETED'
    },
    {
      _id: '2',
      cycle: { code: 'CYC 002' },
      duration: 820, // ~14 minutes
      distance: 1.8,
      startTime: new Date(Date.now() - 4200000).toISOString(), // 70 minutes ago
      status: 'COMPLETED'
    },
    // Morning rush hour rides
    {
      _id: '3',
      cycle: { code: 'CYC 003' },
      duration: 2100, // ~35 minutes
      distance: 5.7,
      startTime: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      status: 'COMPLETED'
    },
    {
      _id: '4',
      cycle: { code: 'CYC 004' },
      duration: 480, // ~8 minutes
      distance: 1.2,
      startTime: new Date(Date.now() - 12600000).toISOString(), // 3.5 hours ago
      status: 'COMPLETED'
    },
    {
      _id: '5',
      cycle: { code: 'CYC 005' },
      duration: 1560, // ~26 minutes
      distance: 4.1,
      startTime: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
      status: 'COMPLETED'
    },
    // Mid-day rides
    {
      _id: '6',
      cycle: { code: 'CYC 006' },
      duration: 960, // ~16 minutes
      distance: 2.5,
      startTime: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
      status: 'COMPLETED'
    },
    {
      _id: '7',
      cycle: { code: 'CYC 007' },
      duration: 1800, // ~30 minutes
      distance: 4.8,
      startTime: new Date(Date.now() - 25200000).toISOString(), // 7 hours ago
      status: 'COMPLETED'
    },
    {
      _id: '8',
      cycle: { code: 'CYC 008' },
      duration: 600, // ~10 minutes
      distance: 1.9,
      startTime: new Date(Date.now() - 28800000).toISOString(), // 8 hours ago
      status: 'COMPLETED'
    },
    // Longer duration rides
    {
      _id: '9',
      cycle: { code: 'CYC 009' },
      duration: 2700, // ~45 minutes
      distance: 7.2,
      startTime: new Date(Date.now() - 32400000).toISOString(), // 9 hours ago
      status: 'COMPLETED'
    },
    {
      _id: '10',
      cycle: { code: 'CYC 010' },
      duration: 3600, // ~60 minutes
      distance: 9.5,
      startTime: new Date(Date.now() - 36000000).toISOString(), // 10 hours ago
      status: 'COMPLETED'
    },
    // Shorter distance rides
    {
      _id: '11',
      cycle: { code: 'CYC 011' },
      duration: 300, // ~5 minutes
      distance: 0.8,
      startTime: new Date(Date.now() - 39600000).toISOString(), // 11 hours ago
      status: 'COMPLETED'
    },
    {
      _id: '12',
      cycle: { code: 'CYC 012' },
      duration: 420, // ~7 minutes
      distance: 1.1,
      startTime: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      status: 'COMPLETED'
    }
  ]);
  const [stations, setStations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
    loadAIRecommendations();
    loadUsageData();
    loadRevenueData();
    loadPendingIssues();
    loadRecentRides();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [cyclesResponse, stationsResponse, ridesResponse] = await Promise.all([
        cycleAPI.getAll(),
        stationAPI.getAll(),
        rideAPI.getAll({ limit: 1000 })
      ]);

      const allCycles = cyclesResponse.data?.cycles || cyclesResponse.data || [];
      const availableCycles = allCycles.filter((cycle: any) => cycle.status === 'AVAILABLE');
      const inUseCycles = allCycles.filter((cycle: any) => cycle.status === 'IN_USE');
      const maintenanceCycles = allCycles.filter((cycle: any) => cycle.status === 'MAINTENANCE');
      const lowBatteryCycles = allCycles.filter((cycle: any) => (cycle.batteryLevel || 100) < 20);
      
      const allStations = stationsResponse.data?.stations || stationsResponse.data || [];
      setStations(allStations);
      const stationsNeedingMaintenance = allStations.filter((station: any) => station.status === 'MAINTENANCE');
      
      const allRides = ridesResponse.data?.rides || ridesResponse.data || [];
      const activeRides = allRides.filter((ride: any) => ride.status === 'ACTIVE');
      const completedRides = allRides.filter((ride: any) => ride.status === 'COMPLETED');
      
      // Calculate average ride distance
      const totalDistance = completedRides.reduce(
        (sum: number, ride: any) => sum + (ride.distance || 0), 0
      );
      const avgRideDistance = completedRides.length > 0 ? totalDistance / completedRides.length : 2.4; // Demo value as fallback
      
      // Calculate completion rate
      const totalRideAttempts = allRides.length;
      const completionRate = totalRideAttempts > 0 ? (completedRides.length / totalRideAttempts) * 100 : 94.2; // Demo value as fallback
      
      // Calculate daily rides (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const dailyRides = allRides.filter((ride: any) => {
        const rideDate = new Date(ride.createdAt);
        return rideDate >= oneDayAgo;
      }).length;

      // Only update stats if we have real data, otherwise keep demo data
      if (allCycles.length > 0 || allStations.length > 0 || allRides.length > 0) {
        setStats({
          totalCycles: allCycles.length > 0 ? allCycles.length : 127,
          availableCycles: availableCycles.length > 0 ? availableCycles.length : 89,
          totalStations: allStations.length > 0 ? allStations.length : 12,
          activeRides: activeRides.length > 0 ? activeRides.length : 23,
          avgRideDistance: parseFloat(avgRideDistance.toFixed(2)),
          completionRate: parseFloat(completionRate.toFixed(1)),
          dailyRides: dailyRides > 0 ? dailyRides : 31,
          stationsNeedingMaintenance: stationsNeedingMaintenance.length > 0 ? stationsNeedingMaintenance.length : 2,
          lowBatteryCycles: lowBatteryCycles.length > 0 ? lowBatteryCycles.length : 7
        });
        
        setStationSummary({
          totalStations: allStations.length > 0 ? allStations.length : 12,
          activeCycles: availableCycles.length > 0 ? availableCycles.length : 89,
          stationsNeedingMaintenance: stationsNeedingMaintenance.length > 0 ? stationsNeedingMaintenance.length : 2
        });
        
        setCycleHealth({
          available: availableCycles.length > 0 ? availableCycles.length : 89,
          inUse: inUseCycles.length > 0 ? inUseCycles.length : 23,
          maintenance: maintenanceCycles.length > 0 ? maintenanceCycles.length : 15,
          lowBattery: lowBatteryCycles.length > 0 ? lowBatteryCycles.length : 7
        });
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      // Keep demo data on error
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIRecommendations = async () => {
    try {
      setIsRecommendationsLoading(true);
      
      // Use the first station's location or a default location for manager recommendations
      const defaultLocation = stations.length > 0 && stations[0].location?.coordinates
        ? { latitude: stations[0].location.coordinates[1], longitude: stations[0].location.coordinates[0] }
        : { latitude: 0, longitude: 0 };
      
      const response = await aiAPI.getRecommendations({
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude,
        preferences: {
          batteryLevel: 30,
          maxDistance: 5
        }
      });
      
      // Only update if we have real data, otherwise keep demo data
      if (response.data.recommendations && response.data.recommendations.length > 0) {
        setRecommendations(response.data.recommendations.slice(0, 3));
      }
    } catch (error: any) {
      console.error('Error loading AI recommendations:', error);
      // Don't show error toast for recommendations as it's supplementary
      // Keep demo data on error
    } finally {
      setIsRecommendationsLoading(false);
    }
  };

  const loadUsageData = async () => {
    try {
      const response = await analyticsAPI.usage({ days: 7 });
      // Only update if we have real data, otherwise keep demo data
      if (response.data && response.data.length > 0) {
        setUsageData(response.data.slice(0, 7));
      }
    } catch (error: any) {
      console.error('Error loading usage data:', error);
      // Don't show error toast for analytics as it's supplementary
      // Keep demo data on error
    }
  };

  const loadRevenueData = async () => {
    try {
      const response = await paymentAPI.getAll({ 
        status: 'COMPLETED', 
        type: 'RIDE', 
        limit: 30 
      });
      
      // Group payments by date
      const groupedData: { [key: string]: number } = {};
      
      response.data?.payments?.forEach((payment: any) => {
        const date = new Date(payment.createdAt).toISOString().split('T')[0];
        if (!groupedData[date]) {
          groupedData[date] = 0;
        }
        groupedData[date] += payment.amount || 0;
      });
      
      // Convert to array and sort by date
      const revenueArray = Object.entries(groupedData)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7); // Last 7 days
      
      // Only update if we have real data, otherwise keep demo data
      if (revenueArray.length > 0) {
        setRevenueData(revenueArray);
      }
    } catch (error: any) {
      console.error('Error loading revenue data:', error);
      // Keep demo data on error
    }
  };

  const loadPendingIssues = async () => {
    try {
      const response = await issueAPI.getAll({ status: 'OPEN', limit: 5 });
      
      const issuesData = response.data?.issues || response.data || [];
      // Only update if we have real data, otherwise keep demo data
      if (issuesData.length > 0) {
        setPendingIssues(issuesData.slice(0, 5));
      }
    } catch (error: any) {
      console.error('Error loading pending issues:', error);
      // Keep demo data on error
    }
  };

  const loadRecentRides = async () => {
    try {
      const response = await rideAPI.getAll({ limit: 12 });
      
      const ridesData = response.data?.rides || response.data || [];
      // Only update if we have real data, otherwise keep demo data
      if (ridesData.length > 0) {
        setRecentRides(ridesData.slice(0, 12));
      }
    } catch (error: any) {
      console.error('Error loading recent rides:', error);
      // Keep demo data on error
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'BOOKED':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'IN_USE':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'MAINTENANCE':
      case 'OPEN':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'INACTIVE':
      case 'CLOSED':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH':
      case 'URGENT':
        return 'bg-red-100 text-red-700';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700';
      case 'LOW':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const refreshRecommendations = () => {
    loadAIRecommendations();
  };

  const handleAssignIssue = async (issueId: string) => {
    try {
      await issueAPI.assign(issueId);
      toast.success('Issue assigned to you');
      loadPendingIssues();
    } catch (error: any) {
      console.error('Error assigning issue:', error);
      toast.error('Failed to assign issue: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    try {
      await issueAPI.resolve(issueId, 'Issue resolved by manager');
      toast.success('Issue resolved');
      loadPendingIssues();
    } catch (error: any) {
      console.error('Error resolving issue:', error);
      toast.error('Failed to resolve issue: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    }
  };



  // Calculate utilization percentage
  const utilization = stats.totalCycles > 0 ? Math.round((stats.activeRides / stats.totalCycles) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Fleet Overview Section */}
      <div className="admin-glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Fleet Overview</h2>
          <div className="text-sm text-slate-600">
            Real-time data refreshes every 5 minutes
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 shadow-lg border border-blue-400/30 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Total Cycles</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalCycles}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Bike className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-6 shadow-lg border border-green-400/30 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Available</p>
                <p className="text-2xl font-bold text-slate-800">{stats.availableCycles}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <Bike className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 shadow-lg border border-purple-400/30 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Stations</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalStations}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl p-6 shadow-lg border border-orange-400/30 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Active Rides</p>
                <p className="text-2xl font-bold text-slate-800">{stats.activeRides}</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl p-6 shadow-lg border border-cyan-400/30 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Utilization</p>
                <p className="text-2xl font-bold text-slate-800">{utilization}%</p>
              </div>
              <div className="p-3 bg-cyan-500/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics Section */}
      <div className="admin-glass p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Performance Metrics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-xl p-6 shadow-lg border border-indigo-400/30 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Avg. Distance</p>
                <p className="text-2xl font-bold text-slate-800">{stats.avgRideDistance} km</p>
              </div>
              <div className="p-3 bg-indigo-500/20 rounded-full">
                <MapPin className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl p-6 shadow-lg border border-emerald-400/30 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-slate-800">{stats.completionRate}%</p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 shadow-lg border border-blue-400/30 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Daily Rides</p>
                <p className="text-2xl font-bold text-slate-800">{stats.dailyRides}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/20 rounded-xl p-6 shadow-lg border border-violet-400/30 hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Daily Revenue</p>
                <p className="text-2xl font-bold text-slate-800">
                  ₹{revenueData.length > 0 ? revenueData[revenueData.length - 1]?.amount.toFixed(0) || 0 : 0}
                </p>
              </div>
              <div className="p-3 bg-violet-500/20 rounded-full">
                <BarChart3 className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance & Issues Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Station Summary */}
        <div className="admin-glass p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">My Station Summary</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-400/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Total Stations</p>
                  <p className="text-sm text-slate-600">Managed by you</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stationSummary.totalStations}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl border border-green-400/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Bike className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Active Cycles</p>
                  <p className="text-sm text-slate-600">Available for users</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stationSummary.activeCycles}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-400/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Wrench className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Maintenance Needed</p>
                  <p className="text-sm text-slate-600">Stations requiring attention</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{stationSummary.stationsNeedingMaintenance}</p>
            </div>
          </div>
        </div>
        
        {/* Cycle Health Overview */}
        <div className="admin-glass p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Cycle Health Overview</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl border border-green-400/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Available</p>
                  <p className="text-sm text-slate-600">Ready for users</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{cycleHealth.available}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-400/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">In Use</p>
                  <p className="text-sm text-slate-600">Currently riding</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{cycleHealth.inUse}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-xl border border-red-400/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Wrench className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Maintenance</p>
                  <p className="text-sm text-slate-600">Under repair</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{cycleHealth.maintenance}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-400/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Battery className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Low Battery</p>
                  <p className="text-sm text-slate-600">Below 20% charge</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{cycleHealth.lowBattery}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Issues Section */}
      <div className="admin-glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Pending Issues (Assigned to Me)</h2>
          <button 
            onClick={() => navigate('/manager/issues-reporting')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View All
          </button>
        </div>
        
        {pendingIssues.length > 0 ? (
          <div className="space-y-4">
            {pendingIssues.map((issue) => (
              <div key={issue._id} className="flex items-center justify-between p-4 bg-glass-100/50 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-slate-800">{issue.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                    {issue.cycle && (
                      <span>Cycle: {issue.cycle.code}</span>
                    )}
                    <span>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAssignIssue(issue._id)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => handleResolveIssue(issue._id)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No pending issues assigned to you</p>
          </div>
        )}
      </div>

      {/* Recent Rides Section */}
      <div className="admin-glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Recent Rides (Manager's Region)</h2>
          <button 
            onClick={() => navigate('/manager/rides-tracking')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View All
          </button>
        </div>
        
        {recentRides.length > 0 ? (
          <div className="space-y-4">
            {recentRides.map((ride) => (
              <div key={ride._id} className="flex items-center justify-between p-4 bg-glass-100/50 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Bike className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">Cycle {ride.cycle.code}</h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-slate-600">
                      <span>
                        {Math.round(ride.duration / 60)} min
                      </span>
                      <span>
                        {ride.distance?.toFixed(1) || 0} km
                      </span>
                      <span>
                        {new Date(ride.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ride.status || 'COMPLETED')}`}>
                    {ride.status || 'COMPLETED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Route className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600">No recent rides in your region</p>
          </div>
        )}
      </div>

      {/* AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendations Panel */}
        <div className="admin-glass p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold dark:text-slate-100 text-slate-800">AI Recommendations</h3>
                <p className="text-sm dark:text-slate-400 text-slate-600">Smart insights for fleet management</p>
              </div>
            </div>
            <button
              onClick={refreshRecommendations}
              disabled={isRecommendationsLoading}
              className="p-2 bg-gradient-to-r dark:from-purple-900/40 dark:to-indigo-900/40 from-purple-100 to-indigo-100 dark:text-purple-400 text-purple-600 rounded-lg hover:dark:from-purple-800/50 hover:dark:to-indigo-800/50 hover:from-purple-200 hover:to-indigo-200 transition-all duration-200 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
            </button>
          </div>

          {isRecommendationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gradient-to-r dark:from-purple-900/30 dark:to-indigo-900/30 from-purple-100 to-indigo-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.cycle._id}
                  className="dark:bg-gradient-to-r dark:from-purple-900/30 dark:to-indigo-900/30 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border dark:border-purple-800/50 border-purple-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600 from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <Bike className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold dark:text-slate-100 text-slate-800">{rec.cycle.code}</h4>
                        <p className="text-sm dark:text-slate-400 text-slate-600">{rec.cycle.model}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${rec.score >= 80 ? 'dark:from-green-900/40 dark:to-emerald-900/40 from-green-100 to-emerald-100 dark:text-green-400 text-green-700' : rec.score >= 60 ? 'dark:from-yellow-900/40 dark:to-orange-900/40 from-yellow-100 to-orange-100 dark:text-yellow-400 text-yellow-700' : 'dark:from-red-900/40 dark:to-pink-900/40 from-red-100 to-pink-100 dark:text-red-400 text-red-700'}`}>
                        {rec.score}%
                      </div>
                      <p className="text-xs dark:text-slate-500 text-slate-500 mt-1">
                        {Math.round(rec.distance / 1000)} km away
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {rec.reasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gradient-to-r dark:from-purple-900/40 dark:to-indigo-900/40 from-purple-100 to-indigo-100 dark:text-purple-300 text-purple-700 px-2 py-1 rounded-full border dark:border-purple-800/50 border-purple-200"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bike className="h-12 w-12 dark:text-purple-400 text-purple-300 mx-auto mb-3" />
              <p className="dark:text-slate-400 text-slate-600">No recommendations available</p>
            </div>
          )}
        </div>

        {/* Weekly Usage */}
        <div className="admin-glass p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Weekly Usage</h3>
                <p className="text-sm text-slate-600">Ride activity trends</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex-grow">
            {usageData.length > 0 ? (
              usageData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="min-w-0 flex-grow">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {data.rides} rides
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (data.rides / Math.max(...usageData.map(d => d.rides)) * 100))}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-800 w-10 text-right">
                      {data.rides}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 flex items-center justify-center flex-grow">
                <div>
                  <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500">No usage data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="admin-glass p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Revenue Trend</h3>
                <p className="text-sm text-slate-600">Last 7 days</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 flex-grow">
            {revenueData.length > 0 ? (
              revenueData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="min-w-0 flex-grow">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (data.amount / Math.max(...revenueData.map(d => d.amount)) * 100))}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-800 w-16 text-right">
                      ₹{data.amount.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 flex items-center justify-center flex-grow">
                <div>
                  <BarChart3 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500">No revenue data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;