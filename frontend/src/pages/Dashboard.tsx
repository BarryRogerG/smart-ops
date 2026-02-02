import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Pause } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboard';
import { workItemsService } from '../services/workItems';
import { usersService } from '../services/users';
import { aiService } from '../services/ai';
import { DashboardData, WorkItem } from '../types';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { MOCK_WORK_ITEMS, MOCK_USERS } from '../data/mockData';

// Default empty dashboard data structure
const EMPTY_DASHBOARD_DATA: DashboardData = {
  openItems: [],
  highPriorityItems: [],
  onHoldItems: [],
  itemsPerUser: [],
};

// Calculate dashboard stats from work items array
function calculateDashboardStats(workItems: WorkItem[], users: any[] = []): DashboardData {
  // Open Items: status is NOT 'done' and NOT 'on_hold' (so 'open' or 'in_progress')
  const openItems = workItems.filter(
    item => item.status !== 'done' && item.status !== 'on_hold'
  );

  // High Priority: priority is 'high' or 'critical'
  const highPriorityItems = workItems.filter(
    item => item.priority === 'high' || item.priority === 'critical'
  );

  // On Hold Items: status is 'on_hold'
  const onHoldItems = workItems.filter(item => item.status === 'on_hold');

  // Items Per User: group by assignedTo
  const itemsPerUserMap = new Map<string, { user: any; itemCount: number }>();
  
  workItems.forEach(item => {
    const assignedTo = item.assignedTo || item.assignedUser?.id || 'unassigned';
    const assignedUser = item.assignedUser || users.find(u => u.id === assignedTo) || {
      id: assignedTo,
      name: assignedTo === 'unassigned' ? 'Unassigned' : 'Unknown User',
      email: '',
      role: 'user' as const,
    };

    if (itemsPerUserMap.has(assignedTo)) {
      const existing = itemsPerUserMap.get(assignedTo)!;
      existing.itemCount += 1;
    } else {
      itemsPerUserMap.set(assignedTo, {
        user: assignedUser,
        itemCount: 1,
      });
    }
  });

  const itemsPerUser = Array.from(itemsPerUserMap.values());

  return {
    openItems,
    highPriorityItems,
    onHoldItems,
    itemsPerUser,
  };
}

export function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before fetching dashboard
    if (!authLoading) {
      loadDashboard();
    }
  }, [authLoading]);

  const loadDashboard = async () => {
    const isShowcaseMode = user?.id === 'guest' || user?.email === 'guest@smartops.com';
    
    try {
      console.log('[Dashboard] Loading dashboard data...');
      
      // In showcase mode, calculate directly from mock data
      if (isShowcaseMode) {
        console.log('[Dashboard] Showcase mode - calculating from mock data');
        const calculatedData = calculateDashboardStats(MOCK_WORK_ITEMS, MOCK_USERS);
        setData(calculatedData);
        setIsLoading(false);
        return;
      }

      // Try to get data from backend API
      const dashboardData = await dashboardService.getDashboardData();
      console.log('[Dashboard] Dashboard data loaded from API:', dashboardData);
      
      // Check if API returned empty data
      const hasData = 
        (dashboardData?.openItems?.length ?? 0) > 0 ||
        (dashboardData?.highPriorityItems?.length ?? 0) > 0 ||
        (dashboardData?.onHoldItems?.length ?? 0) > 0 ||
        (dashboardData?.itemsPerUser?.length ?? 0) > 0;

      if (!hasData) {
        console.log('[Dashboard] API returned empty data, trying to fetch work items directly...');
        // Try to fetch work items directly and calculate stats
        try {
          const allWorkItems = await workItemsService.getAll();
          const allUsers = await usersService.getAll().catch(() => []);
          
          if (Array.isArray(allWorkItems) && allWorkItems.length > 0) {
            console.log('[Dashboard] Calculating stats from fetched work items:', allWorkItems.length);
            const calculatedData = calculateDashboardStats(allWorkItems, allUsers);
            setData(calculatedData);
          } else {
            // Still empty, use mock data as fallback
            console.log('[Dashboard] No work items found, using mock data');
            const calculatedData = calculateDashboardStats(MOCK_WORK_ITEMS, MOCK_USERS);
            setData(calculatedData);
          }
        } catch (fetchError) {
          console.warn('[Dashboard] Failed to fetch work items, using mock data:', fetchError);
          const calculatedData = calculateDashboardStats(MOCK_WORK_ITEMS, MOCK_USERS);
          setData(calculatedData);
        }
      } else {
        // API returned data, use it
        setData({
          openItems: dashboardData?.openItems || [],
          highPriorityItems: dashboardData?.highPriorityItems || [],
          onHoldItems: dashboardData?.onHoldItems || [],
          itemsPerUser: dashboardData?.itemsPerUser || [],
        });
      }
    } catch (error: any) {
      console.error('[Dashboard] Failed to load dashboard:', error);
      
      // On error, calculate from mock data for showcase
      console.log('[Dashboard] Error occurred, calculating from mock data');
      const calculatedData = calculateDashboardStats(MOCK_WORK_ITEMS, MOCK_USERS);
      setData(calculatedData);
      
      // Only show error toast if not in showcase mode
      if (!isShowcaseMode) {
        toast.error('Backend is starting up. Showing sample data...', { duration: 3000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToOnHold = async (item: WorkItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return;
    }

    try {
      await workItemsService.update(item.id, { status: 'on_hold' });
      toast.success(`"${item.title}" moved to On Hold`);
      // Reload dashboard to reflect changes
      await loadDashboard();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update work item');
    }
  };

  const handleGenerate = async () => {
    if (user?.role !== 'manager' && user?.role !== 'admin') return;

    setIsGenerating(true);
    try {
      const generatedSummary = await aiService.generateSummaryFromBackend();
      setSummary(generatedSummary);
    } catch (error: any) {
      if (error.response?.status === 503) {
        toast.error('AI service is not configured. The app works without AI.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to generate summary');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Show loading spinner while auth or data is loading
  if (authLoading || isLoading) {
    return (
      <Layout>
        <LoadingSpinner
          message="Waking up the SmartOps server..."
          subMessage="Please wait a moment while we boot up the backend"
          size="lg"
        />
      </Layout>
    );
  }

  // Ensure data exists with all required arrays (should always be true now, but defensive check)
  const safeData = data || EMPTY_DASHBOARD_DATA;
  const openItems = safeData.openItems || [];
  const highPriorityItems = safeData.highPriorityItems || [];
  const onHoldItems = safeData.onHoldItems || [];
  const itemsPerUser = safeData.itemsPerUser || [];

  const isAdmin = user?.role === 'admin';
  const isGuestUser = user?.email === 'guest@smartops.com' || user?.id === 'guest';

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        {/* Showcase Mode Banner */}
        {isGuestUser && (
          <div className="mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 rounded-lg shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Showcase Mode: Full Admin Access Enabled</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'user' ? 'My Work' : 'Team Overview'}
          </h1>
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              variant="primary"
            >
              Generate AI Summary
            </Button>
          )}
        </div>

        {/* Admin-only Manage Team Section */}
        {isAdmin && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-indigo-900 mb-2">
                  Manage Team
                </h2>
                <p className="text-indigo-700 text-sm mb-4">
                  As an administrator, you can manage users, assign roles, and oversee all team activities.
                </p>
                <Link
                  to="/users"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Go to User Management →
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="text-6xl text-indigo-200">👥</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* AI Summary Card */}
          {summary && (
            <div className="lg:col-span-2 mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-6 shadow-sm relative">
              {/* Mock Mode Badge */}
              {summary.includes('Preview Mode') || summary.includes('System Note') ? (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-300">
                    Mock Mode
                  </span>
                </div>
              ) : null}
              
              <div>
                <h3 className="text-lg font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  AI Summary
                </h3>
                <p className="text-indigo-800 leading-relaxed italic">{summary}</p>
              </div>
            </div>
          )}

          {/* Open Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Open Work Items</h2>
            <div className="space-y-3">
              {!isLoading && openItems.length === 0 ? (
                <p className="text-gray-500">No open items</p>
              ) : (
                openItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="group relative p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <Link
                      to={`/work-items/${item.id}`}
                      className="block"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500">
                            {item.project?.name} • {item.assignedUser?.name || 'Unassigned'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              item.priority === 'critical'
                                ? 'bg-red-100 text-red-800'
                                : item.priority === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {item.priority}
                          </span>
                          {(user?.role === 'admin' || user?.role === 'manager') && (
                            <button
                              onClick={(e) => handleMoveToOnHold(item, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded"
                              title="Move to On Hold"
                              aria-label={`Move "${item.title}" to On Hold`}
                            >
                              <Pause className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
            {openItems.length > 5 && (
              <Link
                to="/work-items"
                className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
              >
                View all ({openItems.length})
              </Link>
            )}
          </div>

          {/* High Priority Issues */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">High Priority Issues</h2>
            <div className="space-y-3">
              {!isLoading && highPriorityItems.length === 0 ? (
                <p className="text-gray-500">No high priority items</p>
              ) : (
                highPriorityItems.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    to={`/work-items/${item.id}`}
                    className="block p-3 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {item.project?.name} • {item.assignedUser?.name || 'Unassigned'}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                        {item.priority}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* On Hold Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">On Hold Items</h2>
            <div className="space-y-3">
              {!isLoading && onHoldItems.length === 0 ? (
                <p className="text-gray-500">No items on hold</p>
              ) : (
                onHoldItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/work-items/${item.id}`}
                    className="block p-3 border border-orange-200 rounded-md hover:bg-orange-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {item.project?.name} • {item.assignedUser?.name || 'Unassigned'}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800">
                        On Hold
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Items Per User */}
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Items Per User</h2>
              <div className="space-y-3">
                {!isLoading && itemsPerUser.length === 0 ? (
                  <p className="text-gray-500">No user data available</p>
                ) : (
                  itemsPerUser.map(({ user, itemCount }) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className="px-3 py-1 text-sm font-semibold rounded bg-indigo-100 text-indigo-800">
                      {itemCount} items
                    </span>
                  </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
