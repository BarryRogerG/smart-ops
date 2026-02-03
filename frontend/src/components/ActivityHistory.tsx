import { useEffect, useState } from 'react';
import { ActivityLog } from '../types';
import { activityLogsService } from '../services/activityLogs';
import { Clock, User, ArrowRight } from 'lucide-react';

interface ActivityHistoryProps {
  workItemId: string;
  refreshTrigger?: number;
}

// Mock activity logs for showcase mode
const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    workItemId: '',
    userId: 'guest',
    action: 'created',
    fieldName: null,
    oldValue: null,
    newValue: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 'guest',
      name: 'Showcase Admin',
      email: 'guest@smartops.com',
      role: 'admin',
    },
  },
  {
    id: 'log-2',
    workItemId: '',
    userId: 'guest',
    action: 'status_changed',
    fieldName: 'status',
    oldValue: 'open',
    newValue: 'in_progress',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 'guest',
      name: 'Showcase Admin',
      email: 'guest@smartops.com',
      role: 'admin',
    },
  },
  {
    id: 'log-3',
    workItemId: '',
    userId: 'guest',
    action: 'updated',
    fieldName: 'description',
    oldValue: null,
    newValue: 'Updated description',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 'guest',
      name: 'Showcase Admin',
      email: 'guest@smartops.com',
      role: 'admin',
    },
  },
];

export function ActivityHistory({ workItemId, refreshTrigger }: ActivityHistoryProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const activityLogs = await activityLogsService.getByWorkItemId(workItemId);
        setLogs(activityLogs || []);
      } catch (error) {
        console.error('Failed to load activity logs:', error);
        // Check if we're in showcase mode (no real backend)
        const isShowcaseMode = window.location.hostname.includes('onrender.com') || 
                              !import.meta.env.VITE_API_URL ||
                              import.meta.env.VITE_API_URL.includes('localhost');
        
        if (isShowcaseMode) {
          // Use mock data in showcase mode
          setLogs(MOCK_ACTIVITY_LOGS.map(log => ({ ...log, workItemId })));
        } else {
          // Set error state for graceful fallback
          setError('Unable to load activity history. Please try again later.');
          setLogs([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (workItemId) {
      loadLogs();
    } else {
      setIsLoading(false);
      setError('No work item ID provided');
    }
  }, [workItemId, refreshTrigger]);

  const formatAction = (action: string, fieldName?: string | null) => {
    switch (action) {
      case 'created':
        return 'Created';
      case 'updated':
        return `Updated ${fieldName || 'item'}`;
      case 'status_changed':
        return 'Status changed';
      case 'priority_changed':
        return 'Priority changed';
      case 'assigned':
        return 'Assigned';
      case 'unassigned':
        return 'Unassigned';
      case 'deleted':
        return 'Deleted';
      default:
        return action;
    }
  };

  const formatValue = (value: string | null | undefined, fieldName?: string | null) => {
    if (!value) return '—';
    
    // Format status values
    if (fieldName === 'status') {
      return value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    // Format priority values
    if (fieldName === 'priority') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    
    // Format assignedTo (user IDs) - show as "User" or "Unassigned"
    if (fieldName === 'assignedTo') {
      return value === 'Unassigned' || !value ? 'Unassigned' : 'User';
    }
    
    return value;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'status_changed':
        return 'bg-blue-100 text-blue-800';
      case 'priority_changed':
        return 'bg-orange-100 text-orange-800';
      case 'assigned':
      case 'unassigned':
        return 'bg-purple-100 text-purple-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity History</h2>
        <div className="text-center py-8 text-gray-500">Loading activity logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity History</h2>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">{error}</p>
          <p className="text-sm text-gray-400">No history found for this work item.</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity History</h2>
        <div className="text-center py-8 text-gray-500">No activity logs yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity History</h2>
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0">
            {/* Timeline dot */}
            <div className="absolute left-0 top-0 -ml-2">
              <div className={`h-4 w-4 rounded-full ${getActionColor(log.action)} border-2 border-white shadow-sm`} />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                    {formatAction(log.action, log.fieldName)}
                  </span>
                  {log.user && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <User className="h-3 w-3" />
                      <span>{log.user.name}</span>
                    </div>
                  )}
                </div>

                {/* Show old and new values for changes */}
                {(log.oldValue || log.newValue) && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    {log.oldValue && (
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                        {formatValue(log.oldValue, log.fieldName)}
                      </span>
                    )}
                    {log.oldValue && log.newValue && (
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    )}
                    {log.newValue && (
                      <span className="px-2 py-1 bg-indigo-100 rounded text-indigo-700 font-medium">
                        {formatValue(log.newValue, log.fieldName)}
                      </span>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
