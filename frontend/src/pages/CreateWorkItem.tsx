import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { workItemsService } from '../services/workItems';
import { projectsService } from '../services/projects';
import { usersService } from '../services/users';
import { Project, User, WorkItemType, WorkItemPriority } from '../types';
import { Layout } from '../components/Layout';
import { MOCK_PROJECTS, MOCK_USERS } from '../data/mockData';

export function CreateWorkItem() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as WorkItemType,
    priority: 'medium' as WorkItemPriority,
    assignedTo: '',
    projectId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const isShowcaseMode = user?.id === 'guest' || user?.email === 'guest@smartops.com';
    
    try {
      let projs: Project[] = [];
      let usrs: User[] = [];
      
      // In showcase mode, use mock data immediately
      if (isShowcaseMode) {
        projs = MOCK_PROJECTS;
        usrs = MOCK_USERS;
      } else {
        // Try to fetch from API
        try {
          const [projsResult, usrsResult] = await Promise.all([
            projectsService.getAll(),
            user?.role === 'admin' || user?.role === 'manager' ? usersService.getAll() : Promise.resolve([]),
          ]);
          
          // Ensure results are arrays
          projs = Array.isArray(projsResult) ? projsResult : [];
          usrs = Array.isArray(usrsResult) ? usrsResult : [];
          
          // Fallback to mock data if empty
          if (projs.length === 0) {
            projs = MOCK_PROJECTS;
          }
          if (usrs.length === 0 && (user?.role === 'admin' || user?.role === 'manager')) {
            usrs = MOCK_USERS;
          }
        } catch (apiError) {
          console.warn('[CreateWorkItem] API failed, using mock data:', apiError);
          // Use mock data as fallback
          projs = MOCK_PROJECTS;
          usrs = MOCK_USERS;
        }
      }
      
      // Ensure arrays are set (never undefined)
      setProjects(Array.isArray(projs) ? projs : []);
      setUsers(Array.isArray(usrs) ? usrs : []);
      
      // Set default project if available
      const safeProjs = Array.isArray(projs) ? projs : [];
      if (safeProjs.length > 0 && !formData.projectId) {
        setFormData((prev) => ({ ...prev, projectId: safeProjs[0]?.id || '' }));
      }
    } catch (error) {
      console.error('[CreateWorkItem] Failed to load data:', error);
      // On any error, use mock data
      setProjects(MOCK_PROJECTS);
      setUsers(MOCK_USERS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId) {
      toast.error('Please select a project');
      return;
    }

    try {
      const workItem = await workItemsService.create(formData);
      toast.success('Work item created successfully!');
      navigate(`/work-items/${workItem.id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create work item';
      toast.error(errorMessage);
      console.error('Failed to create work item:', error);
    }
  };

  // Defensive check: Don't render form until data is loaded and confirmed to be arrays
  if (isLoading || !Array.isArray(projects) || !Array.isArray(users)) {
    return (
      <Layout>
        <div className="px-4 py-6 sm:px-0">
          <div className="p-8 text-center text-gray-500">Loading form data...</div>
        </div>
      </Layout>
    );
  }

  // Ensure arrays are safe (defensive programming)
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Work Item</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
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
                >
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="incident">Incident</option>
                  <option value="request">Request</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as WorkItemPriority })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                    {(safeUsers || []).map((u) => (
                      <option key={u?.id || ''} value={u?.id || ''}>
                        {u?.name || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select a project</option>
                  {(safeProjects || []).map((project) => (
                    <option key={project?.id || ''} value={project?.id || ''}>
                      {project?.name || 'Unknown Project'}
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
              Create
            </button>
            <button
              type="button"
              onClick={() => navigate('/work-items')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
