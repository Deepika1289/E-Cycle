import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Bike, 
  MapPin, 
  CreditCard,
  TrendingUp,
  Activity,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { cycleAPI, stationAPI, userAPI, rideAPI, analyticsAPI, paymentAPI, aiAPI } from '../../services/api';
import toast from 'react-hot-toast';
import StatCard from '../../components/admin/StatCard';
import CycleModal from '../../components/admin/CycleModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import { AnalyticsTab } from './AnalyticsTab';

// Interfaces
interface Stats {
  totalUsers: number;
  totalCycles: number;
  totalStations: number;
  totalRevenue: number;
  totalRides: number;
  activeRides: number;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  time: string;
  type: 'user' | 'ride' | 'payment' | 'cycle';
}

interface RevenueData {
  date: string;
  amount: number;
}

interface UsageData {
  date: string;
  rides: number;
  distance: number;
  duration: number;
}

interface Cycle {
  _id: string;
  code: string;
  model: string;
  status: string;
  batteryLevel: number;
  station?: {
    name: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface Station {
  _id: string;
  name: string;
  location: string;
  capacity: number;
  availableCycles: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  walletBalance: number;
}

interface Ride {
  _id: string;
  user: {
    name: string;
  };
  cycle: {
    code: string;
  };
  startTime: string;
  endTime?: string;
  duration: number;
  distance: number;
  cost: number;
  status: string;
}

interface AIRecommendation {
  cycle: {
    _id: string;
    code: string;
    model: string;
  };
  score: number;
  distance: number;
  reasons: string[];
}

const AdminPage: React.FC = () => {
  const _navigate = useNavigate();
  const location = useLocation();
  const [_activeTab, setActiveTab] = useState('dashboard');
  const [_sidebarOpen, _setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 1247,
    totalCycles: 127,
    totalStations: 12,
    totalRevenue: 24560,
    totalRides: 3241,
    activeRides: 23
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      user: 'Alex Johnson',
      action: 'Registered new account',
      time: '2 mins ago',
      type: 'user'
    },
    {
      id: '2',
      user: 'Sarah Miller',
      action: 'Started new ride',
      time: '5 mins ago',
      type: 'ride'
    },
    {
      id: '3',
      user: 'Mike Chen',
      action: 'Completed payment',
      time: '12 mins ago',
      type: 'payment'
    }
  ]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([
    { date: '2023-06-01', amount: 1250 },
    { date: '2023-06-02', amount: 1890 },
    { date: '2023-06-03', amount: 2100 },
    { date: '2023-06-04', amount: 1750 },
    { date: '2023-06-05', amount: 2300 },
    { date: '2023-06-06', amount: 1980 },
    { date: '2023-06-07', amount: 2450 }
  ]);
  const [usageData, setUsageData] = useState<UsageData[]>([
    { date: '2023-06-01', rides: 120, distance: 240, duration: 7200 },
    { date: '2023-06-02', rides: 156, distance: 312, duration: 9360 },
    { date: '2023-06-03', rides: 134, distance: 268, duration: 8040 },
    { date: '2023-06-04', rides: 142, distance: 284, duration: 8520 },
    { date: '2023-06-05', rides: 168, distance: 336, duration: 10080 },
    { date: '2023-06-06', rides: 155, distance: 310, duration: 9300 },
    { date: '2023-06-07', rides: 172, distance: 344, duration: 10320 }
  ]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([
    {
      cycle: {
        _id: '1',
        code: 'CYC 001',
        model: 'Model X-200',
      },
      score: 92,
      distance: 1200,
      reasons: ['High utilization', 'Excellent battery', 'Low maintenance history']
    },
    {
      cycle: {
        _id: '2',
        code: 'CYC 002',
        model: 'Model Y-150',
      },
      score: 76,
      distance: 850,
      reasons: ['Moderate usage', 'Good battery', 'Predicted maintenance soon']
    },
    {
      cycle: {
        _id: '3',
        code: 'CYC 003',
        model: 'Model Z-300',
      },
      score: 58,
      distance: 2100,
      reasons: ['Low battery', 'High mileage', 'Scheduled maintenance']
    }
  ]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<User[]>([]);
  const [approvingId, setApprovingId] = useState<string>('');
  const [rides, setRides] = useState<Ride[]>([
    // Active rides
    {
      _id: 'ride_001',
      user: {
        name: 'Abhi Patel'
      },
      cycle: {
        code: 'CYC 001'
      },
      startTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      duration: 30,
      distance: 4.2,
      cost: 25.50,
      status: 'ACTIVE'
    },
    {
      _id: 'ride_002',
      user: {
        name: 'Harini Sharma'
      },
      cycle: {
        code: 'CYC 002'
      },
      startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      duration: 60,
      distance: 8.7,
      cost: 42.00,
      status: 'ACTIVE'
    },
    {
      _id: 'ride_003',
      user: {
        name: 'Sai Kumar'
      },
      cycle: {
        code: 'CYC 003'
      },
      startTime: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
      duration: 25,
      distance: 3.8,
      cost: 19.75,
      status: 'ACTIVE'
    },
    // Recently completed rides
    {
      _id: 'ride_004',
      user: {
        name: 'Mahesh Reddy'
      },
      cycle: {
        code: 'CYC 004'
      },
      startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      endTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      duration: 60,
      distance: 8.7,
      cost: 42.00,
      status: 'COMPLETED'
    },
    {
      _id: 'ride_005',
      user: {
        name: 'Priya Iyer'
      },
      cycle: {
        code: 'CYC 005'
      },
      startTime: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      endTime: new Date(Date.now() - 8100000).toISOString(), // 2.25 hours ago
      duration: 25,
      distance: 3.8,
      cost: 19.75,
      status: 'COMPLETED'
    },
    {
      _id: 'ride_006',
      user: {
        name: 'Rohan Mehta'
      },
      cycle: {
        code: 'CYC 006'
      },
      startTime: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
      endTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      duration: 120,
      distance: 15.3,
      cost: 76.50,
      status: 'COMPLETED'
    },
    // Morning rides
    {
      _id: 'ride_007',
      user: {
        name: 'Ananya Desai'
      },
      cycle: {
        code: 'CYC 007'
      },
      startTime: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
      endTime: new Date(Date.now() - 15300000).toISOString(), // 4.25 hours ago
      duration: 27,
      distance: 4.1,
      cost: 21.25,
      status: 'COMPLETED'
    },
    {
      _id: 'ride_008',
      user: {
        name: 'Vikram Singh'
      },
      cycle: {
        code: 'CYC 008'
      },
      startTime: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
      endTime: new Date(Date.now() - 19800000).toISOString(), // 5.5 hours ago
      duration: 30,
      distance: 5.2,
      cost: 26.00,
      status: 'COMPLETED'
    },
    // Longer duration rides
    {
      _id: 'ride_009',
      user: {
        name: 'Neha Gupta'
      },
      cycle: {
        code: 'CYC 009'
      },
      startTime: new Date(Date.now() - 25200000).toISOString(), // 7 hours ago
      endTime: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
      duration: 120,
      distance: 18.5,
      cost: 92.50,
      status: 'COMPLETED'
    },
    {
      _id: 'ride_010',
      user: {
        name: 'Karan Joshi'
      },
      cycle: {
        code: 'CYC 010'
      },
      startTime: new Date(Date.now() - 28800000).toISOString(), // 8 hours ago
      endTime: new Date(Date.now() - 25200000).toISOString(), // 7 hours ago
      duration: 60,
      distance: 9.8,
      cost: 49.00,
      status: 'COMPLETED'
    },
    // In progress rides
    {
      _id: 'ride_011',
      user: {
        name: 'Aditi Verma'
      },
      cycle: {
        code: 'CYC 011'
      },
      startTime: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
      duration: 15,
      distance: 2.1,
      cost: 10.50,
      status: 'IN_PROGRESS'
    },
    {
      _id: 'ride_012',
      user: {
        name: 'Rajesh Pillai'
      },
      cycle: {
        code: 'CYC 012'
      },
      startTime: new Date(Date.now() - 2700000).toISOString(), // 45 minutes ago
      duration: 45,
      distance: 6.3,
      cost: 31.50,
      status: 'IN_PROGRESS'
    }
  ]);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [deletingCycleId, setDeletingCycleId] = useState('');
  const [cycleForm, setCycleForm] = useState({
    _id: '',
    code: '',
    model: '',
    status: 'AVAILABLE',
    batteryLevel: 100,
    stationId: '',
    latitude: 0,
    longitude: 0
  });
  const [_isLoading, setIsLoading] = useState(false);

  const getActiveTab = () => {
    const path = location.pathname.split('/').pop() || 'dashboard';
    return path;
  };

  const loadStats = async () => {
    try {
      
      // Load all data in parallel with individual error handling
      const usersPromise = userAPI.getAll({}).catch(error => {
        console.error('Error loading users:', error);
        return { data: { users: [] } };
      });
      
      const cyclesPromise = cycleAPI.getAll().catch(error => {
        console.error('Error loading cycles:', error);
        return { data: { cycles: [] } };
      });
      
      const stationsPromise = stationAPI.getAll().catch(error => {
        console.error('Error loading stations:', error);
        return { data: { stations: [] } };
      });
      
      const ridesPromise = rideAPI.getAll({}).catch(error => {
        console.error('Error loading rides:', error);
        return { data: { rides: [] } };
      });
      
      const paymentsPromise = paymentAPI.getAll({ status: 'COMPLETED', type: 'RIDE' }).catch(error => {
        console.error('Error loading payments:', error);
        return { data: { payments: [] } };
      });

      // Wait for all promises to resolve
      const [usersResponse, cyclesResponse, stationsResponse, ridesResponse, paymentsResponse] = await Promise.all([
        usersPromise,
        cyclesPromise,
        stationsPromise,
        ridesPromise,
        paymentsPromise
      ]);


      // Calculate stats with improved error handling
      const totalUsers = usersResponse?.data?.users?.length || 0;
      const totalCycles = cyclesResponse?.data?.cycles?.length || 0;
      const totalStations = stationsResponse?.data?.stations?.length || 0;
      
      // Calculate rides stats with better error handling
      const allRides = ridesResponse?.data?.rides || [];
      const totalRides = Array.isArray(allRides) ? allRides.length : 0;
      
      // Handle case where rides might not have status field or different status values
      const activeRides = Array.isArray(allRides) 
        ? allRides.filter((ride: any) => {
            // Check multiple possible status values (case insensitive)
            const status = typeof ride?.status === 'string' ? ride.status.toUpperCase() : '';
            return status === 'ACTIVE' || status === 'IN_PROGRESS' || status === 'ONGOING';
          }).length 
        : 0;
      
      // Calculate real revenue from completed ride payments with better error handling
      const payments = paymentsResponse?.data?.payments || [];
      const totalRevenue = Array.isArray(payments) 
        ? payments.reduce((sum: number, payment: any) => sum + (payment?.amount || 0), 0)
        : 0;


      setStats({
        totalUsers,
        totalCycles,
        totalStations,
        totalRevenue,
        totalRides,
        activeRides
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load dashboard statistics');
      // Set default values on error
      setStats({
        totalUsers: 0,
        totalCycles: 0,
        totalStations: 0,
        totalRevenue: 0,
        totalRides: 0,
        activeRides: 0
      });
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Load recent activity from API
      const responses = await Promise.all([
        userAPI.getAll({ limit: 5 }),
        rideAPI.getAll({ limit: 5 }),
        paymentAPI.getAll({ limit: 5 })
      ]);
      
      const [usersResponse, ridesResponse, paymentsResponse] = responses;

      const activity: RecentActivity[] = [];
      
      // Add recent user registrations
      if (usersResponse?.data?.users) {
        usersResponse.data.users.slice(0, 2).forEach((user: any, index: number) => {
          activity.push({
            id: `user-${user._id}`,
            user: user.name,
            action: 'Registered new account',
            time: `${index + 1} mins ago`,
            type: 'user'
          });
        });
      }
      
      // Add recent rides
      if (ridesResponse?.data?.rides) {
        ridesResponse.data.rides.slice(0, 2).forEach((ride: any, index: number) => {
          activity.push({
            id: `ride-${ride._id}`,
            user: ride.user?.name || 'Unknown User',
            action: ride.status === 'ACTIVE' ? 'Started new ride' : 'Ended ride successfully',
            time: `${(index + 1) * 15} mins ago`,
            type: 'ride'
          });
        });
      }
      
      // Add recent payments
      if (paymentsResponse?.data?.payments) {
        paymentsResponse.data.payments.slice(0, 1).forEach((payment: any, index: number) => {
          activity.push({
            id: `payment-${payment._id}`,
            user: 'Customer',
            action: 'Completed payment',
            time: `${(index + 1) * 30} mins ago`,
            type: 'payment'
          });
        });
      }
      
      setRecentActivity(activity);
    } catch (error: any) {
      console.error('Error loading recent activity:', error);
      // Don't show error toast for activity as it's supplementary
    }
  };

  const loadRevenueData = async () => {
    try {
      const response = await paymentAPI.getAll({ 
        status: 'COMPLETED', 
        type: 'RIDE'
      }).catch(error => {
        console.error('Error loading revenue data:', error);
        return { data: [] };
      });
      
      // Group payments by date
      const groupedData: { [key: string]: number } = {};
      
      const payments = response?.data?.payments || response?.data || [];
      if (Array.isArray(payments)) {
        payments.forEach((payment: any) => {
          if (!payment || typeof payment !== 'object') return;
          
          // Extract date from ISO string
          let date = '';
          try {
            date = new Date(payment.createdAt || payment.date || new Date().toISOString()).toISOString().split('T')[0];
          } catch (_error) {
            date = new Date().toISOString().split('T')[0]; // fallback to today
          }
          
          const amount = typeof payment.amount === 'number' ? payment.amount : 0;
          
          if (!groupedData[date]) {
            groupedData[date] = 0;
          }
          groupedData[date] += amount;
        });
      }
      
      // Convert to array and sort by date
      const revenueArray = Object.entries(groupedData)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7); // Last 7 days
      
      setRevenueData(revenueArray);
    } catch (error: any) {
      console.error('Error loading revenue data:', error);
      // Don't show error toast for analytics as it's supplementary
    }
  };

  const loadAnalyticsData = async () => {
    try {
      // Load usage data for analytics
      const usageResponse = await analyticsAPI.usage({ days: 30 });
      // Process usage data for charts if needed
      const usageData = usageResponse.data || [];
      setUsageData(usageData);
      return usageData;
    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      // Don't show error toast for analytics as it's supplementary
      return [];
    }
  };

  const loadAIRecommendations = async () => {
    try {
      setIsRecommendationsLoading(true);
      
      // Use a default location since station location is a string
      const defaultLocation = { latitude: 12.9716, longitude: 77.5946 }; // Default to Bangalore coordinates
      
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

  const loadCycles = async () => {
    try {
      const response = await cycleAPI.getAll();
      setCycles(response.data.cycles || response.data || []);
    } catch (error: any) {
      console.error('Error loading cycles:', error);
      toast.error('Failed to load cycles');
    }
  };

  const loadStations = async () => {
    try {
      const response = await stationAPI.getAll();
      setStations(response.data.stations || response.data || []);
    } catch (error: any) {
      console.error('Error loading stations:', error);
      toast.error('Failed to load stations');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll({});
      setUsers(response.data.users || response.data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const response = await userAPI.getPendingApprovals();
      setPendingApprovals(response.data.pendingManagers || []);
    } catch (_error) {
      console.error('Error loading pending approvals:', _error);
    }
  };

  const handleApproveUser = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    setApprovingId(userId);
    try {
      await userAPI.approveUser(userId, action);
      toast.success(`Manager ${action === 'APPROVE' ? 'approved ✅' : 'rejected ❌'} successfully!`);
      loadPendingApprovals();
      loadUsers();
    } catch (_error) {
      toast.error('Failed to process approval');
    } finally {
      setApprovingId('');
    }
  };

  const loadRides = async () => {
    try {
      const response = await rideAPI.getAll({});
      const ridesData = response.data.rides || response.data || [];
      // Only update if we have real data, otherwise keep demo data
      if (ridesData.length > 0) {
        setRides(ridesData);
      }
    } catch (error: any) {
      console.error('Error loading rides:', error);
      // Keep demo data on error
    }
  };

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      
      // Load all data in parallel with individual error handling
      const results = await Promise.allSettled([
        loadStats(),
        loadRecentActivity(),
        loadRevenueData(),
        loadAnalyticsData(),
        loadAIRecommendations(),
        loadCycles(),
        loadStations(),
        loadUsers(),
        loadRides(),
        loadPendingApprovals()
      ]);
      
      // Check for any rejected promises and log errors
      results.forEach((result, index) => {
        const names = ['loadStats', 'loadRecentActivity', 'loadRevenueData', 'loadAnalyticsData', 'loadAIRecommendations', 'loadCycles', 'loadStations', 'loadUsers', 'loadRides'];
        if (result.status === 'rejected') {
          console.error(`Error loading ${names[index]}:`, result.reason);
        }
      });
      
      setIsLoading(false);
    } catch (_error) {
      console.error('Error loading all data:', error);
      toast.error('Failed to load dashboard data');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    
    // Update active tab when route changes
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Add a refresh function that can be called manually
  const handleRefresh = () => {
    loadAllData();
  };

  const refreshRecommendations = () => {
    loadAIRecommendations();
  };

  const handleAddCycle = () => {
    setCycleForm({
      _id: '',
      code: '',
      model: '',
      status: 'AVAILABLE',
      batteryLevel: 100,
      stationId: '',
      latitude: 0,
      longitude: 0
    });
    setEditingCycle(null);
    setShowCycleModal(true);
  };

  const handleEditCycle = (cycle: Cycle) => {
    setCycleForm({
      _id: cycle._id,
      code: cycle.code,
      model: cycle.model,
      status: cycle.status,
      batteryLevel: cycle.batteryLevel,
      stationId: cycle.station ? cycle.station.name : '',
      latitude: cycle.location ? cycle.location.latitude : 0,
      longitude: cycle.location ? cycle.location.longitude : 0
    });
    setEditingCycle(cycle);
    setShowCycleModal(true);
  };

  const handleSaveCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCycle) {
        // Update existing cycle
        await cycleAPI.update(editingCycle._id, {
          code: cycleForm.code,
          model: cycleForm.model,
          status: cycleForm.status,
          batteryLevel: cycleForm.batteryLevel,
          stationId: cycleForm.stationId || undefined,
          latitude: cycleForm.latitude,
          longitude: cycleForm.longitude
        });
        toast.success('Cycle updated successfully');
      } else {
        // Create new cycle
        await cycleAPI.create({
          code: cycleForm.code,
          model: cycleForm.model,
          batteryLevel: cycleForm.batteryLevel,
          stationId: cycleForm.stationId || undefined,
          latitude: cycleForm.latitude,
          longitude: cycleForm.longitude
        });
        
        toast.success('Cycle created successfully');
      }
      
      setShowCycleModal(false);
      loadCycles(); // Refresh the cycle list
    } catch (error: any) {
      console.error('Error saving cycle:', error);
      toast.error(editingCycle ? 'Failed to update cycle' : 'Failed to create cycle');
    }
  };

  const handleDeleteCycle = async () => {
    try {
      await cycleAPI.delete(deletingCycleId);
      toast.success('Cycle deleted successfully');
      loadCycles();
    } catch (error: any) {
      console.error('Error deleting cycle:', error);
      toast.error('Failed to delete cycle');
    } finally {
      setDeletingCycleId('');
      setShowDeleteConfirm(false);
    }
  };

  const handleEditUser = (_user: User) => {
    // Implement user editing logic here
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      // Suspend the user by setting status to 'SUSPENDED'
      await userAPI.suspendUser(userId, 'SUSPENDED');
      toast.success('User suspended successfully');
      loadUsers();
    } catch (error: any) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      // Activate the user by setting status to 'ACTIVE'
      await userAPI.suspendUser(userId, 'ACTIVE');
      toast.success('User activated successfully');
      loadUsers();
    } catch (error: any) {
      console.error('Error activating user:', error);
      toast.error('Failed to activate user');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your E-Cycle system</p>
          </div>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Content Area with Routes */}
      <Routes>
        <Route index element={
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <StatCard 
                title="Total Users" 
                value={stats.totalUsers} 
                icon={Users} 
                color="bg-gradient-to-br from-blue-500 to-indigo-600"
                trend={{ value: 12, isPositive: true }}
              />
              <StatCard 
                title="Total Cycles" 
                value={stats.totalCycles} 
                icon={Bike} 
                color="bg-gradient-to-br from-green-500 to-emerald-600"
                trend={{ value: 5, isPositive: true }}
              />
              <StatCard 
                title="Stations" 
                value={stats.totalStations} 
                icon={MapPin} 
                color="bg-gradient-to-br from-purple-500 to-violet-600"
                trend={{ value: 3, isPositive: true }}
              />
              <StatCard 
                title="Total Revenue" 
                value={`₹${stats.totalRevenue.toLocaleString()}`} 
                icon={CreditCard} 
                color="bg-gradient-to-br from-amber-500 to-orange-600"
                trend={{ value: 18, isPositive: true }}
              />
              <StatCard 
                title="Total Rides" 
                value={stats.totalRides} 
                icon={TrendingUp} 
                color="bg-gradient-to-br from-cyan-500 to-blue-600"
                trend={{ value: 22, isPositive: true }}
              />
              <StatCard 
                title="Active Rides" 
                value={stats.activeRides} 
                icon={Activity} 
                color="bg-gradient-to-br from-red-500 to-pink-600"
                trend={{ value: 8, isPositive: true }}
              />
            </div>

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="admin-glass-chart p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Daily Revenue (Last 7 Days)</h3>
                  <BarChart3 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                
                <div className="space-y-4">
                  {revenueData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(data.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <div className="flex items-center space-x-3 w-3/5">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (data.amount / Math.max(...revenueData.map(d => d.amount), 1)) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-800 dark:text-white w-16">
                          ₹{data.amount.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800 dark:text-white">Total (7 days)</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                      ₹{revenueData.reduce((sum: number, data: any) => sum + data.amount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="admin-glass-chart p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Activity</h3>
                  <Activity className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'user' ? 'bg-blue-100 dark:bg-blue-900/50' :
                        activity.type === 'ride' ? 'bg-green-100 dark:bg-green-900/50' :
                        activity.type === 'payment' ? 'bg-amber-100 dark:bg-amber-900/50' :
                        'bg-purple-100 dark:bg-purple-900/50'
                      }`}>
                        {activity.type === 'user' ? <User className="h-4 w-4 text-blue-600 dark:text-blue-400" /> :
                         activity.type === 'ride' ? <Bike className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                         activity.type === 'payment' ? <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" /> :
                         <Bike className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{activity.user}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{activity.action}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="admin-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">AI Recommendations</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Smart insights for fleet management</p>
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
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100">{rec.cycle.code}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{rec.cycle.model}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${rec.score >= 80 ? 'dark:from-green-900/40 dark:to-emerald-900/40 from-green-100 to-emerald-100 dark:text-green-400 text-green-700' : rec.score >= 60 ? 'dark:from-yellow-900/40 dark:to-orange-900/40 from-yellow-100 to-orange-100 dark:text-yellow-400 text-yellow-700' : 'dark:from-red-900/40 dark:to-pink-900/40 from-red-100 to-pink-100 dark:text-red-400 text-red-700'}`}>
                            {rec.score}%
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
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
                  <Bike className="h-12 w-12 text-slate-400 dark:text-purple-400 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No recommendations available</p>
                </div>
              )}
            </div>

            {/* Rides Table */}
            <div className="admin-glass p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recent Rides</h3>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
                    <Filter className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20 dark:border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Cycle</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Start Time</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Duration</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Distance</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Cost</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.slice(0, 5).map((ride) => (
                      <tr key={ride._id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-sm text-slate-800 dark:text-white">{ride.user?.name || 'Unknown User'}</td>
                        <td className="py-3 px-4 text-sm text-slate-800 dark:text-white">{ride.cycle?.code || 'Unknown Cycle'}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(ride.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {ride.duration ? `${Math.floor(ride.duration / 60)}m ${ride.duration % 60}s` : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {ride.distance ? `${ride.distance.toFixed(1)} km` : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-white">
                          ₹{ride.cost ? ride.cost.toFixed(2) : '0.00'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ride.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            ride.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            ride.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {ride.status === 'ACTIVE' ? <PauseCircle className="h-3 w-3 mr-1" /> :
                             ride.status === 'COMPLETED' ? <CheckCircle className="h-3 w-3 mr-1" /> :
                             ride.status === 'IN_PROGRESS' ? <Clock className="h-3 w-3 mr-1" /> :
                             <AlertCircle className="h-3 w-3 mr-1" />}
                            {ride.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } />
        
        {/* Cycles Route */}
        <Route path="cycles" element={
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Cycle Management</h2>
              <button 
                onClick={handleAddCycle}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Add Cycle</span>
              </button>
            </div>
            
            <div className="admin-glass p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20 dark:border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Model</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Battery</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Station</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycles.map((cycle) => (
                      <tr key={cycle._id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-white">{cycle.code}</td>
                        <td className="py-3 px-4 text-sm text-slate-800 dark:text-white">{cycle.model}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cycle.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            cycle.status === 'IN_USE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            cycle.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {cycle.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  cycle.batteryLevel > 70 ? 'bg-green-500' :
                                  cycle.batteryLevel > 30 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${cycle.batteryLevel}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{cycle.batteryLevel}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {cycle.station?.name || 'Not assigned'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleEditCycle(cycle)}
                              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeletingCycleId(cycle._id);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } />
        
        {/* Users Route */}
        <Route path="users" element={
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">User Management</h2>

            {/* Pending Manager Approvals */}
            {pendingApprovals.length > 0 && (
              <div className="admin-glass p-6 border-2 border-amber-400/50 dark:border-amber-500/40">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                  <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                    Pending Manager Approvals ({pendingApprovals.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {pendingApprovals.map((manager) => (
                    <div key={manager._id} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/40">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-800 dark:text-white">{manager.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{manager.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">@{manager.username} · {manager.phone}</p>
                        <p className="text-xs text-slate-400">Registered: {new Date(manager.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApproveUser(manager._id.toString(), 'APPROVE')}
                          disabled={approvingId === manager._id.toString()}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {approvingId === manager._id.toString() ? '...' : '✅ Approve'}
                        </button>
                        <button
                          onClick={() => handleApproveUser(manager._id.toString(), 'REJECT')}
                          disabled={approvingId === manager._id.toString()}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {approvingId === manager._id.toString() ? '...' : '❌ Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-glass p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20 dark:border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Phone</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Wallet</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-white">{user.name}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{user.phone}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                            user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-white">
                          ₹{user.walletBalance.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {user.status === 'ACTIVE' ? (
                              <button 
                                onClick={() => handleSuspendUser(user._id)}
                                className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Suspend User"
                              >
                                <PauseCircle className="h-4 w-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleActivateUser(user._id)}
                                className="p-2 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                title="Activate User"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } />
        
        {/* Stations Route */}
        <Route path="stations" element={
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Station Management</h2>
            
            <div className="admin-glass p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20 dark:border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Location</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Capacity</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Available Cycles</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((station) => (
                      <tr key={station._id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-white">{station.name}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{station.location}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{station.capacity}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{station.availableCycles}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } />
        
        {/* Rides Route */}
        <Route path="rides" element={
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Ride Management</h2>
            
            <div className="admin-glass p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20 dark:border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Cycle</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Start Time</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">End Time</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Duration</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Distance</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Cost</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.map((ride) => (
                      <tr key={ride._id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-white">{ride.user?.name || 'Unknown User'}</td>
                        <td className="py-3 px-4 text-sm text-slate-800 dark:text-white">{ride.cycle?.code || 'Unknown Cycle'}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(ride.startTime).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {ride.endTime ? new Date(ride.endTime).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {ride.duration ? `${Math.floor(ride.duration / 60)}m ${ride.duration % 60}s` : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                          {ride.distance ? `${ride.distance.toFixed(1)} km` : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-800 dark:text-white">
                          ₹{ride.cost ? ride.cost.toFixed(2) : '0.00'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ride.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            ride.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {ride.status === 'ACTIVE' ? <PauseCircle className="h-3 w-3 mr-1" /> :
                             ride.status === 'COMPLETED' ? <CheckCircle className="h-3 w-3 mr-1" /> :
                             <AlertCircle className="h-3 w-3 mr-1" />}
                            {ride.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } />
        
        {/* Analytics Route */}
        <Route path="analytics" element={
          <AnalyticsTab 
            stats={stats}
            revenueData={revenueData}
            usageData={usageData} // Pass the usage data to AnalyticsTab
            loadAnalytics={loadAllData}
          />
        } />
      </Routes>

      {/* Modals */}
      {showCycleModal && (
        <CycleModal
          cycle={cycleForm}
          stations={stations}
          onClose={() => setShowCycleModal(false)}
          onSave={handleSaveCycle}
          onChange={(field: string, value: any) => setCycleForm(prev => ({ ...prev, [field]: value }))}
        />
      )}
      
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteCycle}
        />
      )}
    </div>
  );
};

export default AdminPage;