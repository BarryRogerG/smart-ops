import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';

import { workItemsService } from '../services/workItems';
import { projectsService } from '../services/projects';
import { usersService } from '../services/users';
import { WorkItem, Project, User, WorkItemStatus, WorkItemPriority } from '../types';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_WORK_ITEMS, MOCK_PROJECTS, MOCK_USERS } from '../data/mockData';

export function WorkItems() {
  
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add Search State: Create a searchQuery state to track the input text
  const [searchQuery, setSearchQuery] = useState<string>(() => 
  new URLSearchParams(window.location.search).get('search') || ''
);
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState(() => ({
  search: searchParams.get('search') || '',
  status: (searchParams.get('status') as WorkItemStatus) || '',
  priority: (searchParams.get('priority') as WorkItemPriority) || '',
  assignedTo: searchParams.get('assignedTo') || '',
  projectId: searchParams.get('projectId') || '',
}));

  // Update URL when filters change
  const updateURL = useCallback((newFilters: typeof filters) => {
    const params = new URLSearchParams();
    console.log('💎 Current Filter State:', JSON.stringify(filters));
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.priority) params.set('priority', newFilters.priority);
    if (newFilters.assignedTo) params.set('assignedTo', newFilters.assignedTo);
    if (newFilters.projectId) params.set('projectId', newFilters.projectId);
    
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [projs, usrs] = await Promise.all([
          projectsService.getAll(),
          (user?.role === 'admin' || user?.role === 'manager') 
            ? usersService.getAll() 
            : Promise.resolve([]),
        ]);
        // Ensure arrays are always arrays, fallback to mock data
        setProjects(Array.isArray(projs) && projs.length > 0 ? projs : MOCK_PROJECTS);
        setUsers(Array.isArray(usrs) && usrs.length > 0 ? usrs : MOCK_USERS);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Use mock data on error for showcase mode
        setProjects(MOCK_PROJECTS);
        setUsers(MOCK_USERS);
      }
    };
    
    loadInitialData();
  }, [user?.role]);

  // Implement Debouncing: Use a useEffect with a setTimeout (300ms) so that filtering logic only runs after user stops typing
  useEffect(() => {
  const debounceTimer = setTimeout(() => {
    setFilters(prev => ({ ...prev, search: searchQuery }));
  }, 300);

  return () => clearTimeout(debounceTimer);
}, [searchQuery]); // ONLY depend on the text change // Depend on searchQuery and updateURL

// 1. This goes ABOVE the useEffect (outside of any other hooks)
const lastSyncedFilters = useRef(JSON.stringify(filters));

// // 2. This replaces your previous URL Syncer useEffect
useEffect(() => {
const currentFiltersStr = JSON.stringify(filters);
  
//   // Only call updateURL if the ACTUAL data has changed
   if (lastSyncedFilters.current !== currentFiltersStr) {
   updateURL(filters);
   lastSyncedFilters.current = currentFiltersStr;
  }
}, [filters, updateURL]); // Stable: only cares when the final filter object changes

  // Load work items when filters change (but not searchQuery to avoid double calls)
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadData = useCallback(async () => {
  setIsLoading(true);
  try {
    const items = await workItemsService.getAll({
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
      ...(filters.projectId && { projectId: filters.projectId }),
    });
    setWorkItems(Array.isArray(items) && items.length > 0 ? items : MOCK_WORK_ITEMS);
  } catch (error) {
    console.error('Failed to load work items:', error);
    setWorkItems(MOCK_WORK_ITEMS);
  } finally {
    setIsLoading(false);
  }
}, [filters]); // loadData only changes when filters change

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(newFilters);
  };


 const clearFilters = () => {
  const emptyFilters: typeof filters = {
    search: '',
    status: '' as WorkItemStatus,   // Add 'as WorkItemStatus'
    priority: '' as WorkItemPriority, // Add 'as WorkItemPriority'
    assignedTo: '',
    projectId: '',
  };
  setFilters(emptyFilters);
  updateURL(emptyFilters);
};

  const hasActiveFilters = searchQuery || filters.status || filters.priority || filters.assignedTo || filters.projectId;

  const getStatusColor = (status: WorkItemStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: WorkItemPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

 

  // Universal data guards with optional chaining and nullish coalescing
  const safeProjects = (projects ?? []) || MOCK_PROJECTS;
  const safeUsers = (users ?? []) || MOCK_USERS;

  // Filtering Logic: Case-insensitive search in Title, ID, and Assigned To fields
  // Use useMemo for performance - only recalculate when searchQuery or workItems change
  // Fix React Error #310: Ensure filteredItems always returns an array, never undefined/null/object
  const filteredItems = useMemo(() => {
    // Ensure itemsToFilter is always an array - never undefined/null
    const itemsToFilter = Array.isArray(workItems) && workItems.length > 0 
      ? workItems 
      : (Array.isArray(MOCK_WORK_ITEMS) ? MOCK_WORK_ITEMS : []);

    // If no search query, return all items (but ensure it's an array)
    if (!searchQuery || !searchQuery.trim()) {
      return Array.isArray(itemsToFilter) ? itemsToFilter : [];
    }

    const query = String(searchQuery).toLowerCase().trim();

    // Ensure filter always returns an array - defensive filtering
    const filtered = itemsToFilter.filter((item) => {
      // Ensure item exists and is an object (not null/undefined)
      if (!item || typeof item !== 'object') {
        return false;
      }
      
      // Safe string checks - ensure all values are strings before calling toLowerCase
      // This prevents React Error #310 (rendering objects where strings expected)
      const title = String(item?.title || '').toLowerCase();
      const id = String(item?.id || '').toLowerCase();
      const assignedUserName = String(item?.assignedUser?.name || '').toLowerCase();
      const description = String(item?.description || '').toLowerCase();
      
      return (
        title.includes(query) ||
        id.includes(query) ||
        assignedUserName.includes(query) ||
        description.includes(query)
      );
    });

    // Always return an array, never undefined/null/object
    return Array.isArray(filtered) ? filtered : [];
  }, [searchQuery, workItems]);

if (isLoading) {
  return (
    <Layout>
      <div className="p-8 text-center text-gray-500">
        Loading showcase data...
      </div>
    </Layout>
  );
}

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Work Items</h1>
          <Link
            to="/work-items/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Work Item
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, ID, or assigned user..."
                value={searchQuery}
                onChange={(e) => {
                  // Prevent Default Behavior: Update local searchQuery state (not filters directly)
                  e.preventDefault();
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  // Prevent form submission if Enter is pressed
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {/* Senior UI Polish: Clear (X) icon appears only when there is text */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    // Clear search with one click
                    setSearchQuery('');
                    const newFilters = { ...filters, search: '' };
                    setFilters(newFilters);
                    updateURL(newFilters);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Users</option>
                  <option value="unassigned">Unassigned</option>
                  {(safeUsers || []).map((u) => (
                    <option key={u?.id} value={u?.id}>
                      {u?.name ?? 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                value={filters.projectId}
                onChange={(e) => handleFilterChange('projectId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Projects</option>
                {(safeProjects || []).map((project) => (
                  <option key={project?.id} value={project?.id}>
                    {project?.name ?? 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Work Items List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Empty State: Show professional message if no items match search */}
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {searchQuery.trim() ? (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-medium text-gray-700">
                          No results found for "{searchQuery}"
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            const newFilters = { ...filters, search: '' };
                            setFilters(newFilters);
                            updateURL(newFilters);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Clear search
                        </button>
                      </div>
                    ) : (
                      'No work items found'
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/work-items/${item?.id ?? ''}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {item?.title ?? 'Untitled'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item?.type ?? 'task'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(item?.status ?? 'open')}`}
                      >
                        {item?.status ?? 'open'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(item?.priority ?? 'medium')}`}
                      >
                        {item?.priority ?? 'medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item?.assignedUser?.name ?? 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item?.project?.name ?? 'No Project'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/work-items/${item?.id ?? ''}`}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
