import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProjects } from '../hooks/useProjects';
import { Project } from '../types';
import { Layout } from '../components/Layout';
import { ProjectTable } from '../components/ProjectTable';
import { ProjectForm } from '../components/ProjectForm';
import { MOCK_PROJECTS } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';

export function Projects() {
  const { user } = useAuth();
  const { projects, isLoading, loadProjects, createProject, updateProject, deleteProject } = useProjects();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localProjects, setLocalProjects] = useState<Project[]>([]);

  // Check if we're in showcase mode
  const isShowcaseMode = user?.id === 'guest' || user?.email === 'guest@smartops.com';

  useEffect(() => {
    loadProjects();
    // Reset form state when component mounts (e.g., navigating from nav bar)
    setIsCreating(false);
    setEditingProject(null);
  }, [loadProjects]);

  // Sync local state with projects from hook
  useEffect(() => {
    if (projects && projects.length > 0) {
      setLocalProjects(projects);
    } else if (isShowcaseMode) {
      setLocalProjects(MOCK_PROJECTS);
    }
  }, [projects, isShowcaseMode]);

  const onCreateClick = () => {
    setIsCreating(true);
    setEditingProject(null);
  };

  const onEditClick = (project: Project) => {
    setEditingProject(project);
    setIsCreating(false);
  };

  const handleFormSubmit = async (formData: {
    name: string;
    description: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (isCreating) {
        const newProject = await createProject({
          name: formData.name,
          description: formData.description || undefined,
        });
        
        // In showcase mode, add to local state if not already added
        if (isShowcaseMode && newProject) {
          setLocalProjects(prev => {
            // Check if project already exists
            if (prev.some(p => p.id === newProject.id)) {
              return prev;
            }
            return [...prev, newProject];
          });
        }
        
        toast.success('Project created successfully');
      } else if (editingProject) {
        const updatedProject = await updateProject(editingProject.id, {
          name: formData.name,
          description: formData.description || undefined,
        });
        
        // In showcase mode, update local state
        if (isShowcaseMode && updatedProject) {
          setLocalProjects(prev =>
            prev.map(p => p.id === updatedProject.id ? updatedProject : p)
          );
        }
        
        toast.success('Project updated successfully');
      }
      setIsCreating(false);
      setEditingProject(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${isCreating ? 'create' : 'update'} project`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsCreating(false);
    setEditingProject(null);
  };

  const onDeleteClick = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteProject(projectId);
      
      // In showcase mode, remove from local state
      if (isShowcaseMode) {
        setLocalProjects(prev => prev.filter(p => p.id !== projectId));
      }
      
      toast.success('Project deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete project');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-gray-500">Loading showcase data...</div>
      </Layout>
    );
  }

  // Use local projects in showcase mode, otherwise use projects from hook
  const safeProjects = isShowcaseMode ? localProjects : (projects ?? []) || MOCK_PROJECTS;

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        {/* Back to List Button - shown when editing/creating */}
        {(editingProject || isCreating) && (
          <div className="mb-6">
            <Link
              to="/projects"
              onClick={() => {
                setIsCreating(false);
                setEditingProject(null);
              }}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          {!isCreating && !editingProject && (
            <button
              onClick={onCreateClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create Project
            </button>
          )}
        </div>

        {(editingProject || isCreating) && (
          <ProjectForm
            initialData={editingProject}
            isCreating={isCreating}
            isLoading={isSubmitting}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        {!isCreating && !editingProject && (
          <ProjectTable
            projects={safeProjects}
            onEdit={onEditClick}
            onDelete={onDeleteClick}
          />
        )}
      </div>
    </Layout>
  );
}
