import { WorkItem } from '../types';

interface WorkItemViewProps {
  workItem: WorkItem;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function WorkItemView({ workItem, canEdit, canDelete, onEdit, onDelete }: WorkItemViewProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{workItem.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Created by {workItem.creator?.name} on{' '}
            {new Date(workItem.createdAt || '').toLocaleDateString()}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={onEdit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <p className="mt-1 text-sm text-gray-900">{workItem.type}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <p className="mt-1 text-sm text-gray-900">{workItem.status}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Priority</label>
          <p className="mt-1 text-sm text-gray-900">{workItem.priority}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Assigned To</label>
          <p className="mt-1 text-sm text-gray-900">
            {workItem.assignedUser?.name || 'Unassigned'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Project</label>
          <p className="mt-1 text-sm text-gray-900">{workItem.project?.name}</p>
        </div>
      </div>

      {workItem.description && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <p className="text-sm text-gray-900 whitespace-pre-line">{workItem.description}</p>
        </div>
      )}

      {canDelete && (
        <button
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Delete
        </button>
      )}
    </div>
  );
}
