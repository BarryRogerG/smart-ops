import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useProjects } from '../hooks/useProjects';
import { Project } from '../types';
import { Layout } from '../components/Layout';
import { ProjectTable } from '../components/ProjectTable';
import { ProjectForm } from '../components/ProjectForm';

export function Projects() {
  const { projects, isLoading, loadProjects, createProject, updateProject, deleteProject } = useProjects();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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
        await createProject({
          name: formData.name,
          description: formData.description || undefined,
        });
        toast.success('Project created successfully');
      } else if (editingProject) {
        await updateProject(editingProject.id, {
          name: formData.name,
          description: formData.description || undefined,
        });
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

  // Ensure projects is always an array
  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
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

        <ProjectTable
          projects={safeProjects}
          onEdit={onEditClick}
          onDelete={onDeleteClick}
        />
      </div>
    </Layout>
  );
}
