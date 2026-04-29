import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  UserPlus, 
  Bike, 
  Timer,
  MapPinned,
  Sparkles,
  Zap
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalCycles: number;
  totalStations: number;
  totalRevenue: number;
  totalRides: number;
  activeRides: number;
}

interface RevenueData {
  date: string;
  amount: number;
}

// Add the UsageData interface
interface UsageData {
  date: string;
  rides: number;
  distance: number;
  duration: number;
}

// Add AIRecommendation interface
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

interface AnalyticsTabProps {
  stats: AdminStats;
  revenueData: RevenueData[];
  usageData: UsageData[]; // Add usageData prop
  loadAnalytics: () => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ stats, revenueData, usageData, loadAnalytics }) => {
  // Add state for AI recommendations
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

  // Add function to refresh recommendations
  const refreshRecommendations = () => {
    setIsRecommendationsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsRecommendationsLoading(false);
    }, 1000);
  };

  // Remove the useEffect that was causing infinite loop
  // The data is already loaded in the parent component
  
  // Process usage data for charts
  const processUsageData = () => {
    // Get last 7 days of data for the chart
    const last7Days = usageData.slice(-7);
    return last7Days.map(item => ({
      date: item.date,
      amount: item.rides * 15 // Assuming average revenue per ride is ₹15
    }));
  };

  const processedUsageData = processUsageData();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Analytics</h2>
      </div>

      {/* AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendations Panel */}
        <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl p-5 shadow-lg">
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

        {/* Stats Cards */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-200">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">User Growth</h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">+{Math.floor(stats.totalUsers * 0.15)}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">New users this month</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-200">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Ride Completion Rate</h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                    {stats.totalRides > 0 ? Math.min(99.9, ((stats.totalRides - stats.activeRides) / stats.totalRides * 100)).toFixed(1) : '0.0'}%
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Successful ride completions</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Bike className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-200">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Peak Usage Hours</h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">8-10 AM</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Highest demand period</p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Timer className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Daily Rides (Last 7 Days)</h3>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Usage Trend</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {processedUsageData.map((data: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(data.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" 
                    style={{ width: `${(data.amount / 150) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-white w-16 text-right">
                  {data.amount} rides
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800 dark:text-white">Total Rides (7 days)</span>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              {processedUsageData.reduce((sum: number, data: any) => sum + data.amount, 0)} rides
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Daily Revenue (Last 7 Days)</h3>
          <div className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Revenue Trend</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {revenueData.map((data: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(data.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full" 
                    style={{ width: `${(data.amount / 1500) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-white w-16 text-right">
                  ₹{data.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800 dark:text-white">Total (7 days)</span>
            <span className="text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              ₹{revenueData.reduce((sum: number, data: any) => sum + data.amount, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Station Distribution Map</h3>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-xl h-64 flex items-center justify-center border border-white/20 dark:border-white/10">
          <div className="text-center">
            <MapPinned className="h-12 w-12 text-indigo-500 dark:text-indigo-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">Interactive map visualization</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Showing {stats.totalStations} stations across the city</p>
          </div>
        </div>
      </div>
    </div>
  );
};