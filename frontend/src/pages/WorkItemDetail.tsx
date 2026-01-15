import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { workItemsService } from '../services/workItems';
import { projectsService } from '../services/projects';
import { usersService } from '../services/users';
import { WorkItem, Project, User, WorkItemStatus, WorkItemPriority, WorkItemType } from '../types';
import { Layout } from '../components/Layout';

export function WorkItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workItem, setWorkItem] = useState<WorkItem | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as WorkItemType,
    status: 'open' as WorkItemStatus,
    priority: 'medium' as WorkItemPriority,
    assignedTo: '',
    projectId: '',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [item, projs, usrs] = await Promise.all([
        workItemsService.getById(id!),
        projectsService.getAll(),
        user?.role === 'admin' || user?.role === 'manager' ? usersService.getAll() : Promise.resolve([]),
      ]);
      setWorkItem(item);
      setProjects(projs);
      setUsers(usrs);
      setFormData({
        title: item.title,
        description: item.description || '',
        type: item.type,
        status: item.status,
        priority: item.priority,
        assignedTo: item.assignedTo || '',
        projectId: item.projectId,
      });
    } catch (error) {
      console.error('Failed to load work item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const updated = await workItemsService.update(id, formData);
      setWorkItem(updated);
      setIsEditing(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update work item');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this work item?')) return;

    try {
      await workItemsService.delete(id);
      navigate('/work-items');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete work item');
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
                  onClick={() => setIsEditing(true)}
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
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkItemType })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={user?.role === 'user'}
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
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as WorkItemStatus })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as WorkItemPriority })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={user?.role === 'user'}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {(user?.role === 'manager' || user?.role === 'admin') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={user?.role === 'user'}
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  loadData();
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
