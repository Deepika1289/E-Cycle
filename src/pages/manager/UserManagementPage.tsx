import React, { useState, useEffect } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { userAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  walletBalance: number;
  isVerified: boolean;
  status: string;
  createdAt: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // User modals and state
  const [showSuspendUser, setShowSuspendUser] = useState(false);
  const [suspendingUser, setSuspendingUser] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getAll({ role: 'USER', limit: 100 });
      console.log('Users response:', response);
      setUsers(response.data?.users || response.data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingUser) return;
    
    try {
      await userAPI.suspendUser(suspendingUser._id, 'SUSPENDED');
      toast.success(`User ${suspendingUser.name} has been suspended`);
      setShowSuspendUser(false);
      setSuspendingUser(null);
      setSuspendReason('');
      loadUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId: string, userName: string) => {
    try {
      await userAPI.suspendUser(userId, 'ACTIVE');
      toast.success(`User ${userName} has been activated`);
      loadUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to activate user');
    }
  };

  const openSuspendUser = (user: User) => {
    setSuspendingUser(user);
    setSuspendReason('');
    setShowSuspendUser(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">User Management</h2>
        <button
          onClick={loadUsers}
          className="flex items-center space-x-2 bg-blue-600 dark:bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-purple-700 transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="text-left text-xs font-medium text-slate-600 dark:text-gray-400 uppercase tracking-wider">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Wallet Balance</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-600 dark:text-gray-400">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="text-sm">
                  <td className="px-3 py-2 text-slate-800 dark:text-white">{user.name}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{user.email}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{user.phone}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">₹{user.walletBalance}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-gray-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    {user.status === 'ACTIVE' ? (
                      <button
                        onClick={() => openSuspendUser(user)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivateUser(user._id, user.name)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Suspend User Modal */}
      {showSuspendUser && suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Suspend User</h3>
              <button onClick={() => { setShowSuspendUser(false); setSuspendingUser(null); }} className="text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200">
                ✕
              </button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-slate-800 dark:text-white mb-2">{suspendingUser.name}</h4>
              <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">Email: {suspendingUser.email}</p>
              <p className="text-sm text-slate-600 dark:text-gray-400">Phone: {suspendingUser.phone}</p>
            </div>
            <form onSubmit={handleSuspendUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Reason for Suspension</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter reason for suspending this user..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setShowSuspendUser(false); setSuspendingUser(null); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600">
                  Suspend User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;