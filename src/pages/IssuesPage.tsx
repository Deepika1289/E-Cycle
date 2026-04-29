import React, { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bike,
  MapPin
} from 'lucide-react';
import { issueAPI, cycleAPI, stationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Issue {
  _id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  cycle?: {
    code: string;
    model: string;
  };
  station?: {
    name: string;
  };
  assignedTo?: {
    name: string;
  };
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

interface Cycle {
  _id: string;
  code: string;
  model: string;
}

interface Station {
  _id: string;
  name: string;
}

export const IssuesPage: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [hasError, setHasError] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'CYCLE_DAMAGE',
    title: '',
    description: '',
    cycleId: '',
    stationId: '',
    priority: 'MEDIUM'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadIssues();
    loadCyclesAndStations();
  }, [statusFilter, typeFilter, priorityFilter]);

  const loadIssues = async () => {
    try {
      setHasError(false);
      setIsLoading(true);
      const params = {
        limit: 20,
        page: 1,
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(priorityFilter && { priority: priorityFilter })
      };

      const response = await issueAPI.getAll(params);
      console.log('Issues response:', response);
      setIssues(response.data.issues || []);
    } catch (error: any) {
      console.error('Error loading issues:', error);
      setHasError(true);
      toast.error('Failed to load issues: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      setIssues([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const loadCyclesAndStations = async () => {
    try {
      const [cyclesResponse, stationsResponse] = await Promise.all([
        cycleAPI.getAll(),
        stationAPI.getAll()
      ]);

      console.log('Cycles response:', cyclesResponse);
      console.log('Stations response:', stationsResponse);
      
      setCycles(cyclesResponse.data.cycles || cyclesResponse.data || []);
      setStations(stationsResponse.data || []);
    } catch (error: any) {
      console.error('Error loading cycles and stations:', error);
      toast.error('Failed to load cycles and stations: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      setCycles([]); // Set to empty array on error
      setStations([]); // Set to empty array on error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await issueAPI.create({
        type: formData.type,
        title: formData.title,
        description: formData.description,
        cycleId: formData.cycleId || undefined,
        stationId: formData.stationId || undefined,
        priority: formData.priority
      });

      toast.success('Issue reported successfully');
      setShowCreateModal(false);
      setFormData({
        type: 'CYCLE_DAMAGE',
        title: '',
        description: '',
        cycleId: '',
        stationId: '',
        priority: 'MEDIUM'
      });
      loadIssues();
    } catch (error: any) {
      console.error('Error creating issue:', error);
      toast.error(error.response?.data?.message || 'Failed to report issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4" />;
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CLOSED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (hasError) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Issues</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            There was an error loading the issues. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              loadIssues();
            }}
            className="inline-block bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Issues</h1>
          <p className="text-gray-600 dark:text-gray-300">Report and track issues with cycles and stations</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Report Issue</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="CYCLE_DAMAGE">Cycle Damage</option>
            <option value="PAYMENT_ISSUE">Payment Issue</option>
            <option value="APP_BUG">App Bug</option>
            <option value="STATION_ISSUE">Station Issue</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {(statusFilter || typeFilter || priorityFilter) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setPriorityFilter('');
              }}
              className="px-3 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Report Issue</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Issue Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="CYCLE_DAMAGE">Cycle Damage</option>
                  <option value="PAYMENT_ISSUE">Payment Issue</option>
                  <option value="APP_BUG">App Bug</option>
                  <option value="STATION_ISSUE">Station Issue</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Detailed description of the issue"
                  required
                />
              </div>

              {(formData.type === 'CYCLE_DAMAGE' || formData.type === 'OTHER') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Related Cycle (Optional)
                  </label>
                  <select
                    value={formData.cycleId}
                    onChange={(e) => setFormData({ ...formData, cycleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a cycle</option>
                    {cycles.map((cycle) => (
                      <option key={cycle._id} value={cycle._id}>
                        {cycle.code} - {cycle.model}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(formData.type === 'STATION_ISSUE' || formData.type === 'OTHER') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Related Station (Optional)
                  </label>
                  <select
                    value={formData.stationId}
                    onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a station</option>
                    {stations.map((station) => (
                      <option key={station._id} value={station._id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-600 transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issues List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading issues...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.length > 0 ? (
            issues.map((issue) => (
              <div key={issue._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{issue.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(issue.status)} dark:bg-opacity-20`}>
                        {getStatusIcon(issue.status)}
                        <span>{issue.status.replace('_', ' ')}</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)} dark:bg-opacity-20`}>
                        {issue.priority}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{issue.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-white">
                        {issue.type.replace('_', ' ')}
                      </span>
                      
                      {issue.cycle && (
                        <div className="flex items-center space-x-1">
                          <Bike className="h-4 w-4 text-gray-900 dark:text-white" />
                          <span className="text-gray-900 dark:text-white">{issue.cycle.code}</span>
                        </div>
                      )}
                      
                      {issue.station && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-gray-900 dark:text-white" />
                          <span className="text-gray-900 dark:text-white">{issue.station.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700 text-sm">
                  <div className="text-gray-500 dark:text-gray-400">
                    Created: {format(new Date(issue.createdAt), 'MMM dd, yyyy HH:mm')}
                    {issue.assignedTo && (
                      <span className="ml-4">
                        Assigned to: <span className="font-medium text-gray-900 dark:text-white">{issue.assignedTo.name}</span>
                      </span>
                    )}
                  </div>
                  
                  {issue.resolution && (
                    <div className="text-right">
                      <p className="text-green-600 dark:text-green-400 font-medium">Resolved</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(issue.updatedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>

                {issue.resolution && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">Resolution:</p>
                    <p className="text-sm text-green-800 dark:text-green-400">{issue.resolution}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No issues found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {statusFilter || typeFilter || priorityFilter
                  ? 'Try adjusting your filters'
                  : 'No issues have been reported yet'
                }
              </p>
              
              {!statusFilter && !typeFilter && !priorityFilter && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-block bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Report First Issue
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};