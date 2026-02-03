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
  const { projects: apiProjects, isLoading, loadProjects, createProject, updateProject, deleteProject } = useProjects();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if we're in showcase mode
  const isShowcaseMode = user?.id === 'guest' || user?.email === 'guest@smartops.com';
  
  // Initialize proper state: Use useState with mock data (not static import)
  // This ensures UI doesn't reset on re-renders and changes persist
  const [projects, setProjects] = useState<Project[]>(() => {
    return isShowcaseMode ? [...MOCK_PROJECTS] : [];
  });
  const [hasSyncedWithAPI, setHasSyncedWithAPI] = useState(false);

  useEffect(() => {
    loadProjects();
    // Navigation fix: Reset form state when component mounts (e.g., clicking 'Projects' in nav)
    setIsCreating(false);
    setEditingProject(null);
  }, [loadProjects]);

  // Sync with API projects on initial load only
  useEffect(() => {
    if (!hasSyncedWithAPI && apiProjects && apiProjects.length > 0) {
      // Clean up State: Filter out any null/undefined values
      const cleanProjects = apiProjects.filter(p => p != null && p.id != null);
      setProjects(cleanProjects);
      setHasSyncedWithAPI(true);
    }
  }, [apiProjects, hasSyncedWithAPI]);

  const onCreateClick = () => {
    setIsCreating(true);
    setEditingProject(null);
  };

  const onEditClick = (project: Project) => {
    // Fix the Trigger: Ensure the full project object is passed and has valid ID
    if (!project || !project.id) {
      console.error('Invalid project passed to edit:', project);
      toast.error('Cannot edit: Invalid project data');
      return;
    }
    
    // Set the full project object into editing state
    setEditingProject(project);
    setIsCreating(false);
  };

  const handleFormSubmit = async (formData: {
    name: string;
    description: string;
  }) => {
    // Validation: Ensure Project Name is not empty
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Project name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreating) {
        // Fix handleSave (Create Mode): Generate unique ID
        const uniqueId = `project-${Date.now()}`;
        
        let newProject: Project;
        try {
          newProject = await createProject({
            name: formData.name.trim(),
            description: formData.description?.trim() || undefined,
          });
          
          // Ensure ID exists (for showcase mode)
          if (!newProject.id || newProject.id === '') {
            newProject = {
              ...newProject,
              id: uniqueId,
              createdAt: newProject.createdAt || new Date().toISOString(),
            };
          }
        } catch (error) {
          // In showcase mode, create project locally if API fails
          if (isShowcaseMode) {
            newProject = {
              id: uniqueId,
              name: formData.name.trim(),
              description: formData.description?.trim(),
              createdAt: new Date().toISOString(),
            };
          } else {
            throw error;
          }
        }
        
        // Fix handleSave (Create Mode): Use setProjects([...projects, newProject])
        // Clean up State: Ensure we don't add null or undefined values
        if (!newProject || !newProject.id) {
          console.error('Invalid project created:', newProject);
          toast.error('Failed to create project: Invalid project data');
          return;
        }
        
        setProjects(prev => {
          // Filter out any null/undefined values first
          const cleanPrev = prev.filter(p => p != null && p.id != null);
          
          // Check if project already exists
          if (cleanPrev.some(p => p.id === newProject.id)) {
            return cleanPrev;
          }
          // Add to top of list
          return [newProject, ...cleanPrev];
        });
        
        toast.success('Project created successfully');
        
        // UI Cleanup: Set isCreating to false to return to clean list view
        setIsCreating(false);
        setEditingProject(null);
      } else if (editingProject) {
        // Fix the Trigger: Ensure editingProject has valid ID before proceeding
        if (!editingProject || !editingProject.id) {
          console.error('Invalid editing project:', editingProject);
          toast.error('Cannot save: Invalid project data');
          setIsSubmitting(false);
          return;
        }
        
        // Fix handleSave (Edit Mode): Use .map() to find existing project by ID and replace it
        let updatedProject: Project;
        
        try {
          updatedProject = await updateProject(editingProject.id, {
            name: formData.name.trim(),
            description: formData.description?.trim() || undefined,
          });
        } catch (error) {
          // In showcase mode, update project locally if API fails
          if (isShowcaseMode) {
            updatedProject = {
              ...editingProject,
              name: formData.name.trim(),
              description: formData.description?.trim(),
            };
          } else {
            throw error;
          }
        }
        
        // Data Integrity Check: Validate at start - if updatedProject or updatedProject.id is missing, return early
        if (!updatedProject || !updatedProject.id) {
          console.warn('Invalid updated project received:', updatedProject);
          toast.error('Failed to update project: Invalid project data received');
          setIsSubmitting(false);
          return;
        }
        
        console.log('Saving project:', updatedProject);
        
        // Clean the Array: Filter out any 'ghost' items before mapping
        // Defensive Mapping Guard: Rewrite state update to be null-safe
        setProjects(prev => {
          // Clean the Array: Remove null/undefined items first
          const cleanProjects = prev.filter(p => p !== null && p !== undefined && p.id != null);
          
          // Defensive Mapping Guard: Null-safe mapping with explicit checks
          return cleanProjects.map(p => {
            // Ensure p exists and has id before comparison
            if (p && p.id && p.id === updatedProject.id) {
              return updatedProject;
            }
            return p;
          });
        });
        
        toast.success('Project updated successfully');
        
        // UI Transition: Immediately set isEditing(false) and setEditingProject(null) to clear workspace
        setIsCreating(false);
        setEditingProject(null);
      }
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
      
      // Remove from state immediately with defensive filtering
      setProjects(prev => prev.filter(p => p != null && p.id != null && p.id !== projectId));
      
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

  // Use projects state (initialized with useState)
  const safeProjects = projects;

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
            onBackToList={handleFormCancel}
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
