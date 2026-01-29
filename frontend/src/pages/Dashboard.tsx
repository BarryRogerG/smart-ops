import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboard';
import { aiService } from '../services/ai';
import { DashboardData } from '../types';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { toast } from 'react-hot-toast';

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await dashboardService.getDashboardData();
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <Layout>
        <div>Loading dashboard...</div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div>Failed to load dashboard</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
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
              {data.openItems.length === 0 ? (
                <p className="text-gray-500">No open items</p>
              ) : (
                data.openItems.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    to={`/work-items/${item.id}`}
                    className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {item.project?.name} • {item.assignedUser?.name || 'Unassigned'}
                        </p>
                      </div>
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
                    </div>
                  </Link>
                ))
              )}
            </div>
            {data.openItems.length > 5 && (
              <Link
                to="/work-items"
                className="mt-4 text-sm text-indigo-600 hover:text-indigo-800"
              >
                View all ({data.openItems.length})
              </Link>
            )}
          </div>

          {/* High Priority Issues */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">High Priority Issues</h2>
            <div className="space-y-3">
              {data.highPriorityItems.length === 0 ? (
                <p className="text-gray-500">No high priority items</p>
              ) : (
                data.highPriorityItems.slice(0, 5).map((item) => (
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

          {/* Blocked Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Blocked Items</h2>
            <div className="space-y-3">
              {data.blockedItems.length === 0 ? (
                <p className="text-gray-500">No blocked items</p>
              ) : (
                data.blockedItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/work-items/${item.id}`}
                    className="block p-3 border border-yellow-200 rounded-md hover:bg-yellow-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {item.project?.name} • {item.assignedUser?.name || 'Unassigned'}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
                        Blocked
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
                {data.itemsPerUser.map(({ user, itemCount }) => (
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
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
