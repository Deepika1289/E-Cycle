// Backup of the current AdminPage.tsx before restoration
import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { 
  Users, 
  Bike, 
  MapPin, 
  CreditCard,
  TrendingUp,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Car,
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [cycles, setCycles] = useState([]);
  const [stations, setStations] = useState([]);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [payments, setPayments] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);

  const loadCycles = async () => {
    try {
      const response = await cycleAPI.getCycles();
      setCycles(response.data.cycles);
    } catch (error: any) {
      console.error('Error loading cycles:', error);
      toast.error('Failed to load cycles');
    }
  };

  const loadStations = async () => {
    try {
      const response = await stationAPI.getStations();
      setStations(response.data.stations);
    } catch (error: any) {
      console.error('Error loading stations:', error);
      toast.error('Failed to load stations');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data.users);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const loadRides = async () => {
    try {
      const response = await rideAPI.getRides();
      setRides(response.data.rides);
    } catch (error: any) {
      console.error('Error loading rides:', error);
      toast.error('Failed to load rides');
    }
  };

  const loadPayments = async () => {
    try {
      const response = await paymentAPI.getPayments();
      setPayments(response.data.payments);
    } catch (error: any) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
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

  const loadAllData = () => {
    loadCycles();
    loadStations();
    loadUsers();
    loadRides();
    loadPayments();
    loadAIRecommendations();
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Add a refresh function that can be called manually
  const handleRefresh = () => {
    loadAllData();
  };

  const refreshRecommendations = () => {
    loadAIRecommendations();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <Plus className="w-4 h-4 mr-2" />
            Add Cycle
          </button>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <Plus className="w-4 h-4 mr-2" />
            Add Station
          </button>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <Plus className="w-4 h-4 mr-2" />
            Add Ride
          </button>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <Plus className="w-4 h-4 mr-2" />
            Add Payment
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={<Users className="w-12 h-12 text-blue-500" />}
            title="Total Users"
            value={users.length}
          />
          <StatCard
            icon={<Bike className="w-12 h-12 text-green-500" />}
            title="Total Cycles"
            value={cycles.length}
          />
          <StatCard
            icon={<MapPin className="w-12 h-12 text-red-500" />}
            title="Total Stations"
            value={stations.length}
          />
          <StatCard
            icon={<CreditCard className="w-12 h-12 text-purple-500" />}
            title="Total Payments"
            value={payments.length}
          />
          <StatCard
            icon={<TrendingUp className="w-12 h-12 text-yellow-500" />}
            title="Total Rides"
            value={rides.length}
          />
          <StatCard
            icon={<Activity className="w-12 h-12 text-pink-500" />}
            title="Active Cycles"
            value={cycles.filter((cycle) => cycle.isActive).length}
          />
          <StatCard
            icon={<BarChart3 className="w-12 h-12 text-teal-500" />}
            title="Active Stations"
            value={stations.filter((station) => station.isActive).length}
          />
          <StatCard
            icon={<ArrowUpRight className="w-12 h-12 text-orange-500" />}
            title="Total Distance"
            value={rides.reduce((total, ride) => total + ride.distance, 0).toFixed(2) + ' km'}
          />
          <StatCard
            icon={<ArrowDownRight className="w-12 h-12 text-gray-500" />}
            title="Total Duration"
            value={rides.reduce((total, ride) => total + ride.duration, 0).toFixed(2) + ' mins'}
          />
        </div>
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Recent Rides</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">ID</th>
                  <th className="border p-2">User</th>
                  <th className="border p-2">Cycle</th>
                  <th className="border p-2">Start Time</th>
                  <th className="border p-2">End Time</th>
                  <th className="border p-2">Distance</th>
                  <th className="border p-2">Duration</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rides.slice(0, 5).map((ride) => (
                  <tr key={ride.id}>
                    <td className="border p-2">{ride.id}</td>
                    <td className="border p-2">{ride.userId}</td>
                    <td className="border p-2">{ride.cycleId}</td>
                    <td className="border p-2">{new Date(ride.startTime).toLocaleString()}</td>
                    <td className="border p-2">{new Date(ride.endTime).toLocaleString()}</td>
                    <td className="border p-2">{ride.distance.toFixed(2)} km</td>
                    <td className="border p-2">{ride.duration.toFixed(2)} mins</td>
                    <td className="border p-2">
                      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Recent Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">ID</th>
                  <th className="border p-2">User</th>
                  <th className="border p-2">Amount</th>
                  <th className="border p-2">Payment Method</th>
                  <th className="border p-2">Payment Date</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((payment) => (
                  <tr key={payment.id}>
                    <td className="border p-2">{payment.id}</td>
                    <td className="border p-2">{payment.userId}</td>
                    <td className="border p-2">${payment.amount.toFixed(2)}</td>
                    <td className="border p-2">{payment.paymentMethod}</td>
                    <td className="border p-2">{new Date(payment.paymentDate).toLocaleString()}</td>
                    <td className="border p-2">
                      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">AI Recommendations</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">Cycle ID</th>
                  <th className="border p-2">Station ID</th>
                  <th className="border p-2">Battery Level</th>
                  <th className="border p-2">Distance</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isRecommendationsLoading ? (
                  <tr>
                    <td className="border p-2" colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                ) : recommendations.length > 0 ? (
                  recommendations.map((recommendation) => (
                    <tr key={recommendation.cycleId}>
                      <td className="border p-2">{recommendation.cycleId}</td>
                      <td className="border p-2">{recommendation.stationId}</td>
                      <td className="border p-2">{recommendation.batteryLevel}%</td>
                      <td className="border p-2">{recommendation.distance.toFixed(2)} km</td>
                      <td className="border p-2">
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border p-2" colSpan={5}>
                      No recommendations available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;