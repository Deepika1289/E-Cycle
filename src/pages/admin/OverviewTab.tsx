import React from 'react';
import { 
  Users, 
  Bike, 
  MapPin, 
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
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

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  time: string;
  type: 'user' | 'ride' | 'payment';
}

interface RevenueData {
  date: string;
  amount: number;
}

interface OverviewTabProps {
  stats: AdminStats;
  recentActivity: RecentActivity[];
  revenueData: RevenueData[];
  StatCard: React.ComponentType<any>;
  StatusBadge: React.ComponentType<any>;
  recommendations: AIRecommendation[];
  isRecommendationsLoading: boolean;
  refreshRecommendations: () => void;
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

export const OverviewTab: React.FC<OverviewTabProps> = ({ 
  stats, 
  recentActivity, 
  revenueData, 
  StatCard, 
  StatusBadge,
  recommendations,
  isRecommendationsLoading,
  refreshRecommendations
}) => {
  return (
    <div className="space-y-8">
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

        {/* Stats Cards */ }
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
              value={`₹${stats.totalRevenue.toFixed(0)}`} 
              icon={CreditCard} 
              color="bg-gradient-to-br from-amber-500 to-orange-600"
              trend={{ value: 18, isPositive: true }}
            />
            <StatCard 
              title="Total Rides" 
              value={stats.totalRides} 
              icon={Activity} 
              color="bg-gradient-to-br from-rose-500 to-pink-600"
              trend={{ value: 8, isPositive: true }}
            />
            <StatCard 
              title="Active Rides" 
              value={stats.activeRides} 
              icon={Activity} 
              color="bg-gradient-to-br from-cyan-500 to-sky-600"
              trend={{ value: 2, isPositive: false }}
            />
          </div>
        </div>
      </div>

      {/* System Health & Quick Stats */ }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */ }
        <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">API Status</span>
              <StatusBadge status="Operational" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Database</span>
              <StatusBadge status="Connected" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Payment Gateway</span>
              <StatusBadge status="Active" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">WebSocket</span>
              <StatusBadge status="Connected" />
            </div>
          </div>
        </div>

        {/* Quick Stats */ }
        <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Avg. Ride Duration</span>
              <span className="font-medium text-slate-800 dark:text-white">24 minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Avg. Ride Distance</span>
              <span className="font-medium text-slate-800 dark:text-white">3.2 km</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Avg. Revenue per Ride</span>
              <span className="font-medium text-slate-800 dark:text-white">₹{(stats.totalRevenue / Math.max(stats.totalRides, 1)).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">Cycle Utilization</span>
              <span className="font-medium text-slate-800 dark:text-white">
                {Math.round((stats.activeRides / Math.max(stats.totalCycles, 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Analytics Chart */ }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */ }
        <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-white/20 dark:border-white/10 last:border-0 last:pb-0">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'user' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : activity.type === 'ride' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                }`}>
                  {activity.type === 'user' ? <Users className="h-5 w-5" /> : 
                   activity.type === 'ride' ? <Bike className="h-5 w-5" /> : 
                   <CreditCard className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                    {activity.user}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {activity.action}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Chart */ }
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
      </div>
    </div>
  );
};