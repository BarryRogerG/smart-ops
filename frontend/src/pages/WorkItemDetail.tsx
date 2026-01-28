import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useWorkItem } from '../hooks/useWorkItem';
import { WorkItemType, WorkItemStatus, WorkItemPriority } from '../types';
import { Layout } from '../components/Layout';
import { WorkItemView } from '../components/WorkItemView';
import { WorkItemForm } from '../components/WorkItemForm';

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
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update work item');
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
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete work item');
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
      </div>
    </Layout>
  );
}
