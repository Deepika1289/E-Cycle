import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertCircle, 
  User
} from 'lucide-react';
import { issueAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Issue {
  _id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  user: {
    name: string;
  } | null;
  cycle?: {
    code: string;
    model: string;
  } | null;
  station?: {
    name: string;
  } | null;
  createdAt: string;
}

// Helper function to safely format dates
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString();
  } catch (error) {
    return 'Invalid Date';
  }
};

// Helper function to safely format issue types
const formatIssueType = (type: string): string => {
  if (!type) return 'Unknown Type';
  return type.replace(/_/g, ' ');
};

// Helper function to safely format status
const formatStatus = (status: string): string => {
  if (!status) return 'Unknown Status';
  return status.replace(/_/g, ' ');
};

// Helper function to safely format priority
const formatPriority = (priority: string): string => {
  if (!priority) return 'Unknown Priority';
  return priority;
};

// Helper function to safely format title
const formatTitle = (title: string): string => {
  if (!title) return 'Untitled Issue';
  return title;
};

// Helper function to safely get issue ID
const getIssueId = (issue: Issue): string => {
  return issue._id || `issue-${Date.now()}-${Math.random()}`;
};

// Helper function to check if issue can be assigned
const canAssignIssue = (status: string): boolean => {
  if (!status) return false;
  return status.toUpperCase() === 'OPEN';
};

// Helper function to check if issue can be resolved
const canResolveIssue = (status: string): boolean => {
  if (!status) return false;
  const upperStatus = status.toUpperCase();
  return upperStatus === 'OPEN' || upperStatus === 'IN_PROGRESS';
};

// Helper function to close resolve modal
const closeResolveModal = (
  setShowResolveIssue: React.Dispatch<React.SetStateAction<boolean>>,
  setResolvingIssue: React.Dispatch<React.SetStateAction<Issue | null>>,
  setResolution: React.Dispatch<React.SetStateAction<string>>
) => {
  setShowResolveIssue(false);
  setResolvingIssue(null);
  setResolution('');
};

const IssuesReportingPage: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Issue modals and state
  const [showResolveIssue, setShowResolveIssue] = useState(false);
  const [resolvingIssue, setResolvingIssue] = useState<Issue | null>(null);
  const [resolution, setResolution] = useState('');
  
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Cleanup function to set isMountedRef to false when component unmounts
    return () => {
      isMountedRef.current = false;
      // Close modal when component unmounts
      closeResolveModal(setShowResolveIssue, setResolvingIssue, setResolution);
    };
  }, []);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setIsLoading(true);
      const response = await issueAPI.getAll({ limit: 100 });
      console.log('Issues response:', response);
      
      // Handle different response structures
      let issuesData: Issue[] = [];
      if (response.data?.issues) {
        issuesData = response.data.issues;
      } else if (Array.isArray(response.data)) {
        issuesData = response.data;
      } else if (response.data) {
        issuesData = [response.data];
      }
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIssues(issuesData);
      }
    } catch (error: any) {
      console.error('Error loading issues:', error);
      
      // Only show error and update state if component is still mounted
      if (isMountedRef.current) {
        // Handle different types of errors
        if (error.response) {
          // Server responded with error status
          if (error.response.status === 401) {
            toast.error('Authentication required. Please log in again.');
          } else if (error.response.status === 403) {
            toast.error('Access denied. You do not have permission to view issues.');
          } else {
            toast.error('Failed to load issues: ' + (error.response.data?.message || error.message || 'Server error'));
          }
        } else if (error.request) {
          // Request was made but no response received
          toast.error('Network error. Please check your connection and try again.');
        } else {
          // Something else happened
          toast.error('An unexpected error occurred: ' + (error.message || 'Unknown error'));
        }
        
        setIssues([]); // Set to empty array on error
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    // Handle null/undefined status
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'BOOKED':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'IN_USE':
        return 'bg-orange-100 text-orange-800';
      case 'MAINTENANCE':
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'INACTIVE':
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      case 'RESOLVED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    // Handle null/undefined priority
    if (!priority) return 'bg-gray-100 text-gray-800';
    
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

  const handleResolveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIssue || !resolution.trim()) {
      toast.error('Please provide a resolution');
      return;
    }
    
    // Validate issue ID
    if (!resolvingIssue._id) {
      toast.error('Invalid issue ID');
      return;
    }
    
    // Validate resolution text
    if (resolution.trim().length < 10) {
      toast.error('Resolution must be at least 10 characters long');
      return;
    }
    
    try {
      await issueAPI.resolve(resolvingIssue._id, resolution.trim());
      toast.success('Issue resolved successfully');
      
      // Only close modal and update state if component is still mounted
      if (isMountedRef.current) {
        closeResolveModal(setShowResolveIssue, setResolvingIssue, setResolution);
        loadIssues();
      }
    } catch (error: any) {
      console.error('Error resolving issue:', error);
      
      // Handle different types of errors
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Authentication required. Please log in again.');
        } else if (error.response.status === 403) {
          toast.error('Access denied. You do not have permission to resolve issues.');
        } else if (error.response.status === 404) {
          toast.error('Issue not found.');
        } else {
          toast.error(error.response.data?.message || 'Failed to resolve issue');
        }
      } else if (error.request) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('An unexpected error occurred: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const openResolveIssue = (issue: Issue) => {
    setResolvingIssue(issue);
    setResolution('');
    setShowResolveIssue(true);
  };

  const handleAssignIssue = async (issueId: string) => {
    // Validate issue ID
    if (!issueId) {
      toast.error('Invalid issue ID');
      return;
    }
    
    try {
      await issueAPI.assign(issueId);
      toast.success('Issue assigned to you');
      
      // Only load issues if component is still mounted
      if (isMountedRef.current) {
        loadIssues();
      }
    } catch (error: any) {
      console.error('Error assigning issue:', error);
      
      // Handle different types of errors
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Authentication required. Please log in again.');
        } else if (error.response.status === 403) {
          toast.error('Access denied. You do not have permission to assign issues.');
        } else if (error.response.status === 404) {
          toast.error('Issue not found.');
        } else {
          toast.error(error.response.data?.message || 'Failed to assign issue');
        }
      } else if (error.request) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('An unexpected error occurred: ' + (error.message || 'Unknown error'));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Loading issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Issue Management</h2>
      </div>

      <div className="space-y-4">
        {issues.map((issue) => (
          <div key={getIssueId(issue)} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{formatTitle(issue.title)}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                    {formatStatus(issue.status)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                    {formatPriority(issue.priority)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-gray-400">
                  <span className="bg-gray-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 px-2 py-1 rounded">
                    {formatIssueType(issue.type)}
                  </span>
                  <span>Reported by: {issue.user?.name || 'Unknown User'}</span>
                  <span>{formatDate(issue.createdAt)}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {canAssignIssue(issue.status) && (
                  <button
                    onClick={() => handleAssignIssue(issue._id)}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
                  >
                    Assign to Me
                  </button>
                )}
                
                {canResolveIssue(issue.status) && (
                  <button
                    onClick={() => openResolveIssue(issue)}
                    className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm"
                  >
                    Resolve
                  </button>
                )}
                
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-slate-700 dark:text-gray-300">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}

        {issues.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No issues found</h3>
            <p className="text-slate-600 dark:text-gray-400">All issues have been resolved!</p>
          </div>
        )}
      </div>

      {/* Resolve Issue Modal */}
      {showResolveIssue && resolvingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Resolve Issue</h3>
              <button 
                onClick={() => closeResolveModal(setShowResolveIssue, setResolvingIssue, setResolution)} 
                className="text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-slate-800 dark:text-white mb-2">{formatTitle(resolvingIssue.title)}</h4>
              <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">Type: {formatIssueType(resolvingIssue.type)}</p>
              <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">Priority: {formatPriority(resolvingIssue.priority)}</p>
              <p className="text-sm text-slate-600 dark:text-gray-400">Reported by: {resolvingIssue.user?.name || 'Unknown User'}</p>
            </div>
            <form onSubmit={handleResolveIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Resolution Details</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  required
                  rows={4}
                  placeholder="Describe how the issue was resolved..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => closeResolveModal(setShowResolveIssue, setResolvingIssue, setResolution)} 
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600">
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuesReportingPage;