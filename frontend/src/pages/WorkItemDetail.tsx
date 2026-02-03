import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useWorkItem } from '../hooks/useWorkItem';
import { WorkItemType, WorkItemStatus, WorkItemPriority } from '../types';
import { Layout } from '../components/Layout';
import { WorkItemForm } from '../components/WorkItemForm';
import { ActivityHistory } from '../components/ActivityHistory';
import { MOCK_WORK_ITEMS } from '../data/mockData';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  createdAt: string;
}

// Mock comments for showcase mode
const MOCK_COMMENTS: Comment[] = [
  {
    id: 'comment-1',
    userId: 'guest',
    userName: 'Showcase Admin',
    userEmail: 'guest@smartops.com',
    message: 'This task is progressing well. We should prioritize the authentication flow first.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'comment-2',
    userId: 'guest',
    userName: 'Showcase Admin',
    userEmail: 'guest@smartops.com',
    message: 'I\'ve reviewed the requirements. The JWT implementation looks solid.',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  {
    id: 'comment-3',
    userId: 'guest',
    userName: 'Showcase Admin',
    userEmail: 'guest@smartops.com',
    message: 'Let\'s make sure we include password reset functionality in the initial release.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
];

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
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState('');

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

  const handlePostComment = () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      userId: user?.id || 'guest',
      userName: user?.name || 'Guest',
      userEmail: user?.email || 'guest@smartops.com',
      message: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    setComments([comment, ...comments]);
    setNewComment('');
    toast.success('Comment posted');
  };

  const formatCommentTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

        {/* Sticky Header: Tabs + Action Buttons */}
        <div className="mb-6 border-b border-gray-200 sticky top-0 bg-white z-20 pb-0">
          <div className="flex justify-between items-center">
            {/* Tabs */}
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'activity'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Activity History
              </button>
            </nav>

            {/* Action Buttons */}
            {canEdit && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  Edit
                </button>
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <>
            {!isEditing ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Title */}
                  <div className="bg-white shadow rounded-lg p-4">
                    <h1 className="text-3xl font-bold text-gray-900">{displayItem.title}</h1>
                  </div>

                  {/* Description */}
                  <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {displayItem.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="bg-white shadow rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>
                    
                    {/* Comment Input */}
                    <div className="mb-4">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={handlePostComment}
                          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          <Send className="h-4 w-4" />
                          Post
                        </button>
                      </div>
                    </div>

                    {/* Comments List - Scrollable */}
                    <div className="border-t border-gray-200 pt-4 max-h-[400px] overflow-y-auto space-y-0">
                      {comments.length === 0 ? (
                        <p className="text-gray-500 text-sm italic text-center py-4">No comments yet. Be the first to comment!</p>
                      ) : (
                        comments.map((comment, index) => (
                          <div
                            key={comment.id}
                            className={`flex gap-3 p-3 ${
                              index < comments.length - 1 ? 'border-b border-gray-100' : ''
                            } hover:bg-gray-50 transition-colors`}
                          >
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-semibold text-sm">
                                  {getInitials(comment.userName)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Comment Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
                                <span className="text-xs text-gray-500">{comment.userEmail}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">{formatCommentTime(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar Column - Optimized */}
                <div className="space-y-4">
                  {/* Metadata Grid (2 columns) */}
                  <div className="bg-white shadow rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Status */}
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 mb-2">Status</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(displayItem.status)}`}>
                          {displayItem.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>

                      {/* Priority */}
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 mb-2">Priority</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(displayItem.priority)}`}>
                          {displayItem.priority.charAt(0).toUpperCase() + displayItem.priority.slice(1)}
                        </span>
                      </div>

                      {/* Type */}
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 mb-2">Type</h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {displayItem.type.charAt(0).toUpperCase() + displayItem.type.slice(1)}
                        </span>
                      </div>

                      {/* Project */}
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 mb-2">Project</h3>
                        {displayItem.project ? (
                          <p className="text-xs font-medium text-gray-900 truncate" title={displayItem.project.name}>
                            {displayItem.project.name}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No project</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assigned To - Compact (Final element) */}
                  <div className="bg-white shadow rounded-lg p-4">
                    <h3 className="text-xs font-medium text-gray-500 mb-2">Assigned To</h3>
                    {displayItem.assignedUser ? (
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{displayItem.assignedUser.name}</p>
                        <p className="text-xs text-gray-500 truncate">{displayItem.assignedUser.email}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Unassigned</p>
                    )}
                  </div>
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
