import React from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  walletBalance: number;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

interface UsersTabProps {
  users: User[];
  loadUsers: () => void;
  handleEditUser: (user: User) => void;
  handleSuspendUser: (userId: string, currentStatus: 'ACTIVE' | 'SUSPENDED') => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ 
  users, 
  loadUsers, 
  handleEditUser, 
  handleSuspendUser 
}) => {
  React.useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">User Management</h2>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Total: {users.length} users
        </div>
      </div>

      <div className="backdrop-blur-lg bg-white/30 dark:bg-surface/30 border border-white/20 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/20 dark:divide-white/10">
            <thead className="bg-white/50 dark:bg-surface/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Wallet Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/30 dark:bg-surface/30 divide-y divide-white/20 dark:divide-white/10">
              {users.map((user: any) => (
                <tr key={user._id} className="hover:bg-white/50 dark:hover:bg-surface/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-800 dark:text-white">{user.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : user.role === 'MANAGER'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-white">
                    ₹{user.walletBalance.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'ACTIVE'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {user.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditUser(user)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleSuspendUser(user._id, user.status || 'ACTIVE')}
                      className={`${
                        user.status === 'SUSPENDED'
                          ? 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300'
                          : 'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300'
                      } transition-colors`}
                    >
                      {user.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};