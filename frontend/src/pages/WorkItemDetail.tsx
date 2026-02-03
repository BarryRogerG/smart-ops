import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useWorkItem } from '../hooks/useWorkItem';
import { WorkItemType, WorkItemStatus, WorkItemPriority } from '../types';
import { Layout } from '../components/Layout';
import { WorkItemForm } from '../components/WorkItemForm';
import { ActivityHistory } from '../components/ActivityHistory';
import { MOCK_WORK_ITEMS } from '../data/mockData';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function WorkItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    workItem,
    projects,
    users,
    isLoading,
    handleSubmit: handleSubmitHook,
    handleDelete: handleDeleteHook,
  } = useWorkItem(id);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const [refreshActivity, setRefreshActivity] = useState(0);

  // Check mock data if API didn't return item
  const isShowcaseMode = user?.id === 'guest' || user?.email === 'guest@smartops.com';
  const mockItem = isShowcaseMode && id ? MOCK_WORK_ITEMS.find(item => item.id === id) : null;
  const displayItem = workItem || mockItem;

  const handleFormSubmit = async (formData: {
    title: string;
    description: string;
    type: WorkItemType;
    status: WorkItemStatus;
    priority: WorkItemPriority;
    assignedTo: string;
    projectId: string;
  }) => {
    setIsSubmitting(true);
    try {
      await handleSubmitHook(formData);
      toast.success('Work item updated');
      setIsEditing(false);
      // Refresh activity logs after update
      setRefreshActivity(prev => prev + 1);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to update work item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this work item?')) return;

    try {
      await handleDeleteHook();
      toast.success('Work item deleted');
      navigate('/work-items');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to delete work item');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner
          message="Loading work item..."
          subMessage="Please wait while we fetch the details"
          size="lg"
        />
      </Layout>
    );
  }

  // Error state: Work item not found
  if (!displayItem) {
    return (
      <Layout>
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white shadow rounded-lg p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Work Item Not Found</h1>
              <p className="text-gray-600 mb-6">
                The work item you're looking for doesn't exist or may have been deleted.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/work-items"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Work Items
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const canEdit = user?.role === 'manager' || user?.role === 'admin' || displayItem.assignedTo === user?.id;
  const canDelete = user?.role === 'admin';

  // Get status and priority colors
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

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            to="/work-items"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activity History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <>
            {!isEditing ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Title */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{displayItem.title}</h1>
                    {canEdit && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {displayItem.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Comments Placeholder */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>
                    <div className="border border-gray-200 rounded-md p-4 min-h-[200px] bg-gray-50">
                      <p className="text-gray-500 text-sm italic">Comments feature coming soon...</p>
                    </div>
                  </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                  {/* Status */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Status</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(displayItem.status)}`}>
                      {displayItem.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Priority</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(displayItem.priority)}`}>
                      {displayItem.priority.charAt(0).toUpperCase() + displayItem.priority.slice(1)}
                    </span>
                  </div>

                  {/* Assigned To */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Assigned To</h3>
                    {displayItem.assignedUser ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{displayItem.assignedUser.name}</p>
                        <p className="text-xs text-gray-500">{displayItem.assignedUser.email}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Unassigned</p>
                    )}
                  </div>

                  {/* Project */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Project</h3>
                    {displayItem.project ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{displayItem.project.name}</p>
                        {displayItem.project.description && (
                          <p className="text-xs text-gray-500 mt-1">{displayItem.project.description}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No project</p>
                    )}
                  </div>

                  {/* Type */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Type</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                      {displayItem.type.charAt(0).toUpperCase() + displayItem.type.slice(1)}
                    </span>
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div className="bg-white shadow rounded-lg p-6">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Edit Work Item
                        </button>
                        {canDelete && (
                          <button
                            onClick={handleDelete}
                            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            Delete Work Item
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <WorkItemForm
                initialData={displayItem}
                projects={projects || []}
                users={users || []}
                currentUserRole={user?.role}
                isLoading={isSubmitting}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
              />
            )}
          </>
        )}

        {activeTab === 'activity' && (
          <ActivityHistory workItemId={displayItem.id} refreshTrigger={refreshActivity} />
        )}
      </div>
    </Layout>
  );
}
