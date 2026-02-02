import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useWorkItem } from '../hooks/useWorkItem';
import { WorkItemType, WorkItemStatus, WorkItemPriority } from '../types';
import { Layout } from '../components/Layout';
import { WorkItemView } from '../components/WorkItemView';
import { WorkItemForm } from '../components/WorkItemForm';
import { ActivityHistory } from '../components/ActivityHistory';

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

  if (isLoading) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  if (!workItem) {
    return (
      <Layout>
        <div>Work item not found</div>
      </Layout>
    );
  }

  const canEdit = user?.role === 'manager' || user?.role === 'admin' || workItem.assignedTo === user?.id;
  const canDelete = user?.role === 'admin';

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-4">
          <Link to="/work-items" className="text-indigo-600 hover:text-indigo-800">
            ← Back to Work Items
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
              <WorkItemView
                workItem={workItem}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={() => setIsEditing(true)}
                onDelete={handleDelete}
              />
            ) : (
              <WorkItemForm
                initialData={workItem}
                projects={projects}
                users={users}
                currentUserRole={user?.role}
                isLoading={isSubmitting}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
              />
            )}
          </>
        )}

        {activeTab === 'activity' && (
          <ActivityHistory workItemId={workItem.id} refreshTrigger={refreshActivity} />
        )}
      </div>
    </Layout>
  );
}
