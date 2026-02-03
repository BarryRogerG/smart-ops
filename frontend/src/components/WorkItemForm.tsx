import { useState, useEffect } from 'react';
import { WorkItem, Project, User, WorkItemStatus, WorkItemPriority, WorkItemType, UserRole } from '../types';
import { Button } from './Button';

interface WorkItemFormData {
  title: string;
  description: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assignedTo: string;
  projectId: string;
}

interface WorkItemFormProps {
  initialData: WorkItem;
  projects: Project[];
  users: User[];
  currentUserRole?: UserRole;
  isLoading?: boolean;
  onSubmit: (data: WorkItemFormData) => void;
  onCancel: () => void;
}

export function WorkItemForm({
  initialData,
  projects,
  users,
  currentUserRole,
  isLoading = false,
  onSubmit,
  onCancel,
}: WorkItemFormProps) {
  const [formData, setFormData] = useState<WorkItemFormData>({
    title: '',
    description: '',
    type: 'task',
    status: 'open',
    priority: 'medium',
    assignedTo: '',
    projectId: '',
  });

  // Initialize form data when initialData changes
  // Note: Using setState in effect is necessary here to sync form with prop changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setFormData({
      title: initialData.title,
      description: initialData.description || '',
      type: initialData.type,
      status: initialData.status,
      priority: initialData.priority,
      assignedTo: initialData.assignedTo || '',
      projectId: initialData.projectId,
    });
  }, [initialData]);

  const updateFormData = (updates: Partial<WorkItemFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => updateFormData({ type: e.target.value as WorkItemType })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={currentUserRole === 'user'}
            >
              <option value="task">Task</option>
              <option value="bug">Bug</option>
              <option value="incident">Incident</option>
              <option value="request">Request</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => updateFormData({ status: e.target.value as WorkItemStatus })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => updateFormData({ priority: e.target.value as WorkItemPriority })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={currentUserRole === 'user'}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {(currentUserRole === 'manager' || currentUserRole === 'admin') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => updateFormData({ assignedTo: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Unassigned</option>
                {(users || []).map((u) => (
                  <option key={u?.id || ''} value={u?.id || ''}>
                    {u?.name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={formData.projectId}
              onChange={(e) => updateFormData({ projectId: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={currentUserRole === 'user'}
            >
              {(projects || []).map((project) => (
                <option key={project?.id || ''} value={project?.id || ''}>
                  {project?.name || 'Unknown Project'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          Save
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
